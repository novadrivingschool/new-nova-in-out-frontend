<!--
  src/pages/home/index.vue

  Página de inicio tras iniciar sesión. Abierta a todo usuario autenticado
  (ver OPEN_PATHS en `config/views.ts`).

  - Cabecera: saludo según la hora, fecha y relojes local / Chicago (el equipo
    está repartido entre México, Chicago y Ecuador).
  - "Attendance today": asistencia en vivo, solo si el usuario tiene la vista
    `admin-dashboard` (es la que autoriza el endpoint).
  - Accesos directos agrupados, filtrados con las mismas reglas que el menú.
-->
<template>
  <PageContainer variant="wide">
    <!-- ═══ Cabecera ═══ -->
    <header class="home__hero">
      <div class="home__hero-text">
        <p class="app-eyebrow">{{ todayLabel }}</p>
        <h1 class="home__greeting">{{ greeting }}, {{ firstName }}</h1>
        <p v-if="roleLabel" class="home__role">{{ roleLabel }}</p>
      </div>

      <div aria-label="Current time" class="home__clocks" role="timer">
        <div class="home__clock">
          <span class="home__clock-time app-mono">{{ localTime }}</span>
          <span class="home__clock-zone">Local</span>
        </div>
        <div class="home__clock">
          <span class="home__clock-time app-mono">{{ chicagoTime }}</span>
          <span class="home__clock-zone">Chicago</span>
        </div>
      </div>
    </header>

    <!-- ═══ Mi día (cualquier usuario) ═══ -->
    <section v-if="auth.user?.employee_number" aria-label="My day" class="home__section">
      <h2 class="app-eyebrow home__section-title">My day</h2>

      <v-card class="home__panel">
        <div v-if="!myDayLoaded" :aria-busy="true" class="home__skeleton" />
        <div v-else class="home__myday">
          <div class="home__myday-state">
            <span aria-hidden="true" class="home__dot home__dot--lg" :class="`home__dot--${myDayState}`" />
            <div>
              <p class="home__myday-label">{{ myDayLabel }}</p>
              <p class="home__myday-hint">{{ myDayHint }}</p>
            </div>
          </div>

          <dl v-if="myFirstIn" class="home__facts">
            <div class="home__fact">
              <dt>First entry</dt>
              <dd class="app-mono">{{ myFirstIn }}</dd>
            </div>
            <div class="home__fact">
              <dt>Last movement</dt>
              <dd class="app-mono">{{ myLastEvent }}</dd>
            </div>
          </dl>

          <!-- Activity Report deshabilitado temporalmente (04-nov-2026)
          <v-btn
            v-if="auth.canView('activity-report')"
            append-icon="mdi-arrow-right"
            size="small"
            to="/activity-report"
            variant="text"
          >
            Activity Report
          </v-btn>
          -->
        </div>
      </v-card>
    </section>

    <!-- ═══ Asistencia en vivo ═══ -->
    <section v-if="showSnapshot" aria-label="Team attendance today" class="home__section">
      <div class="home__section-head">
        <h2 class="app-eyebrow">Team attendance today</h2>
        <div class="home__section-meta">
          <span v-if="lastUpdated" class="home__updated">Updated {{ updatedLabel }}</span>
          <v-btn
            aria-label="Refresh attendance"
            density="comfortable"
            icon="mdi-refresh"
            :loading="snapshotLoading"
            size="x-small"
            variant="text"
            @click="reload"
          />
        </div>
      </div>

      <p v-if="snapshotError && !snapshot" class="home__error" role="alert">
        {{ snapshotError }}
      </p>

      <v-card class="home__panel home__today">
        <div v-if="!snapshot" :aria-busy="snapshotLoading" class="home__skeleton" />
        <template v-else-if="today">
          <div class="home__today-head">
            <p class="home__today-headline">
              <span class="home__today-big app-mono">{{ today.clockedIn }}</span>
              <span class="home__today-of">of {{ today.total }} active employees have clocked in today</span>
            </p>
            <v-btn
              append-icon="mdi-arrow-right"
              class="home__today-link"
              size="small"
              to="/admin-dashboard"
              variant="text"
            >
              Details
            </v-btn>
          </div>

          <div
            :aria-label="`${today.onClock} working now, ${today.left} already left, ${today.absent} not in yet`"
            class="home__bar"
            role="img"
          >
            <span
              v-for="seg in today.segments"
              :key="seg.key"
              class="home__bar-seg"
              :class="`home__bar-seg--${seg.key}`"
              :style="{ flexGrow: seg.value }"
            />
          </div>

          <ul class="home__legend">
            <li v-for="seg in today.segments" :key="seg.key" class="home__legend-item">
              <span aria-hidden="true" class="home__dot" :class="`home__bar-seg--${seg.key}`" />
              <span class="home__legend-value app-mono">{{ seg.value }}</span>
              <span class="home__legend-text">
                <span class="home__legend-label">{{ seg.label }}</span>
                <span class="home__legend-hint">{{ seg.hint }}</span>
              </span>
            </li>
          </ul>
        </template>
      </v-card>
    </section>

    <!-- ═══ Accesos directos ═══ -->
    <section
      v-for="group in groups"
      :key="group.title"
      :aria-label="group.title"
      class="home__section"
    >
      <h2 class="app-eyebrow home__section-title">{{ group.title }}</h2>

      <div class="app-autogrid" style="--app-autogrid-min: 17rem">
        <v-card
          v-for="link in group.links"
          :key="link.route"
          class="home__card"
          link
          :to="link.route"
        >
          <div class="home__card-body">
            <span aria-hidden="true" class="home__tile">
              <v-icon size="20">{{ link.icon }}</v-icon>
            </span>
            <div class="home__card-text">
              <h3 class="home__card-title">{{ link.title }}</h3>
              <p class="home__card-desc">{{ link.description }}</p>
            </div>
            <v-icon aria-hidden="true" class="home__arrow" size="18">mdi-arrow-right</v-icon>
          </div>
        </v-card>
      </div>
    </section>

    <EmptyState
      v-if="!groups.length"
      description="Your account has no views assigned. Ask a super admin to grant access."
      title="Nothing to show yet"
    />
  </PageContainer>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import PageContainer from '@/components/common/PageContainer.vue'
  import EmptyState from '@/components/common/EmptyState.vue'
  import { useHomeSnapshot } from '@/composables/useHomeSnapshot'
  import { useMyDay } from '@/composables/useMyDay'
  import { PERMISSIONS_ROUTE, VIEW_CATALOG, type ViewKey } from '@/config/views'
  import { useAuth } from '@/stores/auth/useAuth'

  interface QuickLink {
    title: string
    icon: string
    route: string
    description: string
  }

  const auth = useAuth()

  // ── Reloj (un solo timer; se alinea al minuto) ──
  const now = ref(new Date())
  let clockTimer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    clockTimer = setInterval(() => (now.value = new Date()), 15_000)
  })
  onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer)
  })

  const timeIn = (timeZone?: string) =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(now.value)

  const localTime = computed(() => timeIn())
  const chicagoTime = computed(() => timeIn('America/Chicago'))

  const todayLabel = computed(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now.value),
  )

  const greeting = computed(() => {
    const h = now.value.getHours()
    if (h < 12) return 'Good morning'
    if (h < 19) return 'Good afternoon'
    return 'Good evening'
  })

  const firstName = computed(
    () => auth.user?.firstName?.trim() || auth.user?.employee_number || 'there',
  )

  const roleLabel = computed(() =>
    (auth.user?.roles ?? []).map(r => r.replace(/_/g, ' ')).join(' · '),
  )

  // ── Mi día ──
  const {
    loaded: myDayLoaded,
    error: myDayError,
    state: myDayState,
    firstIn: myFirstIn,
    lastEvent: myLastEvent,
  } = useMyDay(computed(() => auth.user?.employee_number))

  const myDayLabel = computed(
    () => ({ in: 'On the clock', out: 'Clocked out', none: 'Not clocked in yet' })[myDayState.value],
  )
  const myDayHint = computed(() => {
    if (myDayError.value) return 'Could not refresh. Showing the last data.'
    if (myDayState.value === 'in') return `Since ${myLastEvent.value}`
    if (myDayState.value === 'out') return `Left at ${myLastEvent.value}`
    return 'No entry recorded today'
  })

  // ── Asistencia del equipo (super_admin) ──
  // KPIs del equipo: solo super_admin. La Home es para cualquier usuario, no un panel de gestión.
  const showSnapshot = computed(() => auth.isSuperAdmin)
  const {
    data: snapshot,
    loading: snapshotLoading,
    error: snapshotError,
    lastUpdated,
    reload,
  } = useHomeSnapshot(showSnapshot)

  const updatedLabel = computed(() =>
    lastUpdated.value
      ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        lastUpdated.value,
      )
      : '',
  )

  /**
   * Las tres partes suman el total de empleados activos (`charts.status`):
   * trabajando ahora + ya salieron + aún sin entrada. "Clocked in" es la suma de las dos primeras.
   */
  const today = computed(() => {
    const st = snapshot.value?.charts.status
    if (!st) return null
    const total = st.onClock + st.left + st.absent
    return {
      total,
      onClock: st.onClock,
      left: st.left,
      absent: st.absent,
      clockedIn: st.onClock + st.left,
      segments: [
        { key: 'on', label: 'Working now', hint: 'Clocked in, no clock out yet', value: st.onClock },
        { key: 'left', label: 'Already left', hint: 'Clocked in and out today', value: st.left },
        { key: 'absent', label: 'Not in yet', hint: 'No entry today', value: st.absent },
      ],
    }
  })

  // ── Accesos directos ──
  const GROUP_OF: Record<string, 'work' | 'monitor' | 'admin'> = {
    // 'activity-report': 'work', // deshabilitado temporalmente
    'live-staff-activity': 'monitor',
    screenshots: 'monitor',
    'admin-dashboard': 'monitor',
    // 'external-activity-report': 'monitor', // deshabilitado temporalmente
    users: 'admin',
    settings: 'admin',
    permissions: 'admin',
  }

  const GROUP_TITLES = { work: 'My work', monitor: 'Monitoring', admin: 'Administration' } as const

  const allLinks = computed<Array<QuickLink & { group: keyof typeof GROUP_TITLES }>>(() => {
    const fromCatalog = VIEW_CATALOG.filter(v => auth.canView(v.key as ViewKey)).map(v => ({
      title: v.title,
      icon: v.icon,
      route: v.route,
      description: v.description,
      group: GROUP_OF[v.key] ?? 'admin',
    }))

    const extras: Array<QuickLink & { group: keyof typeof GROUP_TITLES }> = []
    if (auth.isSuperAdmin) {
      extras.push({
        title: 'Permissions',
        icon: 'mdi-shield-key-outline',
        route: PERMISSIONS_ROUTE,
        description: 'Grant or revoke views per user.',
        group: 'admin',
      })
    }
    return [...fromCatalog, ...extras]
  })

  const groups = computed(() =>
    (Object.keys(GROUP_TITLES) as Array<keyof typeof GROUP_TITLES>)
      .map(key => ({
        title: GROUP_TITLES[key],
        links: allLinks.value.filter(l => l.group === key),
      }))
      .filter(g => g.links.length),
  )
</script>

<style scoped>
/* ── Cabecera ── */
.home__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-4);
  margin-bottom: var(--app-space-8);
}

.home__greeting {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-3xl);
  font-weight: 600;
  letter-spacing: var(--app-tracking-tighter);
  line-height: 1.15;
}

.home__role {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-sm);
  text-transform: capitalize;
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__clocks {
  display: flex;
  gap: var(--app-space-6);
}

.home__clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.home__clock-time {
  font-size: var(--app-text-2xl);
  font-weight: 500;
  line-height: 1.1;
}

.home__clock-zone {
  font-size: var(--app-text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--app-tracking-wide);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ── Secciones ── */
.home__section {
  margin-bottom: var(--app-space-8);
}

.home__section-title {
  margin: 0 0 var(--app-space-3);
}

.home__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-3);
}

.home__section-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
}

.home__updated {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__error {
  margin: 0 0 var(--app-space-3);
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-error));
}

/* ── Resumen de hoy ── */
/* Tarjeta base: sin `variant="outlined"` (en este tema deja el texto casi transparente). */
.home__panel {
  padding: var(--app-space-4) var(--app-space-5);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
}

.home__skeleton {
  height: 96px;
  border-radius: var(--app-radius-md);
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.home__today-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}

.home__today-headline {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin: 0;
}

.home__today-big {
  font-size: var(--app-text-3xl);
  font-weight: 600;
  line-height: 1;
}

.home__today-of {
  font-size: var(--app-text-md);
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__bar {
  display: flex;
  gap: 2px;
  height: 10px;
  overflow: hidden;
  border-radius: var(--app-radius-full);
}

.home__bar-seg {
  min-width: 0;
}

.home__bar-seg--on {
  background: rgb(var(--v-theme-success));
}

.home__bar-seg--left {
  background: rgb(var(--v-theme-primary));
}

.home__bar-seg--absent {
  background: rgba(var(--v-theme-on-surface), 0.18);
}

.home__legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--app-space-3);
  margin: var(--app-space-4) 0 0;
  padding: 0;
  list-style: none;
}

.home__legend-item {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-2);
}

.home__dot {
  width: 8px;
  height: 8px;
  margin-top: 9px;
  flex-shrink: 0;
  border-radius: 50%;
}

.home__legend-value {
  font-size: var(--app-text-xl);
  font-weight: 600;
  line-height: 1.3;
}

.home__legend-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.home__legend-label {
  font-size: var(--app-text-sm);
  font-weight: 550;
}

.home__legend-hint {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ── Mi día ── */
.home__myday {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-4) var(--app-space-8);
}

.home__myday-state {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  margin-inline-end: auto;
}

.home__myday-label {
  margin: 0;
  font-size: var(--app-text-xl);
  font-weight: 600;
  line-height: 1.2;
}

.home__myday-hint {
  margin: 2px 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__dot--lg {
  width: 12px;
  height: 12px;
  margin-top: 0;
}

.home__dot--in {
  background: rgb(var(--v-theme-success));
}

.home__dot--out {
  background: rgb(var(--v-theme-primary));
}

.home__dot--none {
  background: rgba(var(--v-theme-on-surface), 0.25);
}

.home__facts {
  display: flex;
  gap: var(--app-space-8);
  margin: 0;
}

.home__fact dt {
  font-size: var(--app-text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--app-tracking-wide);
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__fact dd {
  margin: 2px 0 0;
  font-size: var(--app-text-lg);
  font-weight: 500;
}

/* ── Tarjetas de acceso ── */
.home__card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  transition:
    border-color var(--app-transition),
    background-color var(--app-transition);
}

.home__card:hover,
.home__card:focus-visible {
  border-color: rgba(var(--v-theme-primary), 0.55);
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.home__card-body {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

.home__tile {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--app-radius-md);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.home__card-text {
  min-width: 0;
  flex: 1;
}

.home__card-title {
  margin: 0;
  font-size: var(--app-text-base);
  font-weight: 600;
  line-height: 1.3;
}

.home__card-desc {
  margin: 2px 0 0;
  font-size: var(--app-text-sm);
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface-variant));
}

.home__arrow {
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-4px);
  color: rgb(var(--v-theme-primary));
  transition:
    opacity var(--app-transition),
    transform var(--app-transition);
}

.home__card:hover .home__arrow,
.home__card:focus-visible .home__arrow {
  opacity: 1;
  transform: none;
}

@media (hover: none) {
  .home__arrow {
    opacity: 0.5;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home__card,
  .home__arrow {
    transition: none;
  }
}

@media (max-width: 600px) {
  .home__clocks {
    width: 100%;
  }
  .home__clock {
    align-items: flex-start;
  }
}
</style>
