<!--
  src/pages/activity-report/index.vue

  Clon del Activity Report de Vout.net (solo Clock In / Clock Out). El empleado confirma su número
  de empleado EXTERNO y pide el clock: el backend valida que sea el suyo, localiza el socket de su
  app de escritorio y esta lo ejecuta como si hubiera pulsado el botón (origen ACTIVITY_REPORT).
  Si la app no responde, el clock out puede cerrarse desde aquí indicando un motivo.
-->
<template>
  <PageContainer variant="fluid">
    <!-- Encabezado: marca + estado + app NIO, en una sola tarjeta de dos líneas -->
    <v-card class="ar-head mb-4" variant="flat" border>
      <div class="ar-head__top">
        <h1 class="ar-brand">
          <span class="ar-brand__mark">N<span class="ar-brand__accent">IO</span></span>
          <span class="ar-brand__divider" aria-hidden="true">/</span>
          <span class="ar-brand__page">Activity Report</span>
        </h1>
        <div class="ar-head__time" :title="zoneTooltip">
          <span class="ar-clock">{{ headClock }}</span>
          <span class="ar-head__time-meta">{{ headMeta }}</span>
        </div>
      </div>

      <div class="ar-head__bottom">
        <span class="ar-employee">{{ fullName }}</span>

        <!-- Informativo: solo texto con punto de color, sin relleno (no se confunde con un botón) -->
        <div v-if="!ready" class="ar-info" aria-hidden="true">
          <v-skeleton-loader v-for="w in [150, 130, 90, 120]" :key="w" type="text" :width="w" class="ar-skel-text" />
        </div>
        <div v-else class="ar-info" role="status" aria-live="polite">
          <span class="ar-stat" :class="activityIn ? 'ar-stat--ok' : outOfSync ? 'ar-stat--warn' : ''">
            <i class="ar-stat__dot" />Activity: {{ activityIn ? (lunchOpen ? 'On lunch' : brbOpen ? 'On BRB' : bioOpen ? 'On bio break' : 'Clocked In') : 'Clocked Out' }}
          </span>
          <span class="ar-stat" :class="nioIn ? 'ar-stat--ok' : outOfSync ? 'ar-stat--warn' : ''">
            <i class="ar-stat__dot" />NIO: {{ nioIn ? 'Clocked In' : 'Clocked Out' }}
          </span>

          <v-tooltip v-if="linked" location="bottom" max-width="300">
            <template #activator="{ props: tip }">
              <span v-bind="tip" class="ar-mode ar-mode--linked"><v-icon size="14">mdi-link-variant</v-icon>NIO + AR</span>
            </template>
            Your NIO app and this Activity Report work together: you can only Clock In / Clock Out here while
            your NIO desktop app is open, and the clock button inside the NIO app is disabled.
          </v-tooltip>
          <v-tooltip v-else location="bottom" max-width="300">
            <template #activator="{ props: tip }">
              <span v-bind="tip" class="ar-mode"><v-icon size="14">mdi-link-variant-off</v-icon>NIO | AR</span>
            </template>
            Independent mode: the NIO app and this Activity Report each have their own clock. Clocking here does
            not affect the NIO app, and vice versa.
          </v-tooltip>

          <v-tooltip location="bottom" max-width="320">
            <template #activator="{ props: tip }">
              <span
                v-bind="tip"
                class="ar-stat"
                :class="appState.kind === 'online' ? 'ar-stat--ok' : appState.kind === 'offline' ? 'ar-stat--err' : ''"
              >
                <i class="ar-stat__dot" :class="{ 'ar-stat__dot--pulse': appState.kind === 'online' }" />{{ appState.title }}
              </span>
            </template>
            {{ appState.detail }}
          </v-tooltip>
        </div>

        <v-spacer />

        <!-- Acciones: botones -->
        <div class="ar-actions">
          <v-btn
            v-if="outOfSync"
            size="small"
            variant="flat"
            color="warning"
            prepend-icon="mdi-sync"
            :loading="busy === 'SYNC'"
            :disabled="busy !== null"
            @click="syncModes"
          >
            Sync
          </v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="mdi-refresh" :loading="refreshing" @click="refreshAll">
            Refresh
          </v-btn>
        </div>
      </div>

      <!-- Aviso de desincronización: texto de advertencia, no accionable -->
      <div v-if="outOfSync" class="ar-warn" role="alert">
        <v-icon size="16">mdi-sync-alert</v-icon>
        <span><strong>Out of sync</strong> · {{ syncNote }}. Use <strong>Sync</strong> to align both.</span>
      </div>
    </v-card>

    <!-- Carga inicial: esqueleto con la misma estructura hasta que terminan de llegar los estados -->
    <div v-if="!ready" role="status" aria-live="polite" aria-busy="true">
      <span class="ar-sr-only">Loading Activity Report…</span>
      <v-card class="pa-5 mb-4">
        <div class="d-flex flex-wrap align-start ga-6">
          <v-skeleton-loader type="heading" width="360" class="ar-skel-field" />
          <div class="d-flex flex-wrap justify-center ga-4 flex-grow-1">
            <v-skeleton-loader v-for="n in 2" :key="n" type="image" width="180" height="150" class="ar-skel-action" />
          </div>
        </div>
      </v-card>
      <v-row>
        <v-col v-for="n in 2" :key="n" cols="12" md="6">
          <v-card class="pa-4 h-100">
            <v-skeleton-loader type="heading, text, list-item-two-line@3" />
          </v-card>
        </v-col>
      </v-row>
    </div>

    <template v-else>
    <!-- Acciones -->
    <v-alert
      v-if="useExternalAr"
      type="info"
      variant="tonal"
      class="mb-4"
      text="This user uses the external AR. The NIO Activity Report is disabled."
    />
    <v-card v-else class="pa-5 mb-4">
      <div class="d-flex flex-wrap align-start ga-6">
        <div class="d-flex flex-column align-center ga-1 flex-grow-1">
          <div class="d-flex flex-wrap justify-center ga-4">
            <div
              v-if="!activityIn"
              class="ar-action ar-action--in"
              :class="{ 'ar-action--disabled': !canClock }"
              role="button"
              :tabindex="canClock ? 0 : -1"
              :aria-disabled="!canClock"
              @click="onClockIn"
              @keyup.enter="onClockIn"
            >
              <div class="ar-action-center">
                <v-progress-circular v-if="busy === 'CLOCK_IN'" indeterminate size="48" />
                <v-progress-circular
                  v-else-if="cooling"
                  :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                  size="76"
                  width="5"
                  color="success"
                  :aria-label="`Wait ${cooldownLeft} seconds`"
                >
                  <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                </v-progress-circular>
                <span v-else class="ar-action-stack">
                  <ArActionIcon name="in" :size="44" />
                  <span class="ar-action-timer">{{ sessionTime }}</span>
                </span>
              </div>
              <div class="ar-action-label">CLOCK IN</div>
            </div>

            <template v-else>
              <!-- Con una pausa en curso no se ofrece Clock Out: primero se regresa de la pausa.
                   Con actividades abiertas queda deshabilitado: primero se cierran. -->
              <div
                v-if="!breakOpen"
                class="ar-action ar-action--out"
                :class="{ 'ar-action--disabled': !canClockOut }"
                role="button"
                :tabindex="canClockOut ? 0 : -1"
                :aria-disabled="!canClockOut"
                @click="askClockOut"
                @keyup.enter="askClockOut"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'CLOCK_OUT'" indeterminate size="48" color="error" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    color="error"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <span v-else class="ar-action-stack">
                    <ArActionIcon name="out" :size="44" />
                    <span class="ar-action-timer">{{ sessionTime }}</span>
                  </span>
                </div>
                <div class="ar-action-label">CLOCK OUT</div>
              </div>

              <!-- Con actividades abiertas no se ofrece lunch: primero Activity Out -->
              <div
                v-if="!breakOpen && !hasOpenActivities"
                class="ar-action ar-action--lunch"
                :class="{ 'ar-action--disabled': !canLunch }"
                role="button"
                :tabindex="canLunch ? 0 : -1"
                :aria-disabled="!canLunch"
                @click="canLunch && doLunch('IN')"
                @keyup.enter="canLunch && doLunch('IN')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'LUNCH_IN'" indeterminate size="48" color="warning" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    color="warning"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <ArActionIcon v-else name="lunch-go" :size="64" />
                </div>
                <div class="ar-action-label">GO TO LUNCH</div>
              </div>

              <div
                v-else-if="lunchOpen"
                class="ar-action ar-action--back"
                :class="{ 'ar-action--disabled': !canLunch }"
                role="button"
                :tabindex="canLunch ? 0 : -1"
                :aria-disabled="!canLunch"
                @click="canLunch && doLunch('OUT')"
                @keyup.enter="canLunch && doLunch('OUT')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'LUNCH_OUT'" indeterminate size="48" color="success" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    color="success"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <span v-else class="ar-action-stack">
                    <ArActionIcon name="lunch-back" :size="44" />
                    <span class="ar-action-timer" aria-label="Lunch time elapsed">{{ lunchTime }}</span>
                  </span>
                </div>
                <div class="ar-action-label">BACK TO LUNCH</div>
              </div>

              <!-- Be right back: pausa corta (misma mecánica que el lunch, con tolerancia por evento) -->
              <div
                v-if="!breakOpen"
                class="ar-action ar-action--brb"
                :class="{ 'ar-action--disabled': !canBrb }"
                role="button"
                :tabindex="canBrb ? 0 : -1"
                :aria-disabled="!canBrb"
                @click="canBrb && doBrb('IN')"
                @keyup.enter="canBrb && doBrb('IN')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'BRB_IN'" indeterminate size="48" color="info" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    color="info"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <ArActionIcon v-else name="brb-go" :size="64" />
                </div>
                <div class="ar-action-label">BE RIGHT BACK</div>
              </div>

              <div
                v-if="brbOpen"
                class="ar-action ar-action--brb"
                :class="{ 'ar-action--disabled': !canBrb, 'ar-action--critical': brbCritical }"
                role="button"
                :tabindex="canBrb ? 0 : -1"
                :aria-disabled="!canBrb"
                @click="canBrb && doBrb('OUT')"
                @keyup.enter="canBrb && doBrb('OUT')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'BRB_OUT'" indeterminate size="48" :color="brbCritical ? 'error' : 'info'" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    :color="brbCritical ? 'error' : 'info'"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <span v-else class="ar-action-stack">
                    <ArActionIcon name="brb-back" :size="44" />
                    <span class="ar-action-timer" aria-label="Be right back time elapsed">{{ brbTime }}</span>
                  </span>
                </div>
                <div class="ar-action-label">I'M BACK</div>
              </div>

              <!-- Bio break: pausa corta (misma mecánica que el BRB, con su propia tolerancia por evento).
                   Puede iniciarse con actividades abiertas: las pausa. -->
              <div
                v-if="!breakOpen"
                class="ar-action ar-action--bio"
                :class="{ 'ar-action--disabled': !canBio }"
                role="button"
                :tabindex="canBio ? 0 : -1"
                :aria-disabled="!canBio"
                @click="canBio && doBio('IN')"
                @keyup.enter="canBio && doBio('IN')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'BIO_IN'" indeterminate size="48" color="secondary" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    color="secondary"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <ArActionIcon v-else name="bio-go" :size="64" />
                </div>
                <div class="ar-action-label">BIO BREAK</div>
              </div>

              <div
                v-if="bioOpen"
                class="ar-action ar-action--bio"
                :class="{ 'ar-action--disabled': !canBio, 'ar-action--critical': bioCritical }"
                role="button"
                :tabindex="canBio ? 0 : -1"
                :aria-disabled="!canBio"
                @click="canBio && doBio('OUT')"
                @keyup.enter="canBio && doBio('OUT')"
              >
                <div class="ar-action-center">
                  <v-progress-circular v-if="busy === 'BIO_OUT'" indeterminate size="48" :color="bioCritical ? 'error' : 'secondary'" />
                  <v-progress-circular
                    v-else-if="cooling"
                    :model-value="(cooldownLeft / COOLDOWN_SEC) * 100"
                    size="76"
                    width="5"
                    :color="bioCritical ? 'error' : 'secondary'"
                    :aria-label="`Wait ${cooldownLeft} seconds`"
                  >
                    <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                  </v-progress-circular>
                  <span v-else class="ar-action-stack">
                    <ArActionIcon name="bio-back" :size="44" />
                    <span class="ar-action-timer" aria-label="Bio break time elapsed">{{ bioTime }}</span>
                  </span>
                </div>
                <div class="ar-action-label">I'M BACK</div>
              </div>

              <!-- Activity (multitask): solo registro del AR. Con una pausa abierta solo se ve su regreso. -->
              <template v-if="!breakOpen">
                <div
                  v-for="a in openActivities"
                  :key="a.event.id"
                  class="ar-action ar-action--act"
                  :class="{ 'ar-action--disabled': busy !== null }"
                  role="button"
                  :tabindex="busy === null ? 0 : -1"
                  :aria-disabled="busy !== null"
                  @click="busy === null && openActivityOut(a.event)"
                  @keyup.enter="busy === null && openActivityOut(a.event)"
                >
                  <div class="ar-action-center">
                    <span class="ar-action-stack">
                      <ArActionIcon name="act-out" :size="44" />
                      <span class="ar-action-timer" :aria-label="`Activity ${a.n} time elapsed`">{{ a.time }}</span>
                    </span>
                  </div>
                  <div class="ar-action-label">ACTIVITY OUT #{{ a.n }}</div>
                  <div class="ar-action-sublabel" :title="a.title">{{ a.title }}</div>
                </div>

                <!-- Activity In: tile "agregar" aparte (verde, translúcido, con +) a la derecha de las actividades abiertas. Se entiende que se pueden abrir varias (multitask). -->
                <span class="ar-actions-sep" aria-hidden="true"><span class="ar-actions-sep__text">Multitask</span></span>
                <div
                  class="ar-action ar-action--add"
                  :class="{ 'ar-action--disabled': !canActivity, 'ar-action--full': openActivitiesCount >= ACTIVITY_MAX_OPEN }"
                  role="button"
                  :tabindex="canActivity ? 0 : -1"
                  :aria-disabled="!canActivity"
                  :aria-label="`Activity In, ${openActivitiesCount} of ${ACTIVITY_MAX_OPEN} activities open`"
                  @click="canActivity && openActivityIn()"
                  @keyup.enter="canActivity && openActivityIn()"
                >
                  <div class="ar-action-center">
                    <v-progress-circular v-if="busy === 'ACTIVITY'" indeterminate size="48" color="success" />
                    <svg v-else class="ar-add-ico" width="68" height="68" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
                      <circle class="ar-add-ring" cx="32" cy="32" r="29" />
                      <circle class="ar-add-disc" cx="32" cy="32" r="22" />
                      <path class="ar-add-plus" d="M32 21v22M21 32h22" />
                    </svg>
                  </div>
                  <div class="ar-action-label">ACTIVITY IN</div>
                  <div class="ar-add-meter" aria-hidden="true">
                    <span class="ar-add-pips">
                      <i v-for="n in ACTIVITY_MAX_OPEN" :key="n" class="ar-add-pip" :class="{ 'is-open': n <= openActivitiesCount }" />
                    </span>
                    <strong class="ar-add-count">{{ openActivitiesCount }}/{{ ACTIVITY_MAX_OPEN }}</strong>
                  </div>
                  <div class="ar-action-sublabel">{{
                    openActivitiesCount >= ACTIVITY_MAX_OPEN ? 'Limit reached' : openActivitiesCount > 0 ? 'Add another' : 'Start an activity'
                  }}</div>
                </div>
              </template>
            </template>
          </div>
          <div v-if="linked && !appConnected" class="text-caption text-error" aria-live="polite">
            Open your NIO app to Clock In / Clock Out here
          </div>
          <div v-else-if="linked && localCheck?.checked && !localCheck.ok" class="text-caption text-error" aria-live="polite">
            {{ localCheck.message }}
          </div>
          <div v-else-if="lunchOpen" class="text-caption text-warning">On lunch · come back to lunch to clock out</div>
          <div
            v-else-if="brbOpen"
            class="text-caption"
            :class="brbCritical ? 'text-error font-weight-bold' : 'text-info'"
            aria-live="polite"
          >
            {{
              brbCritical
                ? `On BRB for more than ${brbToleranceText} · the extra time now counts against your performance`
                : `On BRB · tap I'M BACK to clock out (each BRB up to ${brbToleranceText} has no performance impact)`
            }}
          </div>
          <div
            v-else-if="bioOpen"
            class="text-caption"
            :class="bioCritical ? 'text-error font-weight-bold' : 'text-secondary'"
            aria-live="polite"
          >
            {{
              bioCritical
                ? `On bio break for more than ${bioToleranceText} · the extra time now counts against your performance`
                : `On bio break · tap I'M BACK to continue (each bio break up to ${bioToleranceText} has no performance impact)`
            }}
          </div>
          <div v-else-if="hasOpenActivities" class="text-caption text-medium-emphasis">
            {{ openActivitiesCount }} open {{ openActivitiesCount === 1 ? 'activity' : 'activities' }} · close your activities to clock out or go to lunch
          </div>
          <div v-else-if="cooling" class="ar-sr-only" aria-live="polite">
            Your desktop app is finishing the last clock — wait {{ cooldownLeft }}s
          </div>
          <div v-else class="text-caption text-medium-emphasis">Worked time today (lunch, BRB and bio breaks excluded)</div>
        </div>
      </div>
    </v-card>

    <!-- Dos modelos separados: NIO (asistencia) y Activity (tabla propia).
         La columna NIO solo existe en modo NIO + AR / NIO + AR VOUT (activity_linked = `linked`);
         sin vínculo la app NIO no comanda este AR y Activity ocupa todo el ancho. -->
    <v-row>
      <v-col v-if="linked" cols="12" md="6">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">NIO</div>
            <v-chip size="x-small" variant="tonal">{{ nioRows.length }}</v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mb-2">Attendance records of the day</div>
          <div v-if="!nioRows.length" class="text-body-2 text-medium-emphasis py-2">No NIO records yet today.</div>
          <v-list v-else density="compact" lines="one" class="pa-0 ar-events">
            <v-list-item v-for="r in nioRows" :key="r.id" class="px-0">
              <template #prepend>
                <v-icon :color="nioColor(r)" size="18" class="me-3">{{ nioIcon(r) }}</v-icon>
              </template>
              <v-list-item-title :class="nioKind(r) === 'CLOCK_OUT' ? 'text-error' : ''">
                {{ nioTitle(r) }} · {{ nioTime(r) }}
              </v-list-item-title>
              <template v-if="r.source && r.source !== 'MANUAL'" #append>
                <v-chip size="x-small" variant="tonal">{{ sourceLabel(r.source) }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" :md="linked ? 6 : 12">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">Activity</div>
            <v-chip size="x-small" variant="tonal" color="primary">{{ activityRows.length }}</v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mb-2">Clock, breaks and activities of the Activity Report</div>
          <div v-if="!activityRows.length" class="text-body-2 text-medium-emphasis py-2">
            No Activity events yet today.
          </div>
          <v-list v-else density="compact" lines="three" class="pa-0 ar-events">
            <v-list-item v-for="e in activityRows" :key="e.id" class="px-0">
              <template #prepend>
                <v-icon :color="activityColor(e)" size="18" class="me-3">{{ activityIcon(e) }}</v-icon>
              </template>
              <v-list-item-title :class="e.type_of_activity === 'CLOCK OUT' ? 'text-error' : ''">
                {{ activityTitle(e) }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ activityDetail(e) }}</v-list-item-subtitle>
              <v-list-item-subtitle
                v-if="e.type_of_activity === 'ACTIVITY' && e.activity_description"
                class="ar-act-notes"
                :class="{ 'ar-act-notes--open': notesOpen[e.id] }"
                title="Click to expand / collapse the notes"
                @click="notesOpen[e.id] = !notesOpen[e.id]"
              >
                {{ e.activity_description }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="e.via === 'ADMIN' && e.note" class="ar-note">
                Note: {{ e.note }}
              </v-list-item-subtitle>
              <template v-if="closedByChip(e) || canEditActivity(e)" #append>
                <div class="d-flex align-center ga-1">
                  <v-chip v-if="closedByChip(e)" size="x-small" variant="tonal" :color="closedByChip(e)!.color">
                    {{ closedByChip(e)!.text }}
                  </v-chip>
                  <template v-if="canEditActivity(e)">
                    <v-btn icon size="x-small" variant="text" aria-label="Edit activity" :disabled="busy !== null" @click.stop="openActivityEdit(e)">
                      <v-icon size="16">mdi-pencil-outline</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="error" aria-label="Delete activity" :disabled="busy !== null" @click.stop="openActivityDelete(e)">
                      <v-icon size="16">mdi-delete-outline</v-icon>
                    </v-btn>
                  </template>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    </template>

    <!-- Confirmación de Clock Out (frase) -->
    <v-dialog v-model="confirm.show" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-error">Confirm Clock Out</v-card-title>
        <v-card-text>
          Your shift for today will be finished. Type <strong>“{{ REQUIRED_PHRASE }}”</strong> to continue.
          <v-text-field
            v-model="confirm.text"
            :label="`Type: ${REQUIRED_PHRASE}`"
            autofocus
            variant="outlined"
            density="comfortable"
            class="mt-3"
            @keyup.enter="confirmReady && confirmClockOut()"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeConfirm">Cancel</v-btn>
          <v-btn color="error" variant="flat" :disabled="!confirmReady" @click="confirmClockOut">Clock Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Respaldo: la app no respondió -->
    <v-dialog v-model="fallback.show" max-width="520" persistent>
      <v-card>
        <v-card-title>Your desktop app did not respond</v-card-title>
        <v-card-text>
          You can close your shift from here. It is recorded as made by you from the Activity Report, with the
          server time and the reason you choose. No activity data or screenshot is attached.
          <v-select
            v-model="fallback.reason"
            :items="reasonItems"
            label="Reason"
            variant="outlined"
            density="comfortable"
            class="mt-4 mb-3"
          />
          <v-textarea
            v-model="fallback.note"
            label="Note (optional)"
            variant="outlined"
            density="comfortable"
            rows="2"
            maxlength="300"
            counter
          />
          <v-alert v-if="fallback.error" type="error" variant="tonal" density="compact" class="mt-2">
            {{ fallback.error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="fallback.loading" @click="fallback.show = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="fallback.loading" :disabled="!fallback.reason" @click="submitFallback">
            Close my shift
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Activity: In (título) / Out (notas) / Edit / Delete -->
    <v-dialog v-model="act.show" max-width="520" persistent>
      <v-card>
        <v-card-title :class="act.mode === 'delete' ? 'text-error' : ''">
          {{
            act.mode === 'in'
              ? 'Activity In'
              : act.mode === 'out'
                ? 'Activity Out'
                : act.mode === 'edit'
                  ? 'Edit activity'
                  : 'Delete activity'
          }}
        </v-card-title>
        <v-card-text>
          <template v-if="act.mode === 'in'">
            What are you going to work on? Other activities can stay open at the same time.
            <v-text-field
              v-model="act.title"
              label="Title"
              autofocus
              variant="outlined"
              density="comfortable"
              class="mt-3"
              :counter="ACTIVITY_TITLE_MAX"
              :maxlength="ACTIVITY_TITLE_MAX"
              :rules="actTitleRules"
              @keyup.enter="actCanSubmit && submitAct()"
            />
          </template>

          <template v-else-if="act.mode === 'out'">
            <div class="text-caption text-medium-emphasis">Activity</div>
            <div class="text-subtitle-1 font-weight-bold mb-3 ar-act-title">{{ act.origTitle }}</div>
            <v-textarea
              v-model="act.notes"
              label="Notes"
              autofocus
              variant="outlined"
              density="comfortable"
              rows="4"
              auto-grow
              :counter="ACTIVITY_NOTES_MAX"
              :maxlength="ACTIVITY_NOTES_MAX"
              :rules="actNotesRules"
              :hint="`At least ${ACTIVITY_NOTES_MIN} characters: what did you do?`"
              persistent-hint
            />
          </template>

          <template v-else-if="act.mode === 'edit'">
            <v-text-field
              v-model="act.title"
              label="Title"
              autofocus
              variant="outlined"
              density="comfortable"
              :counter="ACTIVITY_TITLE_MAX"
              :maxlength="ACTIVITY_TITLE_MAX"
              :rules="actTitleRules"
            />
            <v-textarea
              v-if="act.closed"
              v-model="act.notes"
              label="Notes"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              rows="4"
              auto-grow
              :counter="ACTIVITY_NOTES_MAX"
              :maxlength="ACTIVITY_NOTES_MAX"
              :rules="actNotesRules"
            />
          </template>

          <template v-else>
            This activity will be deleted from today's report:
            <div class="text-subtitle-1 font-weight-bold mt-2 ar-act-title">{{ act.origTitle }}</div>
          </template>

          <v-alert v-if="act.error" type="error" variant="tonal" density="compact" class="mt-3">
            {{ act.error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="act.loading" @click="closeAct">Cancel</v-btn>
          <v-btn
            :color="act.mode === 'delete' ? 'error' : 'primary'"
            variant="flat"
            :loading="act.loading"
            :disabled="!actCanSubmit"
            @click="submitAct"
          >
            {{
              act.mode === 'in' ? 'Start activity' : act.mode === 'out' ? 'Finish activity' : act.mode === 'edit' ? 'Save' : 'Delete'
            }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="5000" multi-line>
      {{ snack.text }}
    </v-snackbar>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import { useAuth } from '@/stores/auth/useAuth'
import NovaInOutServices from '@/services/NovaInOutServices'
import { useAdminSocket } from '@/composables/useAdminSocket'
import { remoteClockService } from '@/services/remoteClock.service'
import { localAppService, type LocalCheck } from '@/services/localApp.service'
import ArActionIcon from '@/components/ActivityReport/ArActionIcon.vue'
import { FORCE_CLOCK_OUT_REASON_LABEL } from '@/types/adminClockOut'
import {
  SELF_CLOCK_OUT_REASONS,
  SELF_CLOCK_OUT_REASON_LABEL,
  type ActivityDay,
  type ActivityEvent,
  type BioAction,
  type BrbAction,
  type ClockRecord,
  type LunchAction,
  type RemoteClockError,
  type RemoteClockStatus,
  type SelfClockOutReason,
} from '@/types/remoteClock'
import {
  chicagoDate,
  chicagoTime,
  clockRowsOf,
  lifecycleRowsOf,
  hhmmssToSeconds,
  isClockedIn,
  secondsToHHMMSS,
  sourceLabel,
} from '@/utils/clockSession'
import {
  browserTimeZone,
  formatLocalClock,
  formatLocalDate,
  formatLocalTime,
  isChicagoZone,
  zoneCity,
  zoneOffsetLabel,
} from '@/utils/localTime'
import { brbOverSeconds, brbToleranceLabel, brbToleranceOf, isBrbCritical } from '@/utils/brb'
import { bioOverSeconds, bioToleranceLabel, bioToleranceOf, isBioCritical } from '@/utils/bio'
import {
  ACTIVITY_MAX_OPEN,
  ACTIVITY_NOTES_MAX,
  ACTIVITY_NOTES_MIN,
  ACTIVITY_TITLE_MAX,
  activityNetSeconds,
  isOpenEvent,
  notesRule,
  titleRule,
} from '@/utils/activityTasks'


const REQUIRED_PHRASE = 'clock out'
const POLL_MS = 15000
/** Pausa tras cada clock: la misma que aplica la app de escritorio (antirrebote de su botón). */
const COOLDOWN_SEC = 15

const auth = useAuth()
// Canal en vivo (mismo socket que usa el resto de la web): cambios de modo vinculado y estado de la app.
const live = useAdminSocket()
let offLinked: (() => void) | null = null
let offPresence: (() => void) | null = null

const fullName = computed(
  () => `${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}`.trim() || auth.user?.email || '',
)

// ── estado ─────────────────────────────────────────────────────────────────
const records = ref<ClockRecord[]>([])
const status = ref<RemoteClockStatus | null>(null)
const activity = ref<ActivityDay | null>(null)
const busy = ref<
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'LUNCH_IN'
  | 'LUNCH_OUT'
  | 'BRB_IN'
  | 'BRB_OUT'
  | 'BIO_IN'
  | 'BIO_OUT'
  | 'ACTIVITY'
  | 'SYNC'
  | null
>(null)
const refreshing = ref(false)
/** false hasta que termina la primera carga de estados: mientras tanto se muestra el esqueleto. */
const ready = ref(false)

const nowTime = ref(chicagoTime())
const nowMs = ref(Date.now())
// Solo presentación: el reloj y las horas se muestran en la zona del NAVEGADOR; la lógica sigue en hora de Chicago.
const headClock = computed(() => (isChicagoZone() ? nowTime.value : formatLocalClock(new Date(nowMs.value))))
const headMeta = computed(() =>
  isChicagoZone() ? `Chicago · ${today.value}` : `${zoneCity()} · ${formatLocalDate(new Date(nowMs.value))}`,
)
const zoneTooltip = computed(() =>
  isChicagoZone()
    ? undefined
    : `Your browser time zone (${browserTimeZone()}, ${zoneOffsetLabel(new Date(nowMs.value))}). Records are stored in Chicago time.`,
)
/** Fin (epoch ms) de la pausa abierta por un clock pedido desde esta página. */
const localCooldownEnd = ref(0)
const today = ref(chicagoDate())
let tick: ReturnType<typeof setInterval> | null = null
let poll: ReturnType<typeof setInterval> | null = null

// Filas del NIO: CLOCK + pausas (el antirrebote de 15 s también cuenta el último go/back de lunch o BRB)
const rows = computed(() => lifecycleRowsOf(records.value))
const nioRows = computed(() => [...rows.value].reverse())
const nioIn = computed(() => isClockedIn(records.value))

const activityEvents = computed(() => activity.value?.events ?? [])
const linked = computed(() => activity.value?.linked ?? false)
// "Use external AR": con true el AR usa el número de RR.HH. del perfil; si no, el del NIO. Lo informa el servidor.
const useExternalAr = computed(() => activity.value?.useExternalAr === true)
const arNumber = computed(() => (activity.value?.arNumber ?? auth.user?.employee_number ?? '').trim())
const activityIn = computed(() => activity.value?.state.clockedIn ?? false)
/** Modo NIO + AR: los dos van de la mano; turno abierto en uno solo = desincronizado. */
const outOfSync = computed(() => linked.value && nioIn.value !== activityIn.value)
const syncNote = computed(() =>
  !outOfSync.value
    ? ''
    : nioIn.value
      ? 'NIO is clocked in, Activity is not'
      : 'Activity is clocked in, NIO is not',
)
const lunchOpen = computed(() => activity.value?.state.lunchOpen ?? false)
const brbOpen = computed(() => activity.value?.state.brbOpen ?? false)
const bioOpen = computed(() => activity.value?.state.bioOpen ?? false)
/** Solo hay una pausa abierta a la vez (lunch, BRB o bio break). */
const breakOpen = computed(() => lunchOpen.value || brbOpen.value || bioOpen.value)
/** Tolerancia (s) de cada BRB: la informa el backend; si no, el respaldo del util. */
const brbTolerance = computed(() =>
  brbToleranceOf(activity.value?.state.brbToleranceSec ?? activity.value?.brbToleranceSec),
)
const brbToleranceText = computed(() => brbToleranceLabel(brbTolerance.value))
/** Tolerancia (s) de cada bio break: la informa el backend; si no, el respaldo del util. */
const bioTolerance = computed(() =>
  bioToleranceOf(activity.value?.state.bioToleranceSec ?? activity.value?.bioToleranceSec),
)
const bioToleranceText = computed(() => bioToleranceLabel(bioTolerance.value))
const activityRows = computed(() =>
  [...activityEvents.value].sort(
    (x, y) => hhmmssToSeconds(y.start_time) - hhmmssToSeconds(x.start_time) || y.id - x.id,
  ),
)

/** Tiempo trabajado en el Activity: tramos clock in→out menos lunch, BRB y bio break (el abierto cuenta hasta ahora). */
const sessionTime = computed(() => {
  const now = hhmmssToSeconds(nowTime.value)
  const evs = [...activityEvents.value].sort(
    (x, y) => hhmmssToSeconds(x.start_time) - hhmmssToSeconds(y.start_time) || x.id - y.id,
  )
  let total = 0
  let openAt: number | null = null
  for (const e of evs) {
    if (e.type_of_activity === 'CLOCK IN') {
      if (openAt === null) openAt = hhmmssToSeconds(e.start_time)
    } else if (e.type_of_activity === 'CLOCK OUT') {
      if (openAt !== null) total += Math.max(0, hhmmssToSeconds(e.start_time) - openAt)
      openAt = null
    }
  }
  if (openAt !== null) total += Math.max(0, now - openAt)
  for (const e of evs) {
    if (e.type_of_activity !== 'LUNCH' && e.type_of_activity !== 'BRB' && e.type_of_activity !== 'BIO BREAK') continue
    const start = hhmmssToSeconds(e.start_time)
    const end = isBreakOpen(e) ? now : hhmmssToSeconds(e.end_time)
    total -= Math.max(0, end - start)
  }
  return secondsToHHMMSS(Math.max(0, total))
})

/** Cronómetro del lunch en curso (desde el Go to lunch hasta ahora). */
const lunchTime = computed(() => {
  const open = activityEvents.value.find(isLunchOpen)
  if (!open) return '00:00:00'
  return secondsToHHMMSS(hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(open.start_time))
})

/** Segundos del BRB en curso (desde el Be right back hasta ahora). */
const brbSeconds = computed(() => {
  const open = activityEvents.value.find(isBrbOpen)
  return open ? Math.max(0, hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(open.start_time)) : 0
})
const brbTime = computed(() => secondsToHHMMSS(brbSeconds.value))
/** Crítico: el BRB en curso ya pasó su tolerancia (el exceso cuenta contra el performance). */
const brbCritical = computed(() => brbOpen.value && isBrbCritical(brbSeconds.value, brbTolerance.value))

/** Segundos del bio break en curso (desde el Bio break hasta ahora). */
const bioSeconds = computed(() => {
  const open = activityEvents.value.find(isBioOpen)
  return open ? Math.max(0, hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(open.start_time)) : 0
})
const bioTime = computed(() => secondsToHHMMSS(bioSeconds.value))
/** Crítico: el bio break en curso ya pasó su tolerancia (el exceso cuenta contra el performance). */
const bioCritical = computed(() => bioOpen.value && isBioCritical(bioSeconds.value, bioTolerance.value))

/**
 * Segundos de pausa restantes. Toma el mayor de: (a) 15 s desde que la app confirmó el último
 * clock pedido aquí y (b) 15 s desde el último registro NIO del día, que también cubre un clock
 * manual en la app o una página recargada.
 */
const cooldownLeft = computed(() => {
  const fromLocal = Math.ceil((localCooldownEnd.value - nowMs.value) / 1000)
  const last = rows.value[rows.value.length - 1]
  const sinceLast = last ? hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(last.clock_time) : COOLDOWN_SEC
  const fromRecord = Math.min(COOLDOWN_SEC, COOLDOWN_SEC - sinceLast)
  return Math.max(0, fromLocal, fromRecord)
})
const hasExternal = computed(() => !!arNumber.value)
// La pausa de 15 s protege al botón de la app de escritorio: solo aplica si esa app está activa.
const appConnected = computed(() => status.value?.connected === true)
// Modo NIO + AR: la app NIO debe estar en ESTE equipo, ser del mismo usuario y tener el socket activo.
const localCheck = ref<(LocalCheck & { checked: boolean }) | null>(null)
const localOk = computed(() => localCheck.value?.checked === true && localCheck.value.ok)
/** Pausa visible: solo importa si la app de escritorio está activa (el botón de la app la usa). */
const cooling = computed(() => cooldownLeft.value > 0 && appConnected.value)
// Modo vinculado: sin la app de escritorio activa no hay clock in ni clock out.
const canClock = computed(
  () =>
    hasExternal.value &&
    busy.value === null &&
    (!linked.value || (appConnected.value && localOk.value)) &&
    (cooldownLeft.value === 0 || !appConnected.value),
)
// Independiente: lunch propio del Activity, sin NIO. NIO + AR: lo ejecuta la app NIO de este equipo
// (socket + mismo equipo + mismo usuario) y respeta la pausa de 15 s de su botón.
const canLunch = computed(
  () =>
    hasExternal.value &&
    busy.value === null &&
    (!linked.value ||
      (appConnected.value && localOk.value && (cooldownLeft.value === 0 || !appConnected.value))),
)
// BRB: mismas condiciones que el lunch (la pausa abierta, sea cual sea, ya oculta el otro botón).
const canBrb = canLunch
// Bio break: mismas condiciones que el lunch y el BRB.
const canBio = canLunch

const isIn = (r: ClockRecord) => String(r.type_of_clock).toUpperCase() === 'CLOCK_IN'
const nioKind = (r: ClockRecord) => String(r.type_of_clock).toUpperCase()
const nioIcon = (r: ClockRecord) =>
  ({
    CLOCK_IN: 'mdi-login',
    CLOCK_OUT: 'mdi-logout',
    GO_TO_LUNCH: 'mdi-food',
    BACK_FROM_LUNCH: 'mdi-food-off',
    GO_BRB: 'mdi-timer-sand',
    BACK_FROM_BRB: 'mdi-timer-sand-complete',
    GO_BIO: 'mdi-water',
    BACK_FROM_BIO: 'mdi-water-outline',
  })[nioKind(r)] ?? 'mdi-circle-small'
const nioColor = (r: ClockRecord) =>
  ({
    CLOCK_IN: 'success',
    CLOCK_OUT: 'error',
    GO_TO_LUNCH: 'warning',
    BACK_FROM_LUNCH: 'success',
    GO_BRB: 'info',
    BACK_FROM_BRB: 'success',
    GO_BIO: 'secondary',
    BACK_FROM_BIO: 'success',
  })[nioKind(r)] ?? undefined
const nioTitle = (r: ClockRecord) =>
  ({
    CLOCK_IN: 'Clock In',
    CLOCK_OUT: 'Clock Out',
    GO_TO_LUNCH: 'Go to lunch',
    BACK_FROM_LUNCH: 'Back to lunch',
    GO_BRB: 'Be right back',
    BACK_FROM_BRB: 'Back from BRB',
    GO_BIO: 'Bio break',
    BACK_FROM_BIO: 'Back from bio break',
  })[nioKind(r)] ?? nioKind(r)
const isLunchOpen = (e: ActivityEvent) => e.type_of_activity === 'LUNCH' && e.end_time.startsWith('00:00:00')
const isBrbOpen = (e: ActivityEvent) => e.type_of_activity === 'BRB' && e.end_time.startsWith('00:00:00')
const isBioOpen = (e: ActivityEvent) => e.type_of_activity === 'BIO BREAK' && e.end_time.startsWith('00:00:00')
const isBreakOpen = (e: ActivityEvent) => isLunchOpen(e) || isBrbOpen(e) || isBioOpen(e)
/** Duración (s) de un BRB: el abierto cuenta hasta ahora. */
const brbEventSeconds = (e: ActivityEvent) =>
  isBrbOpen(e)
    ? Math.max(0, hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(e.start_time))
    : hhmmssToSeconds(e.total_time)
/** Duración (s) de un bio break: el abierto cuenta hasta ahora. */
const bioEventSeconds = (e: ActivityEvent) =>
  isBioOpen(e)
    ? Math.max(0, hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(e.start_time))
    : hhmmssToSeconds(e.total_time)
const short = (t: string) => t.slice(0, 8)
/** Hora de un evento del Activity (guardada en Chicago) en la zona del navegador. Las duraciones NO pasan por aquí. */
const localT = (e: ActivityEvent, t: string) => formatLocalTime(e.created_date, t, { fallbackDate: today.value })
/** Hora de un registro del NIO (guardada en Chicago) en la zona del navegador. */
const nioTime = (r: ClockRecord) => formatLocalTime(r.clock_date, r.clock_time, { fallbackDate: today.value })

function activityIcon(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return 'mdi-login'
  if (e.type_of_activity === 'CLOCK OUT') return 'mdi-logout'
  if (e.type_of_activity === 'BRB') return 'mdi-timer-sand'
  if (e.type_of_activity === 'BIO BREAK') return 'mdi-water'
  if (e.type_of_activity === 'ACTIVITY') return 'mdi-clipboard-text-outline'
  return 'mdi-food'
}
function activityColor(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return 'success'
  if (e.type_of_activity === 'CLOCK OUT') return 'error'
  if (e.type_of_activity === 'BRB') return isBrbCritical(brbEventSeconds(e), brbTolerance.value) ? 'error' : 'info'
  if (e.type_of_activity === 'BIO BREAK') return isBioCritical(bioEventSeconds(e), bioTolerance.value) ? 'error' : 'secondary'
  if (e.type_of_activity === 'ACTIVITY') return 'primary'
  return 'warning'
}
function activityTitle(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return `Clock In · ${localT(e, e.start_time)}`
  if (e.type_of_activity === 'CLOCK OUT') return `Clock Out · ${localT(e, e.start_time)}`
  if (e.type_of_activity === 'BRB') return isBrbOpen(e) ? 'Be right back · in progress' : 'Be right back'
  if (e.type_of_activity === 'BIO BREAK') return isBioOpen(e) ? 'Bio break · in progress' : 'Bio break'
  if (e.type_of_activity === 'ACTIVITY') {
    return `${e.activity_title || 'Activity'}${isOpenEvent(e) ? ' · in progress' : ''}`
  }
  return isLunchOpen(e) ? 'Lunch · in progress' : 'Lunch'
}
function reasonLabel(code: string): string {
  if (code === 'NIO_LOGOUT') return 'NIO app log out'
  return (
    (SELF_CLOCK_OUT_REASON_LABEL as Record<string, string>)[code] ??
    (FORCE_CLOCK_OUT_REASON_LABEL as Record<string, string>)[code] ??
    code
  )
}
function activityDetail(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN' || e.type_of_activity === 'CLOCK OUT') {
    return e.reason ? `Reason: ${reasonLabel(e.reason)}` : 'Activity Report'
  }
  if (e.type_of_activity === 'ACTIVITY') {
    // Duración neta: ya descuenta los bio breaks y BRB que se solapan con la actividad.
    return isOpenEvent(e)
      ? `In ${localT(e, e.start_time)} · ${secondsToHHMMSS(activityNetSeconds(e, activityEvents.value, hhmmssToSeconds(nowTime.value)))} worked`
      : `${localT(e, e.start_time)} → ${localT(e, e.end_time)} · ${short(e.total_time)} worked`
  }
  const base = isBreakOpen(e)
    ? `In ${localT(e, e.start_time)}`
    : `${localT(e, e.start_time)} → ${localT(e, e.end_time)} · ${short(e.total_time)}`
  // BRB / bio break: lo que excede la tolerancia cuenta contra el performance.
  if (e.type_of_activity === 'BRB') {
    const over = brbOverSeconds(brbEventSeconds(e), brbTolerance.value)
    return over > 0 ? `${base} · over ${brbToleranceText.value} by ${secondsToHHMMSS(over)}` : base
  }
  if (e.type_of_activity === 'BIO BREAK') {
    const over = bioOverSeconds(bioEventSeconds(e), bioTolerance.value)
    return over > 0 ? `${base} · over ${bioToleranceText.value} by ${secondsToHHMMSS(over)}` : base
  }
  return base
}

/** Chip "cerrada por…" de una fila (cierres de servidor, admin o logout del NIO). */
function closedByChip(e: ActivityEvent): { text: string; color: string } | null {
  if (!(e.via === 'SERVER' || e.via === 'ADMIN' || e.reason === 'NIO_LOGOUT')) return null
  return {
    text:
      e.reason === 'NIO_LOGOUT'
        ? 'Closed by NIO log out'
        : e.via === 'ADMIN'
          ? `Closed by admin${e.admin_name ? ': ' + e.admin_name : ''}`
          : 'Closed by me',
    color: e.via === 'ADMIN' ? 'error' : 'warning',
  }
}

/** Indicador de la app Electron: lo más visible de la pantalla. */
const appState = computed(() => {
  const s = status.value
  if (!s) {
    return { kind: 'unknown', icon: 'mdi-help-circle-outline', title: 'Checking NIO app…', detail: 'Reading the connection status.' }
  }
  if (!s.connected) {
    return {
      kind: 'offline',
      icon: 'mdi-laptop-off',
      title: 'NIO OFFLINE',
      detail: linked.value
        ? 'NIO + AR: Clock In / Clock Out here are blocked until your NIO app is open.'
        : 'Activity works independently; your NIO app has its own clock.',
    }
  }
  if (linked.value && localCheck.value?.checked && !localCheck.value.ok) {
    return {
      kind: 'offline',
      icon: 'mdi-laptop-off',
      title: 'NIO app not verified on this computer',
      detail: `${localCheck.value.message ?? ''} Clock In / Clock Out are blocked until it is verified.`,
    }
  }
  return {
    kind: 'online',
    icon: 'mdi-laptop',
    title: 'NIO ACTIVE',
    detail: s.onShift ? 'Connected — shift open in the app.' : 'Connected — ready to Clock In.',
  }
})

const snack = reactive({ show: false, text: '', color: 'success' })
function notify(text: string, color: 'success' | 'warning' | 'error' | 'info' = 'success') {
  snack.text = text
  snack.color = color
  snack.show = true
}

// ── carga ──────────────────────────────────────────────────────────────────
async function loadRecords() {
  const emp = auth.user?.employee_number
  if (!emp) return
  const day = chicagoDate()
  try {
    const data = await NovaInOutServices.getRecordsByDateRange(emp, day, day)
    records.value = Array.isArray(data) ? data : []
  } catch {
    /* se conserva lo último mostrado; el siguiente poll reintenta */
  }
}

async function loadActivity() {
  try {
    activity.value = await remoteClockService.activityDay()
  } catch {
    /* se conserva lo último mostrado; el siguiente poll reintenta */
  }
}

async function loadStatus() {
  try {
    status.value = await remoteClockService.status()
  } catch {
    status.value = null
  }
}

let localChecking = false
/** Verifica la app NIO de este equipo (solo modo NIO + AR). Sin solaparse consigo misma. */
async function runLocalCheck() {
  if (!linked.value || localChecking) return
  localChecking = true
  try {
    const r = await localAppService.check()
    localCheck.value = { ...r, checked: true }
  } finally {
    localChecking = false
  }
}

async function refreshAll() {
  refreshing.value = true
  try {
    await Promise.all([loadRecords(), loadActivity(), loadStatus()])
    await runLocalCheck()
  } finally {
    refreshing.value = false
  }
}

// ── errores ────────────────────────────────────────────────────────────────
function friendly(e: RemoteClockError, action: 'CLOCK_IN' | 'CLOCK_OUT' = 'CLOCK_IN'): string {
  switch (e.code) {
    case 'EXTERNAL_MISMATCH':
      return 'That external employee number does not match your user.'
    case 'NO_EXTERNAL_NUMBER':
      return 'Your user has no external employee number assigned. Ask an administrator.'
    case 'COMMAND_IN_PROGRESS':
      return 'A clock request is already in progress. Wait a few seconds.'
    case 'BUSY':
      return 'Your desktop app is processing another clock. Try again in a few seconds.'
    case 'DESKTOP_APP_REQUIRED':
    case 'DESKTOP_APP_NOT_LOCAL':
    case 'DESKTOP_APP_OTHER_USER':
    case 'DESKTOP_APP_NO_SESSION':
    case 'DESKTOP_APP_NOT_VERIFIED':
    case 'DESKTOP_APP_ORIGIN':
    case 'HANDSHAKE_INVALID':
      return e.message || 'NIO + AR: your NIO app must be open on this computer to Clock In / Clock Out.'
    case 'HANDSHAKE_REQUIRED':
      return 'NIO + AR: verify your NIO app on this computer first. Update the NIO app if this persists.'
    case 'LUNCH_OPEN':
      return 'End your lunch before clocking out.'
    case 'BRB_OPEN':
      return 'End your BRB before clocking out.'
    case 'BIO_OPEN':
      return 'End your bio break before clocking out.'
    case 'BIO_ALREADY_OPEN':
      return 'You already have an open bio break.'
    case 'BIO_NOT_OPEN':
      return 'You have no open bio break.'
    case 'ACTIVITY_OPEN':
      return 'Close your open activities before clocking out.'
    case 'CANNOT_START_LUNCH_DURING_ACTIVITY':
      return 'Close your open activities before going to lunch.'
    case 'CANNOT_START_ACTIVITY_DURING_BREAK':
      return 'Finish your lunch, BRB or bio break before starting an activity.'
    case 'ACTIVITY_LIMIT':
      return `You can have up to ${ACTIVITY_MAX_OPEN} open activities at the same time.`
    case 'ACTIVITY_NOT_FOUND':
      return 'That activity no longer exists.'
    case 'ACTIVITY_ALREADY_CLOSED':
      return 'That activity is already closed.'
    case 'ACTIVITY_NOT_CLOSED':
      return 'Notes can only be edited once the activity is closed.'
    case 'ACTIVITY_EDIT_EXPIRED':
      return 'Activities can only be edited or deleted on the same day.'
    case 'BRB_ALREADY_OPEN':
      return 'You already have an open BRB.'
    case 'BRB_NOT_OPEN':
      return 'You have no open BRB.'
    case 'OTHER_BREAK_OPEN':
      return 'Finish your current lunch, BRB or bio break first.'
    case 'LUNCH_ALREADY_OPEN':
      return 'You already have an open lunch.'
    case 'LUNCH_NOT_OPEN':
      return 'You have no open lunch.'
    case 'NO_ACTIVE_CLOCK_IN':
      return 'Clock in before registering a lunch, BRB, bio break or activity.'
    case 'ON_LUNCH':
      return 'You are on lunch: activity monitoring and screenshots are paused.'
    case 'ON_BRB':
      return 'You are on BRB: activity monitoring and screenshots are paused.'
    case 'ON_BIO':
      return 'You are on a bio break: activity monitoring and screenshots are paused.'
    case 'NOT_CLOCKED_IN':
      return 'Your NIO app has no open shift. Clock in first.'
    case 'NOT_LINKED':
      return 'Lunch, BRB and bio break through the NIO app are only available in NIO + AR mode.'
    case 'LUNCH_FROM_APP_ONLY':
    case 'LUNCH_PROOF_INVALID':
      return 'NIO + AR: lunch is registered through your NIO app. Open it on this computer and try again.'
    case 'LUNCH_FAILED':
      return e.message || 'Your NIO app could not register the lunch. Try again.'
    case 'BRB_FROM_APP_ONLY':
    case 'BRB_PROOF_INVALID':
      return 'NIO + AR: BRB is registered through your NIO app. Open it on this computer and try again.'
    case 'BRB_FAILED':
      return e.message || 'Your NIO app could not register the BRB. Try again.'
    case 'BIO_FROM_APP_ONLY':
    case 'BIO_PROOF_INVALID':
      return 'NIO + AR: bio break is registered through your NIO app. Open it on this computer and try again.'
    case 'BIO_FAILED':
      return e.message || 'Your NIO app could not register the bio break. Try again.'
    case 'NO_INTERNET':
      return 'Your desktop app has no internet connection.'
    case 'DEVICE_UNAVAILABLE':
      return action === 'CLOCK_IN'
        ? 'Your desktop app did not respond. Open it, sign in and try again.'
        : 'Your desktop app did not respond.'
    default:
      return e.message
  }
}


// ── acciones ───────────────────────────────────────────────────────────────
async function send(action: 'CLOCK_IN' | 'CLOCK_OUT'): Promise<boolean> {
  busy.value = action
  const label = action === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'
  try {
    // Modo NIO + AR: app en ESTE equipo + mismo usuario + socket activo. El nonce fresco lo
    // verifica el backend (es el que decide); aquí solo se corta antes si ya se sabe que falla.
    let nonce: string | undefined
    if (linked.value) {
      await loadStatus()
      if (!appConnected.value) {
        notify(friendly({ code: 'DESKTOP_APP_REQUIRED', message: '' }, action), 'warning')
        return false
      }
      try {
        nonce = await localAppService.prepareClockNonce()
      } catch (e) {
        const err = e as RemoteClockError
        notify(friendly(err, action), 'warning')
        void runLocalCheck()
        return false
      }
    }

    // 1) Activity: independiente, se registra siempre en su propia tabla.
    try {
      await remoteClockService.activityClock(arNumber.value, action, crypto.randomUUID(), nonce)
    } catch (e) {
      const err = e as RemoteClockError
      const already = err.code === 'CLOCK_IN_EXISTS' || err.code === 'ALREADY_CLOCKED_OUT'
      if (!already) {
        notify(friendly(err, action), err.status === 403 ? 'error' : 'warning')
        if (linked.value) void runLocalCheck()
        return false
      }
    }
    await loadActivity()

    // Modo independiente (NIO | AR): el Activity NO controla la app NIO. Cada app hace su clock.
    if (!linked.value) {
      notify(`${label} registered in Activity.`)
      await loadRecords()
      return true
    }

    // 2) Modo NIO + AR: el mismo clock se replica en la app NIO (que debe estar activa).
    await loadStatus()
    if (!status.value?.connected) {
      notify(`${label} registered in Activity. NIO unchanged (desktop app offline).`, 'info')
      if (action === 'CLOCK_OUT' && nioIn.value) openFallback()
      await loadRecords()
      return true
    }
    try {
      const res = await remoteClockService.request(arNumber.value, action)
      if (!res.alreadyInState) localCooldownEnd.value = Date.now() + COOLDOWN_SEC * 1000
      notify(`${label} registered in Activity and NIO.`)
    } catch (e) {
      const err = e as RemoteClockError
      if (action === 'CLOCK_OUT' && nioIn.value && err.code === 'DEVICE_UNAVAILABLE') {
        notify(`${label} registered in Activity. Your desktop app did not respond.`, 'warning')
        openFallback()
      } else {
        notify(`${label} registered in Activity. NIO: ${friendly(err, action)}`, 'warning')
      }
    }
    await loadRecords()
    return true
  } finally {
    busy.value = null
  }
}

/**
 * Modo NIO + AR desincronizado: el lado que YA tiene el clock in manda; el otro hace Clock In.
 * (En modo vinculado el botón de clock de la app NIO está deshabilitado, por eso se corrige desde aquí.)
 */
async function syncModes() {
  if (!outOfSync.value || busy.value !== null) return
  if (!arNumber.value) {
    notify('Your employee number is missing. Ask an administrator.', 'warning')
    return
  }
  busy.value = 'SYNC'
  try {
    await loadStatus()
    if (!appConnected.value) {
      notify(friendly({ code: 'DESKTOP_APP_REQUIRED', message: '' }, 'CLOCK_IN'), 'warning')
      return
    }
    if (nioIn.value) {
      // NIO ya tiene clock in → el Activity es el que falta (exige la verificación de misma máquina).
      let nonce: string
      try {
        nonce = await localAppService.prepareClockNonce()
      } catch (e) {
        notify(friendly(e as RemoteClockError, 'CLOCK_IN'), 'warning')
        void runLocalCheck()
        return
      }
      await remoteClockService.activityClock(arNumber.value, 'CLOCK_IN', crypto.randomUUID(), nonce)
      await loadActivity()
      notify('Synced: Clock In registered in Activity.')
    } else {
      // Activity ya tiene clock in → el NIO es el que falta: se le pide el clock a la app.
      const res = await remoteClockService.request(arNumber.value, 'CLOCK_IN')
      if (!res.alreadyInState) localCooldownEnd.value = Date.now() + COOLDOWN_SEC * 1000
      notify('Synced: Clock In registered in NIO.')
    }
    await loadRecords()
    await loadActivity()
  } catch (e) {
    const err = e as RemoteClockError
    notify(friendly(err, 'CLOCK_IN'), err.status === 403 ? 'error' : 'warning')
    if (linked.value) void runLocalCheck()
  } finally {
    busy.value = null
  }
}

const onClockIn = () => { if (canClock.value) void send('CLOCK_IN') }

type BreakKind = 'LUNCH' | 'BRB' | 'BIO'

/**
 * Lunch / Be right back / Bio break. Modo NIO + AR: la app NIO ejecuta la pausa (screenshot + pausa del timer) y la
 * registra en el Activity. Modo independiente (NIO | AR): pausa propia del Activity; no toca la app NIO.
 * Solo una pausa abierta a la vez: el backend responde 409 OTHER_BREAK_OPEN si ya hay otra.
 */
async function doBreak(kind: BreakKind, action: 'IN' | 'OUT') {
  if (!canLunch.value) return
  // Solo una pausa abierta a la vez: no se mezcla con la de otro tipo.
  const openKind: BreakKind | null = lunchOpen.value ? 'LUNCH' : brbOpen.value ? 'BRB' : bioOpen.value ? 'BIO' : null
  if (openKind && openKind !== kind) return
  busy.value = `${kind}_${action}`
  try {
    // El lunch no se inicia con actividades abiertas. Se refresca el estado ANTES de pedirlo: en modo NIO + AR
    // la app NIO ya habría pausado cuando el backend rechazara el registro del Activity.
    if (kind === 'LUNCH' && action === 'IN') {
      await loadActivity()
      if (hasOpenActivities.value) {
        notify(friendly({ code: 'CANNOT_START_LUNCH_DURING_ACTIVITY', message: '' }), 'warning')
        return
      }
    }
    if (linked.value) {
      await loadStatus()
      if (!appConnected.value) {
        notify(friendly({ code: 'DESKTOP_APP_REQUIRED', message: '' }), 'warning')
        return
      }
      let nonce: string
      try {
        nonce = await localAppService.prepareClockNonce()
      } catch (e) {
        notify(friendly(e as RemoteClockError), 'warning')
        void runLocalCheck()
        return
      }
      const res = await remoteClockService.request(arNumber.value, `${kind}_${action}`, nonce)
      if (!res.alreadyInState) localCooldownEnd.value = Date.now() + COOLDOWN_SEC * 1000
    } else if (kind === 'LUNCH') {
      await remoteClockService.lunch(arNumber.value, action)
    } else if (kind === 'BRB') {
      await remoteClockService.brb(arNumber.value, action)
    } else {
      await remoteClockService.bio(arNumber.value, action)
    }
    notify(
      kind === 'LUNCH'
        ? action === 'IN' ? 'Go to lunch registered.' : 'Back to lunch registered.'
        : kind === 'BRB'
          ? action === 'IN' ? 'Be right back registered.' : 'Back from BRB registered.'
          : action === 'IN' ? 'Bio break registered.' : 'Back from bio break registered.',
    )
    await Promise.all([loadActivity(), loadRecords()])
  } catch (e) {
    const err = e as RemoteClockError
    notify(friendly(err), err.status === 403 ? 'error' : 'warning')
    if (err.status === 409) await loadActivity()
  } finally {
    busy.value = null
  }
}
const doLunch = (action: LunchAction) => doBreak('LUNCH', action)
const doBrb = (action: BrbAction) => doBreak('BRB', action)
const doBio = (action: BioAction) => doBreak('BIO', action)

// ── ACTIVITY (multitask): varias abiertas a la vez; solo registro del AR (sin NIO, sin impacto en horas) ──
const nowSec = computed(() => hhmmssToSeconds(nowTime.value))
/** Abiertas en orden de inicio (#1 = la primera); su cronómetro es neto de bio break y BRB. */
const openActivities = computed(() =>
  activityEvents.value
    .filter((e) => e.type_of_activity === 'ACTIVITY' && isOpenEvent(e))
    .sort((x, y) => hhmmssToSeconds(x.start_time) - hhmmssToSeconds(y.start_time) || x.id - y.id)
    .map((event, i) => ({
      event,
      n: i + 1,
      title: event.activity_title || 'Activity',
      time: secondsToHHMMSS(activityNetSeconds(event, activityEvents.value, nowSec.value)),
    })),
)
const openActivitiesCount = computed(() => Math.max(openActivities.value.length, activity.value?.state.activitiesOpen ?? 0))
const hasOpenActivities = computed(() => openActivitiesCount.value > 0)
/** Activity In: con clock in, sin pausa abierta y bajo el máximo. No depende de la app NIO. */
const canActivity = computed(
  () =>
    hasExternal.value &&
    busy.value === null &&
    activityIn.value &&
    !breakOpen.value &&
    openActivitiesCount.value < ACTIVITY_MAX_OPEN,
)
/** Clock Out: primero se cierran las actividades abiertas. */
const canClockOut = computed(() => canClock.value && !hasOpenActivities.value)
/** Editar / borrar: solo el empleado y solo el mismo día. */
const canEditActivity = (e: ActivityEvent) => e.type_of_activity === 'ACTIVITY' && e.created_date === today.value
const notesOpen = reactive<Record<number, boolean>>({})

type ActMode = 'in' | 'out' | 'edit' | 'delete'
const act = reactive({
  show: false,
  mode: 'in' as ActMode,
  id: null as number | null,
  title: '',
  notes: '',
  origTitle: '',
  origNotes: '',
  closed: false,
  loading: false,
  error: '',
})
const actTitleRules = [(v: string) => titleRule(v)]
// En edición, unas notas sin cambios no se revalidan (p. ej. "Closed automatically" es más corta que el mínimo).
const notesUnchanged = () => act.mode === 'edit' && act.notes.trim() === act.origNotes.trim()
const actNotesRules = [(v: string) => (notesUnchanged() ? true : notesRule(v))]
const actCanSubmit = computed(() => {
  if (act.loading) return false
  const titleOk = titleRule(act.title) === true
  const notesOk = notesUnchanged() || notesRule(act.notes) === true
  if (act.mode === 'in') return titleOk
  if (act.mode === 'out') return notesOk
  if (act.mode === 'edit') return titleOk && (!act.closed || notesOk)
  return true
})

function openAct(mode: ActMode, e?: ActivityEvent) {
  act.mode = mode
  act.id = e?.id ?? null
  act.origTitle = e?.activity_title ?? ''
  act.origNotes = e?.activity_description ?? ''
  act.title = mode === 'edit' ? act.origTitle : ''
  act.notes = mode === 'edit' ? act.origNotes : ''
  act.closed = e ? !isOpenEvent(e) : false
  act.error = ''
  act.loading = false
  act.show = true
}
const openActivityIn = () => { if (canActivity.value) openAct('in') }
const openActivityOut = (e: ActivityEvent) => openAct('out', e)
const openActivityEdit = (e: ActivityEvent) => openAct('edit', e)
const openActivityDelete = (e: ActivityEvent) => openAct('delete', e)
function closeAct() {
  if (!act.loading) act.show = false
}

async function submitAct() {
  if (!actCanSubmit.value) return
  if (act.mode !== 'in' && act.id === null) return
  act.loading = true
  act.error = ''
  busy.value = 'ACTIVITY'
  try {
    if (act.mode === 'in') {
      await remoteClockService.activityIn(arNumber.value, act.title.trim())
      notify('Activity started.')
    } else if (act.mode === 'out') {
      await remoteClockService.activityOut(arNumber.value, act.id!, act.notes.trim())
      notify('Activity finished.')
    } else if (act.mode === 'edit') {
      const patch: { title?: string; notes?: string } = {}
      if (act.title.trim() !== act.origTitle.trim()) patch.title = act.title.trim()
      if (act.closed && !notesUnchanged()) patch.notes = act.notes.trim()
      if (Object.keys(patch).length) await remoteClockService.activityEdit(arNumber.value, act.id!, patch)
      notify(Object.keys(patch).length ? 'Activity updated.' : 'No changes.', Object.keys(patch).length ? 'success' : 'info')
    } else {
      await remoteClockService.activityDelete(act.id!)
      notify('Activity deleted.')
    }
    act.show = false
    await loadActivity()
  } catch (e) {
    const err = e as RemoteClockError
    const gone = ['ACTIVITY_NOT_FOUND', 'ACTIVITY_ALREADY_CLOSED', 'ACTIVITY_EDIT_EXPIRED'].includes(err.code ?? '')
    if (gone) {
      // La actividad ya cambió (otra pestaña, cierre automático, cambio de día): se cierra el diálogo y se refresca.
      act.show = false
      notify(friendly(err), 'warning')
    } else {
      act.error = friendly(err)
    }
    if (err.status === 409 || err.status === 404) await loadActivity()
  } finally {
    act.loading = false
    busy.value = null
  }
}

// Clock out: confirmación por frase
const confirm = reactive({ show: false, text: '' })
const confirmReady = computed(() => confirm.text.trim().toLowerCase() === REQUIRED_PHRASE)
function askClockOut() {
  if (!canClock.value || breakOpen.value || hasOpenActivities.value) return
  confirm.text = ''
  confirm.show = true
}
function closeConfirm() {
  confirm.show = false
  confirm.text = ''
}
async function confirmClockOut() {
  if (!confirmReady.value) return
  closeConfirm()
  await send('CLOCK_OUT')
}

// Respaldo: cierre desde el servidor por el propio usuario
const reasonItems = SELF_CLOCK_OUT_REASONS.map((r) => ({ value: r, title: SELF_CLOCK_OUT_REASON_LABEL[r] }))
const fallback = reactive<{
  show: boolean
  reason: SelfClockOutReason | null
  note: string
  loading: boolean
  error: string
}>({ show: false, reason: null, note: '', loading: false, error: '' })

function openFallback() {
  fallback.reason = null
  fallback.note = ''
  fallback.error = ''
  fallback.show = true
}

async function submitFallback() {
  if (!fallback.reason) return
  fallback.loading = true
  fallback.error = ''
  try {
    await remoteClockService.selfClockOut({
      externalEmployeeNumber: arNumber.value,
      reason: fallback.reason,
      note: fallback.note.trim(),
    })
    fallback.show = false
    notify('Your shift was closed from the Activity Report.')
    await refreshAll()
  } catch (e) {
    const err = e as RemoteClockError
    fallback.error =
      err.status === 409 ? 'You do not have an open shift (it may have just been closed).' : friendly(err, 'CLOCK_OUT')
    if (err.status === 409) await refreshAll()
  } finally {
    fallback.loading = false
  }
}

// ── ciclo de vida ──────────────────────────────────────────────────────────
const onFocus = () => { void refreshAll() }

onMounted(() => {
  void refreshAll().finally(() => { ready.value = true })
  live.connect()
  offLinked = live.on('profile:linked', () => { void loadActivity().then(runLocalCheck) })
  offPresence = live.on<{ connected: boolean; onShift: boolean }>('device:presence', (p) => {
    status.value = { connected: !!p?.connected, onShift: !!p?.onShift, connectedAt: status.value?.connectedAt ?? null }
    void runLocalCheck()
  })
  tick = setInterval(() => {
    nowTime.value = chicagoTime()
    nowMs.value = Date.now()
    today.value = chicagoDate()
  }, 1000)
  poll = setInterval(() => { void refreshAll() }, POLL_MS)
  window.addEventListener('focus', onFocus)
})

onBeforeUnmount(() => {
  offLinked?.()
  offPresence?.()
  if (tick) clearInterval(tick)
  if (poll) clearInterval(poll)
  window.removeEventListener('focus', onFocus)
})
</script>

<style scoped>
.ar-head { padding: var(--app-space-4, 16px) var(--app-space-5, 20px); }
.ar-head__top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ar-head__bottom { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.ar-head__time { display: flex; align-items: baseline; gap: 10px; }
.ar-head__time-meta { font-size: var(--app-text-xs, 0.75rem); color: rgb(var(--v-theme-on-surface-variant)); }

/* Marca: misma construcción que el logo del shell (N + IO en color primario, divisor, sección) */
.ar-brand { display: flex; align-items: baseline; gap: 8px; margin: 0; min-width: 0; }
.ar-brand__mark { font-size: var(--app-text-xl, 1.25rem); font-weight: 650; letter-spacing: var(--app-tracking-tighter, -0.03em); }
.ar-brand__accent { color: rgb(var(--v-theme-primary)); }
.ar-brand__divider { color: rgb(var(--v-theme-on-surface-variant)); opacity: 0.45; font-size: var(--app-text-md, 0.9375rem); }
.ar-brand__page { font-size: var(--app-text-lg, 1.0625rem); font-weight: 450; color: rgb(var(--v-theme-on-surface-variant)); white-space: nowrap; }


/* Informativo (texto) vs. acciones (botones) */
.ar-info { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px; }
.ar-actions { display: flex; align-items: center; gap: 8px; }
.ar-stat { display: inline-flex; align-items: center; gap: 6px; font-size: var(--app-text-sm, 0.8125rem); color: rgb(var(--v-theme-on-surface-variant)); white-space: nowrap; }
.ar-stat__dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(var(--v-theme-on-surface), 0.35); display: inline-block; }
.ar-stat--ok { color: rgb(var(--v-theme-on-surface)); }
.ar-stat--ok .ar-stat__dot { background: rgb(var(--v-theme-success)); }
.ar-stat--warn { color: rgb(var(--v-theme-warning)); font-weight: 600; }
.ar-stat--warn .ar-stat__dot { background: rgb(var(--v-theme-warning)); }
.ar-stat--err { color: rgb(var(--v-theme-error)); }
.ar-stat--err .ar-stat__dot { background: rgb(var(--v-theme-error)); }
.ar-stat__dot--pulse { animation: ar-pulse 1.6s infinite; }
.ar-mode { display: inline-flex; align-items: center; gap: 4px; font-size: var(--app-text-xs, 0.75rem); font-weight: 600; letter-spacing: 0.02em; padding: 1px 8px; border-radius: 4px; border: 1px dashed rgba(var(--v-theme-on-surface), 0.35); color: rgb(var(--v-theme-on-surface-variant)); cursor: default; }
.ar-mode--linked { border-style: solid; border-color: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-primary)); }
.ar-warn { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; border-radius: 6px; font-size: var(--app-text-sm, 0.8125rem); color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.1); border-inline-start: 3px solid rgb(var(--v-theme-warning)); }
.ar-skel-text { background: transparent; }
.ar-skel-field { max-width: 100%; }
.ar-skel-action { border-radius: 16px; overflow: hidden; }
.ar-events { max-height: 420px; overflow-y: auto; }

.ar-dot { width: 14px; height: 14px; border-radius: 50%; flex: none; }
.ar-dot--online { background: rgb(var(--v-theme-success)); animation: ar-pulse 1.6s infinite; }
.ar-dot--offline { background: rgb(var(--v-theme-error)); }
.ar-dot--unknown { background: rgba(var(--v-theme-on-surface), 0.4); }
@keyframes ar-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(var(--v-theme-success), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
}
@media (prefers-reduced-motion: reduce) { .ar-dot--online { animation: none; } }
.ar-employee { font-size: var(--app-text-md, 0.9375rem); font-weight: 600; margin-inline-end: 8px; }
.ar-clock { font-size: var(--app-text-xl, 1.25rem); font-weight: 650; font-variant-numeric: tabular-nums; letter-spacing: var(--app-tracking-tighter, -0.03em); }

/* ───────── Tiles de acción del AR ─────────
   Paleta PROPIA del AR (no toca el tema global de la app, que es sobrio a propósito). Por tono:
   --ar-X (canales RGB: fondos, glow), --ar-X-m (borde e iconos), --ar-X-d (texto y timers, AA sobre el fondo teñido).
   Cada tile solo elige su tono con --c / --cm / --cd. */
.ar-action {
  --ar-red: 220 38 38;      --ar-red-m: 220 38 38;    --ar-red-d: 185 28 28;
  --ar-green: 22 163 74;    --ar-green-m: 22 163 74;  --ar-green-d: 21 128 61;
  --ar-orange: 217 119 6;   --ar-orange-m: 217 119 6; --ar-orange-d: 180 83 9;
  --ar-blue: 37 99 235;     --ar-blue-m: 37 99 235;   --ar-blue-d: 29 78 216;
  --ar-violet: 124 58 237;  --ar-violet-m: 124 58 237; --ar-violet-d: 91 33 182;
  --ar-teal: 13 148 136;    --ar-teal-m: 13 148 136;  --ar-teal-d: 15 118 110;
  --ar-emerald: 5 150 105;  --ar-emerald-m: 5 150 105; --ar-emerald-d: 4 120 87;
  --ar-gray: 107 114 128;   --ar-gray-m: 90 98 112;   --ar-gray-d: 55 65 81;
  --ar-on-emerald: 255 255 255;
  --ar-tint: 0.08; /* relleno plano y suave: sin gradientes ni brillo */
  --c: var(--ar-gray); --cm: var(--ar-gray-m); --cd: var(--ar-gray-d);
}
:global(.v-theme--dark) .ar-action {
  --ar-red: 248 113 113;     --ar-red-m: 252 129 129;    --ar-red-d: 254 178 178;
  --ar-green: 74 222 128;    --ar-green-m: 74 222 128;   --ar-green-d: 134 239 172;
  --ar-orange: 251 146 60;   --ar-orange-m: 253 164 90;  --ar-orange-d: 253 186 116;
  --ar-blue: 96 165 250;     --ar-blue-m: 125 180 252;   --ar-blue-d: 170 208 254;
  --ar-violet: 167 139 250;  --ar-violet-m: 183 160 252; --ar-violet-d: 213 200 254;
  --ar-teal: 45 212 191;     --ar-teal-m: 94 234 212;    --ar-teal-d: 153 246 228;
  --ar-emerald: 52 211 153;  --ar-emerald-m: 110 231 183; --ar-emerald-d: 167 243 208;
  --ar-gray: 156 163 175;    --ar-gray-m: 176 183 195;   --ar-gray-d: 209 213 219;
  --ar-on-emerald: 4 24 13;
  --ar-tint: 0.12;
}

.ar-action {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 168px;
  max-width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  cursor: pointer;
  user-select: none;
  color: rgb(var(--cd));
  background: rgb(var(--c) / var(--ar-tint));
  border: 2px solid rgb(var(--cm));
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}
.ar-action--in, .ar-action--back { --c: var(--ar-green); --cm: var(--ar-green-m); --cd: var(--ar-green-d); }
.ar-action--out { --c: var(--ar-red); --cm: var(--ar-red-m); --cd: var(--ar-red-d); }
.ar-action--lunch { --c: var(--ar-orange); --cm: var(--ar-orange-m); --cd: var(--ar-orange-d); }
.ar-action--brb { --c: var(--ar-blue); --cm: var(--ar-blue-m); --cd: var(--ar-blue-d); }
.ar-action--bio { --c: var(--ar-violet); --cm: var(--ar-violet-m); --cd: var(--ar-violet-d); }
.ar-action--act { --c: var(--ar-teal); --cm: var(--ar-teal-m); --cd: var(--ar-teal-d); }
.ar-action--add { --c: var(--ar-emerald); --cm: var(--ar-emerald-m); --cd: var(--ar-emerald-d); }
/* BRB / Bio break pasados de su tolerancia: crítico (rojo + pulso) */
.ar-action.ar-action--critical { --c: var(--ar-red); --cm: var(--ar-red-m); --cd: var(--ar-red-d); animation: ar-critical 1.6s infinite; }
@keyframes ar-critical {
  0% { box-shadow: 0 0 0 0 rgb(var(--c) / 0.4); }
  70% { box-shadow: 0 0 0 9px rgb(var(--c) / 0); }
  100% { box-shadow: 0 0 0 0 rgb(var(--c) / 0); }
}
.ar-action:hover:not(.ar-action--disabled) {
  transform: translateY(-2px);
  background: rgb(var(--c) / calc(var(--ar-tint) + 0.04));
  box-shadow: 0 6px 14px -8px rgb(0 0 0 / 0.25);
}
.ar-action:active:not(.ar-action--disabled) { transform: translateY(-1px); }
.ar-action:focus-visible { outline: 3px solid rgb(var(--cm) / 0.55); outline-offset: 3px; }
.ar-action--disabled { opacity: 0.45; cursor: not-allowed; filter: saturate(0.6); box-shadow: none; }

.ar-action-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; letter-spacing: 0.06em; color: rgb(var(--cd)); }
.ar-action-center { display: flex; align-items: center; justify-content: center; height: 88px; min-width: 128px; color: rgb(var(--cm)); }
.ar-action-stack { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ar-action-stack .ar-action-timer { font-size: 1.5rem; }
.ar-action-timer { font-variant-numeric: tabular-nums; font-size: 1.9rem; font-weight: 700; color: rgb(var(--cd)); }
.ar-action-wait { font-size: 1.3rem; font-weight: 700; font-variant-numeric: tabular-nums; color: rgb(var(--cd)); }

/* Activity In: tile "agregar" (multitask). Esmeralda translúcido y punteado = cupo libre para sumar otra actividad;
   la etiqueta MULTITASK sobre el borde lo separa de las acciones normales (sin romper el wrap en pantallas angostas). */
.ar-actions-sep { display: none; }
.ar-action--add {
  margin-inline-start: 12px;
  background: rgb(var(--c) / 0.04);
  border: 2px dashed rgb(var(--cm) / 0.7);
  box-shadow: none;
  opacity: 0.92;
}
.ar-action--add::after {
  content: 'Multitask';
  position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
  padding: 1px 10px; border-radius: 999px; white-space: nowrap;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;
  background: rgb(var(--cd)); color: rgb(var(--ar-on-emerald));
}
.ar-action--add:hover:not(.ar-action--disabled), .ar-action--add:focus-visible {
  opacity: 1; border-color: rgb(var(--cm)); background: rgb(var(--c) / 0.08);
  box-shadow: none;
}
.ar-add-ico { color: rgb(var(--cm)); overflow: visible; }
.ar-add-ico circle, .ar-add-ico path { transform-box: fill-box; transform-origin: center; }
.ar-add-ring { stroke: currentColor; stroke-width: 2.5; stroke-dasharray: 5 7; stroke-linecap: round; animation: ar-add-spin 18s linear infinite; }
.ar-add-disc { fill: rgb(var(--c) / 0.14); transition: fill 0.2s, transform 0.2s; }
.ar-add-plus { stroke: currentColor; stroke-width: 4.5; stroke-linecap: round; transition: stroke 0.2s, transform 0.25s; animation: ar-add-breathe 2.4s ease-in-out infinite; }
.ar-action--add:hover:not(.ar-action--disabled) .ar-add-disc { fill: rgb(var(--cm)); transform: scale(1.06); }
.ar-action--add:hover:not(.ar-action--disabled) .ar-add-plus { stroke: rgb(var(--ar-on-emerald)); transform: rotate(90deg); animation: none; }
@keyframes ar-add-spin { to { transform: rotate(360deg); } }
@keyframes ar-add-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.88); } }
/* Medidor de cupos: teal = actividad abierta (mismo tono que sus tiles), esmeralda punteado = cupo libre. */
.ar-add-meter { display: inline-flex; align-items: center; gap: 8px; }
.ar-add-pips { display: inline-flex; gap: 5px; }
.ar-add-pip { width: 10px; height: 10px; border-radius: 50%; border: 1.5px dashed rgb(var(--cm) / 0.85); box-sizing: border-box; }
.ar-add-pip.is-open { border: 1.5px solid rgb(var(--ar-teal-m)); background: rgb(var(--ar-teal-m)); }
.ar-add-count { font-size: 0.9rem; font-variant-numeric: tabular-nums; color: rgb(var(--cd)); }
/* Límite alcanzado: se apaga a gris */
.ar-action--full { --c: var(--ar-gray); --cm: var(--ar-gray-m); --cd: var(--ar-gray-d); }
.ar-action--full .ar-add-pip:not(.is-open) { border-color: rgb(var(--cm) / 0.6); }

@media (prefers-reduced-motion: reduce) {
  .ar-action { transition: none; }
  .ar-action:hover:not(.ar-action--disabled), .ar-action:active:not(.ar-action--disabled) { transform: none; }
  .ar-action.ar-action--critical { animation: none; }
  .ar-add-ring, .ar-add-plus { animation: none; }
  .ar-add-plus, .ar-add-disc { transition: none; }
}
.ar-action-sublabel { max-width: 144px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--app-text-xs, 0.75rem); color: rgb(var(--v-theme-on-surface-variant)); }
.ar-act-title { overflow-wrap: anywhere; }
.ar-act-notes { cursor: pointer; white-space: normal !important; -webkit-line-clamp: 2 !important; }
.ar-act-notes--open { -webkit-line-clamp: unset !important; display: block !important; }
.ar-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
