<!--
  src/components/AppShell/AppShell.vue

  Cromo de la aplicación: barra superior de 48px y navegación lateral.

  El menú no se anuncia: sin ripple, sin iconos de colores, sin sombras. La
  transición del drawer es de 80ms lineales, por debajo del umbral en el que se
  percibe movimiento, de modo que colapsar y expandir se siente inmediato.

  Comportamiento por breakpoint:
    - < 960px  (móvil):  drawer temporal.
    - 960–1280 (tablet): permanente en modo rail.
    - ≥ 1280   (desktop):permanente y expandido.
-->
<template>
  <!-- ═══════════════ BARRA SUPERIOR ═══════════════ -->
  <v-app-bar flat :height="48" color="surface" class="shell-bar">
    <v-btn
      :aria-label="navToggleLabel"
      :icon="mobile ? 'mdi-menu' : rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
      size="small"
      density="comfortable"
      class="shell-bar__toggle"
      @click="toggleNav"
    />

    <RouterLink to="/screenshots" class="shell-brand">
      <span class="shell-brand__mark">N<span class="shell-brand__accent">IO</span></span>
      <span class="shell-brand__divider" aria-hidden="true">/</span>
      <span class="shell-brand__page">{{ currentSection }}</span>
    </RouterLink>

    <v-spacer />

    <!-- ── Estado del WebSocket (tiempo real) ── -->
    <v-tooltip location="bottom" :text="realtimeTooltip">
      <template #activator="{ props: tipProps }">
        <span
          v-bind="tipProps"
          class="shell-realtime"
          :class="`shell-realtime--${realtimeTone}`"
          role="status"
          :aria-label="realtimeTooltip"
        >
          <span class="shell-realtime__dot" aria-hidden="true" />
          <span class="shell-realtime__label d-none d-sm-inline">{{ realtimeLabel }}</span>
        </span>
      </template>
    </v-tooltip>

    <ThemeToggle density="comfortable" />

    <!-- ── Menú de usuario ── -->
    <v-menu :offset="6" location="bottom end">
      <template #activator="{ props: menuProps }">
        <button v-bind="menuProps" class="shell-user" aria-label="Account menu">
          <span class="shell-user__avatar">{{ userInitials }}</span>
          <span class="shell-user__name d-none d-md-inline">{{ userLabel }}</span>
        </button>
      </template>

      <v-card min-width="232" class="pa-0">
        <div class="shell-menu__head">
          <div class="shell-menu__name">{{ userLabel }}</div>
          <div class="shell-menu__meta app-mono">{{ userSubLabel }}</div>
          <div v-if="roleLabels.length" class="shell-menu__roles">
            {{ roleLabels.join(' · ') }}
          </div>
        </div>

        <v-divider />

        <v-list density="compact" nav class="pa-1">
          <v-list-item
            title="Log out"
            base-color="error"
            :disabled="loggingOut"
            @click="handleLogout"
          />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <!-- ═══════════════ NAVEGACIÓN LATERAL ═══════════════ -->
  <v-navigation-drawer
    v-model="drawerOpen"
    :rail="!mobile && rail"
    :permanent="!mobile"
    :temporary="mobile"
    :width="216"
    :rail-width="52"
    color="surface"
    class="shell-nav"
  >
    <v-list nav density="compact" class="pa-1 pt-2">
      <v-tooltip
        v-for="item in visibleMenuItems"
        :key="item.route"
        :text="item.title"
        :disabled="!rail || mobile"
        location="end"
      >
        <template #activator="{ props: tipProps }">
          <v-list-item
            v-bind="tipProps"
            :to="item.route"
            :title="item.title"
            :prepend-icon="item.icon"
            link
          />
        </template>
      </v-tooltip>
    </v-list>

    <template #append>
      <div v-if="!rail || mobile" class="shell-nav__footer">
        Nova Driving School
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'
import { useResponsive } from '@/composables/useResponsive'
import { useAdminSocket } from '@/composables/useAdminSocket'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

interface MenuItem {
  title: string
  icon: string
  route: string
  /** Si se define, solo los usuarios con alguno de estos roles ven la entrada. */
  roles?: string[]
}

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const { mobile, drawerRail } = useResponsive()

// ── WebSocket del admin: se abre con la sesión y se cierra al salir ──
const adminSocket = useAdminSocket()

onMounted(() => {
  if (auth.isLogged) adminSocket.connect()
})

watch(
  () => auth.isLogged,
  (logged) => (logged ? adminSocket.connect() : adminSocket.disconnect()),
)

const realtimeTone = computed(() => {
  switch (adminSocket.status.value) {
    case 'connected':
      return 'ok'
    case 'error':
      return 'error'
    case 'idle':
      return 'idle'
    default:
      return 'warn'
  }
})

const realtimeLabel = computed(() => {
  switch (adminSocket.status.value) {
    case 'connected':
      return 'Realtime OK'
    case 'connecting':
      return 'Connecting…'
    case 'reconnecting':
      return 'Reconnecting…'
    case 'error':
      return 'Realtime error'
    default:
      return 'Realtime off'
  }
})

const realtimeTooltip = computed(() => {
  const since = adminSocket.connectedAt.value
    ? ` desde ${new Date(adminSocket.connectedAt.value).toLocaleTimeString()}`
    : ''
  switch (adminSocket.status.value) {
    case 'connected':
      return `WebSocket conectado${since}. Todo funciona correctamente.`
    case 'connecting':
      return 'Abriendo WebSocket…'
    case 'reconnecting':
      return `Reconectando el WebSocket… ${adminSocket.lastError.value}`.trim()
    case 'error':
      return `WebSocket con error: ${adminSocket.lastError.value || 'desconocido'}`
    default:
      return 'WebSocket desconectado.'
  }
})

/**
 * `undefined` deja que Vuetify decida el estado inicial según el breakpoint;
 * a partir de la primera interacción lo controla el usuario.
 */
const drawerOpen = ref<boolean | undefined>(undefined)

/** Preferencia de rail: se inicializa desde el breakpoint y luego es del usuario. */
const railOverride = ref<boolean | null>(null)
const rail = computed(() => railOverride.value ?? drawerRail.value)

const navToggleLabel = computed(() => {
  if (mobile.value) return drawerOpen.value ? 'Close navigation' : 'Open navigation'
  return rail.value ? 'Expand navigation' : 'Collapse navigation'
})

function toggleNav(): void {
  if (mobile.value) {
    drawerOpen.value = !drawerOpen.value
    return
  }
  railOverride.value = !rail.value
}

const menuItems: MenuItem[] = [
  { title: 'Activity Report', icon: 'mdi-clock-check-outline', route: '/activity-report' },
  { title: 'Screenshots', icon: 'mdi-image-outline', route: '/screenshots' },
  { title: 'Live Activity', icon: 'mdi-pulse', route: '/live-staff-activity' },
  { title: 'Dashboard', icon: 'mdi-chart-box-outline', route: '/admin-dashboard' },
  { title: 'Users', icon: 'mdi-account-outline', route: '/users' },
  {
    title: 'Settings',
    icon: 'mdi-cog-outline',
    route: '/settings',
    roles: ['admin', 'super_admin'],
  },
]

const visibleMenuItems = computed(() =>
  menuItems.filter(
    (item) => !item.roles?.length || item.roles.some((r) => auth.user?.roles?.includes(r)),
  ),
)

/** Sección actual, mostrada junto a la marca como migaja mínima. */
const currentSection = computed(() => {
  const match = menuItems.find((item) => route.path.startsWith(item.route))
  return match?.title ?? ''
})

// Al navegar en móvil, cerrar el drawer para no tapar el contenido.
watch(
  () => route.fullPath,
  () => {
    if (mobile.value) drawerOpen.value = false
  },
)

const user = computed(() => auth.user)

const userLabel = computed(() => {
  const value = user.value
  if (!value) return 'User'
  const full = [value.firstName, value.lastName].filter(Boolean).join(' ').trim()
  return full || value.email || value.employee_number || 'User'
})

/** Debajo del nombre va el employee number: es la credencial de acceso. */
const userSubLabel = computed(
  () => user.value?.employee_number || user.value?.email || '',
)

const userInitials = computed(() => {
  const value = user.value
  const first = value?.firstName?.trim()?.[0]
  const last = value?.lastName?.trim()?.[0]
  if (first || last) return `${first ?? ''}${last ?? ''}`.toUpperCase()
  return (userLabel.value[0] ?? 'U').toUpperCase()
})

const roleLabels = computed(() =>
  (user.value?.roles ?? []).map((role) => role.replace(/_/g, ' ')),
)

const loggingOut = ref(false)

async function handleLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await auth.logout()
    await router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.shell-bar :deep(.v-toolbar__content) {
  padding-inline: var(--app-space-2);
  gap: var(--app-space-1);
}

.shell-bar__toggle {
  opacity: 0.7;
}

.shell-bar__toggle:hover {
  opacity: 1;
}

/* ── Marca + migaja ────────────────────────────────────── */
.shell-brand {
  display: flex;
  align-items: baseline;
  gap: var(--app-space-2);
  margin-inline-start: var(--app-space-2);
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.shell-brand__mark {
  font-size: var(--app-text-base);
  font-weight: 650;
  letter-spacing: var(--app-tracking-tighter);
}

.shell-brand__accent {
  color: rgb(var(--v-theme-primary));
}

.shell-brand__divider {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.45;
  font-size: var(--app-text-sm);
}

.shell-brand__page {
  font-size: var(--app-text-sm);
  font-weight: 450;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Usuario ───────────────────────────────────────────── */
.shell-user {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  height: 30px;
  padding-inline: 5px var(--app-space-2);
  border: none;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color var(--app-transition);
}

.shell-user:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

/**
 * El avatar es un cuadrado neutro con iniciales, no un círculo de color: en un
 * panel corporativo no hay razón para que la esquina superior derecha sea el
 * elemento más saturado de la pantalla.
 */
.shell-user__avatar {
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  border-radius: var(--app-radius-xs);
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
}

.shell-user__name {
  font-size: var(--app-text-sm);
  font-weight: 450;
  max-width: 11rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Menú desplegable ──────────────────────────────────── */
.shell-menu__head {
  padding: var(--app-space-3);
}

.shell-menu__name {
  font-size: var(--app-text-sm);
  font-weight: 550;
  line-height: 1.3;
}

.shell-menu__meta {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.shell-menu__roles {
  font-size: var(--app-text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--app-tracking-wide);
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.7;
  margin-top: var(--app-space-2);
}

/* ── Pie de la navegación ──────────────────────────────── */
.shell-nav__footer {
  padding: var(--app-space-3) var(--app-space-4);
  border-top: 1px solid rgba(var(--v-border-color), 1);
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.6;
  white-space: nowrap;
}

/* ── Indicador de WebSocket ── */
.shell-realtime {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-inline-end: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: default;
  user-select: none;
}

.shell-realtime__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.5;
}

.shell-realtime--ok .shell-realtime__dot {
  background: rgb(var(--v-theme-success));
  opacity: 1;
}

.shell-realtime--warn .shell-realtime__dot {
  background: rgb(var(--v-theme-warning));
  opacity: 1;
}

.shell-realtime--error {
  color: rgb(var(--v-theme-error));
}

.shell-realtime--error .shell-realtime__dot {
  background: rgb(var(--v-theme-error));
  opacity: 1;
}
</style>
