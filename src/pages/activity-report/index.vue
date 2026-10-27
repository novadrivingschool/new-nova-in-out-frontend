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
        <div class="ar-head__time">
          <span class="ar-clock">{{ nowTime }}</span>
          <span class="ar-head__time-meta">Chicago · {{ today }}</span>
        </div>
      </div>

      <div class="ar-head__bottom">
        <span class="ar-employee">{{ fullName }}</span>

        <!-- Informativo: solo texto con punto de color, sin relleno (no se confunde con un botón) -->
        <div class="ar-info" role="status" aria-live="polite">
          <span class="ar-stat" :class="activityIn ? 'ar-stat--ok' : outOfSync ? 'ar-stat--warn' : ''">
            <i class="ar-stat__dot" />Activity: {{ activityIn ? (lunchOpen ? 'On lunch' : 'Clocked In') : 'Clocked Out' }}
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

    <!-- Acciones -->
    <v-card class="pa-5 mb-4">
      <div class="d-flex flex-wrap align-start ga-6">
        <v-text-field
          v-model="external"
          label="External employee number"
          hint="The number from the HR app. It must be yours."
          persistent-hint
          density="comfortable"
          variant="outlined"
          maxlength="50"
          autocomplete="off"
          prepend-inner-icon="mdi-badge-account-horizontal-outline"
          style="max-width: 360px; min-width: 260px"
          :disabled="busy !== null"
        />

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
                  :aria-label="`Wait ${{ cooldownLeft }} seconds`"
                >
                  <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                </v-progress-circular>
                <span v-else class="ar-action-timer">{{ sessionTime }}</span>
              </div>
              <div class="ar-action-label">CLOCK IN</div>
            </div>
            <div
              v-else
              class="ar-action ar-action--out"
              :class="{ 'ar-action--disabled': !canClock || lunchOpen }"
              role="button"
              :tabindex="canClock && !lunchOpen ? 0 : -1"
              :aria-disabled="!canClock || lunchOpen"
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
                  :aria-label="`Wait ${{ cooldownLeft }} seconds`"
                >
                  <span class="ar-action-wait">{{ cooldownLeft }}s</span>
                </v-progress-circular>
                <span v-else class="ar-action-timer">{{ sessionTime }}</span>
              </div>
              <div class="ar-action-label">CLOCK OUT</div>
            </div>

            <div v-if="activityIn" class="d-flex flex-column justify-center ga-2">
              <v-btn
                v-if="!lunchOpen"
                color="warning"
                variant="flat"
                size="large"
                prepend-icon="mdi-food"
                :disabled="!canLunch"
                :loading="busy === 'LUNCH_IN'"
                @click="doLunch('IN')"
              >
                Lunch In
              </v-btn>
              <v-btn
                v-else
                color="success"
                variant="flat"
                size="large"
                prepend-icon="mdi-food-off"
                :disabled="!canLunch"
                :loading="busy === 'LUNCH_OUT'"
                @click="doLunch('OUT')"
              >
                Lunch Out
              </v-btn>
            </div>
          </div>
          <div v-if="linked && !appConnected" class="text-caption text-error" aria-live="polite">
            Open your NIO app to Clock In / Clock Out here
          </div>
          <div v-else-if="linked && localCheck?.checked && !localCheck.ok" class="text-caption text-error" aria-live="polite">
            {{ localCheck.message }}
          </div>
          <div v-else-if="lunchOpen" class="text-caption text-warning">End your lunch before clocking out</div>
          <div v-else-if="cooling" class="ar-sr-only" aria-live="polite">
            Your desktop app is finishing the last clock — wait {{ cooldownLeft }}s
          </div>
          <div v-else class="text-caption text-medium-emphasis">Worked time today (lunch excluded)</div>
        </div>
      </div>
    </v-card>

    <!-- Dos modelos separados: NIO (asistencia) y Activity (tabla propia) -->
    <v-row>
      <v-col cols="12" md="6">
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
                <v-icon :color="isIn(r) ? 'success' : 'error'" size="18" class="me-3">
                  {{ isIn(r) ? 'mdi-login' : 'mdi-logout' }}
                </v-icon>
              </template>
              <v-list-item-title :class="isIn(r) ? '' : 'text-error'">
                {{ isIn(r) ? 'Clock In' : 'Clock Out' }} · {{ r.clock_time }}
              </v-list-item-title>
              <template v-if="r.source && r.source !== 'MANUAL'" #append>
                <v-chip size="x-small" variant="tonal">{{ sourceLabel(r.source) }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">Activity</div>
            <v-chip size="x-small" variant="tonal" color="primary">{{ activityRows.length }}</v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mb-2">Clock and lunch of the Activity Report</div>
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
              <v-list-item-subtitle v-if="e.via === 'ADMIN' && e.note" class="ar-note">
                Note: {{ e.note }}
              </v-list-item-subtitle>
              <template v-if="e.via === 'SERVER' || e.via === 'ADMIN' || e.reason === 'NIO_LOGOUT'" #append>
                <v-chip size="x-small" variant="tonal" :color="e.via === 'ADMIN' ? 'error' : 'warning'">
                  {{
                    e.reason === 'NIO_LOGOUT'
                      ? 'Closed by NIO log out'
                      : e.via === 'ADMIN'
                        ? `Closed by admin${e.admin_name ? ': ' + e.admin_name : ''}`
                        : 'Closed by me'
                  }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

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
import { FORCE_CLOCK_OUT_REASON_LABEL } from '@/types/adminClockOut'
import {
  SELF_CLOCK_OUT_REASONS,
  SELF_CLOCK_OUT_REASON_LABEL,
  type ActivityDay,
  type ActivityEvent,
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
  hhmmssToSeconds,
  isClockedIn,
  secondsToHHMMSS,
  sourceLabel,
} from '@/utils/clockSession'


const LS_EXTERNAL = 'nio_activity_report_external'
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
function readStoredExternal(): string {
  try { return localStorage.getItem(LS_EXTERNAL) ?? '' } catch { return '' }
}
const external = ref(readStoredExternal())
const records = ref<ClockRecord[]>([])
const status = ref<RemoteClockStatus | null>(null)
const activity = ref<ActivityDay | null>(null)
const busy = ref<'CLOCK_IN' | 'CLOCK_OUT' | 'LUNCH_IN' | 'LUNCH_OUT' | 'SYNC' | null>(null)
const refreshing = ref(false)

const nowTime = ref(chicagoTime())
const nowMs = ref(Date.now())
/** Fin (epoch ms) de la pausa abierta por un clock pedido desde esta página. */
const localCooldownEnd = ref(0)
const today = ref(chicagoDate())
let tick: ReturnType<typeof setInterval> | null = null
let poll: ReturnType<typeof setInterval> | null = null

const rows = computed(() => clockRowsOf(records.value))
const nioRows = computed(() => [...rows.value].reverse())
const nioIn = computed(() => isClockedIn(records.value))

const activityEvents = computed(() => activity.value?.events ?? [])
const linked = computed(() => activity.value?.linked ?? false)
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
const activityRows = computed(() =>
  [...activityEvents.value].sort(
    (x, y) => hhmmssToSeconds(y.start_time) - hhmmssToSeconds(x.start_time) || y.id - x.id,
  ),
)

/** Tiempo trabajado en el Activity: tramos clock in→out menos lunch (el abierto cuenta hasta ahora). */
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
    if (e.type_of_activity !== 'LUNCH') continue
    const start = hhmmssToSeconds(e.start_time)
    const end = isLunchOpen(e) ? now : hhmmssToSeconds(e.end_time)
    total -= Math.max(0, end - start)
  }
  return secondsToHHMMSS(Math.max(0, total))
})

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
const hasExternal = computed(() => !!external.value.trim())
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
const canLunch = computed(() => hasExternal.value && busy.value === null)

const isIn = (r: ClockRecord) => String(r.type_of_clock).toUpperCase() === 'CLOCK_IN'
const isLunchOpen = (e: ActivityEvent) => e.type_of_activity === 'LUNCH' && e.end_time.startsWith('00:00:00')
const short = (t: string) => t.slice(0, 8)

function activityIcon(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return 'mdi-login'
  if (e.type_of_activity === 'CLOCK OUT') return 'mdi-logout'
  return 'mdi-food'
}
function activityColor(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return 'success'
  if (e.type_of_activity === 'CLOCK OUT') return 'error'
  return 'warning'
}
function activityTitle(e: ActivityEvent): string {
  if (e.type_of_activity === 'CLOCK IN') return `Clock In · ${short(e.start_time)}`
  if (e.type_of_activity === 'CLOCK OUT') return `Clock Out · ${short(e.start_time)}`
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
  if (e.type_of_activity !== 'LUNCH') return e.reason ? `Reason: ${reasonLabel(e.reason)}` : 'Activity Report'
  return isLunchOpen(e)
    ? `In ${short(e.start_time)}`
    : `${short(e.start_time)} → ${short(e.end_time)} · ${short(e.total_time)}`
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
    case 'LUNCH_ALREADY_OPEN':
      return 'You already have an open lunch.'
    case 'LUNCH_NOT_OPEN':
      return 'You have no open lunch.'
    case 'NO_ACTIVE_CLOCK_IN':
      return 'Clock in before registering lunch.'
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

function rememberExternal() {
  try { localStorage.setItem(LS_EXTERNAL, external.value.trim()) } catch { /* sin storage */ }
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
      await remoteClockService.activityClock(external.value.trim(), action, crypto.randomUUID(), nonce)
      rememberExternal()
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
      const res = await remoteClockService.request(external.value.trim(), action)
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
  if (!external.value.trim()) {
    notify('Enter your external employee number first.', 'warning')
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
      await remoteClockService.activityClock(external.value.trim(), 'CLOCK_IN', crypto.randomUUID(), nonce)
      rememberExternal()
      await loadActivity()
      notify('Synced: Clock In registered in Activity.')
    } else {
      // Activity ya tiene clock in → el NIO es el que falta: se le pide el clock a la app.
      const res = await remoteClockService.request(external.value.trim(), 'CLOCK_IN')
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

async function doLunch(action: LunchAction) {
  if (!canLunch.value) return
  busy.value = action === 'IN' ? 'LUNCH_IN' : 'LUNCH_OUT'
  try {
    await remoteClockService.lunch(external.value.trim(), action)
    rememberExternal()
    notify(action === 'IN' ? 'Lunch started.' : 'Lunch finished.')
    await loadActivity()
  } catch (e) {
    const err = e as RemoteClockError
    notify(friendly(err), err.status === 403 ? 'error' : 'warning')
    if (err.status === 409) await loadActivity()
  } finally {
    busy.value = null
  }
}

// Clock out: confirmación por frase
const confirm = reactive({ show: false, text: '' })
const confirmReady = computed(() => confirm.text.trim().toLowerCase() === REQUIRED_PHRASE)
function askClockOut() {
  if (!canClock.value || lunchOpen.value) return
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
      externalEmployeeNumber: external.value.trim(),
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
  void refreshAll()
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

.ar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 180px;
  padding: 16px 24px;
  border-radius: 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, transform 0.15s;
}
.ar-action--in { background: rgba(var(--v-theme-success), 0.1); border: 2px solid rgb(var(--v-theme-success)); }
.ar-action--out { background: rgba(var(--v-theme-error), 0.1); border: 2px solid rgb(var(--v-theme-error)); }
.ar-action--out .ar-action-label { color: rgb(var(--v-theme-error)); }
.ar-action--in .ar-action-label { color: rgb(var(--v-theme-success)); }
.ar-action:hover:not(.ar-action--disabled) { filter: brightness(0.97); transform: translateY(-1px); }
.ar-action:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.ar-action--disabled { opacity: 0.45; cursor: not-allowed; }
.ar-action-label { font-weight: 700; letter-spacing: 0.06em; }
.ar-action-center { display: flex; align-items: center; justify-content: center; height: 92px; min-width: 150px; }
.ar-action-wait { font-size: 1.3rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.ar-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ar-action-timer { font-variant-numeric: tabular-nums; font-size: 1.9rem; font-weight: 700; }
.ar-action--out .ar-action-timer { color: rgb(var(--v-theme-error)); }
.ar-action--in .ar-action-timer { color: rgb(var(--v-theme-success)); }
</style>
