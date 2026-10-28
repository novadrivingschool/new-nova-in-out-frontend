<template>
  <PageContainer variant="fluid">
    <PageHeader
      title="Live staff activity"
      subtitle="Monitor active device sessions in real time"
    >
      <template #actions>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :size="btnSize"
          :loading="loading.devices"
          @click="loadDevices"
        >
          Refresh
        </v-btn>
      </template>
    </PageHeader>

    <p v-if="lastError" class="live__error" role="alert">{{ lastError }}</p>

    <v-card>
      <div class="live__toolbar">
        <span class="live__status">
          <span class="live__dot" :class="{ 'live__dot--idle': !activeCount }" />
          {{ activeCount }} active {{ activeCount === 1 ? 'session' : 'sessions' }}
          <span v-if="noConnectionCount" class="live__warn">· {{ noConnectionCount }} without connection</span>
          <span v-if="outOfSyncCount" class="live__warn">· {{ outOfSyncCount }} out of sync</span>
          <span v-if="offlineCount" class="live__muted">· {{ offlineCount }} offline</span>
        </span>

        <v-spacer />

        <v-switch
          v-model="showOffline"
          hide-details
          density="compact"
          color="primary"
          label="Show offline"
          class="live__switch"
        />

        <span class="live__updated">Auto-refreshes every 20s</span>
      </div>

      <v-divider />

      <DataTableResponsive
        :headers="headers"
        :items="rows"
        :loading="loading.devices"
        item-value="rowKey"
        show-expand
        v-model:expanded="expanded"
        card-title-key="fullName"
        card-subtitle-key="label"
        no-data-text="No active sessions"
        no-data-description="Nobody is clocked in right now."
        no-data-icon="mdi-monitor-off"
      >
        <template #item.fullName="{ item }">
          <div class="d-flex align-center ga-2 justify-end justify-md-start">
            <span class="live__avatar">{{ item.initials }}</span>
            <span class="text-start">{{ item.fullName }}</span>
          </div>
        </template>

        <template #item.status="{ item }">
          <div class="d-flex flex-column align-start ga-1">
            <div class="d-flex align-center ga-2">
              <span
                class="live__badge"
                :class="item.status === 'Active' ? 'live__badge--on' : item.status === 'Offline' ? 'live__badge--off' : 'live__badge--warn'"
                :title="item.statusDetail"
              >
                <span class="live__badge-dot" />
                {{ item.status }}
              </span>
              <v-chip
                size="x-small"
                label
                :color="item.linked ? 'primary' : undefined"
                :variant="item.linked ? 'flat' : 'outlined'"
              >
                {{ item.mode }}
              </v-chip>
            </div>
            <!-- Modo NIO + AR: cuál lado está bien y cuál no -->
            <div v-if="item.linked" class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="side in item.sides"
                :key="side.name"
                size="x-small"
                label
                variant="tonal"
                :color="side.color"
                :prepend-icon="side.icon"
                :title="side.title"
              >
                {{ side.name }} · {{ side.text }}
              </v-chip>
            </div>
          </div>
        </template>

        <template #item.clockedInAt="{ item }">
          <span v-if="item.clockedInAt" class="text-body-2">{{ item.clockedInAt }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.client="{ item }">
          <span class="live__client">{{ item.client }}</span>
        </template>

        <template #item.deviceId="{ item }">
          <span class="live__device-id" :title="item.deviceId">
            {{ item.deviceIdShort }}
          </span>
        </template>

        <!-- Chevron solo si el usuario tiene historial de handshakes -->
        <template #item.data-table-expand="{ item }">
          <v-btn
            v-if="item.handshakeCount > 0 || item.adminClockOutCount > 0"
            :icon="expanded.includes(item.rowKey) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="small"
            variant="text"
            :aria-label="`History of ${item.fullName}`"
            :title="`${item.handshakeCount} handshake(s) · ${item.adminClockOutCount} admin clock out(s)`"
            @click.stop="toggleRow(item.rowKey)"
          />
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0">
              <div v-if="item.handshakeCount > 0">
                <div class="live__subhead">Handshakes</div>
                <HandshakeHistory
                  :user-id="item.userId"
                  :refresh-key="historyRefresh"
                  @open="openHandshake"
                />
              </div>
              <div v-if="item.adminClockOutCount > 0">
                <div class="live__subhead">Admin clock outs</div>
                <AdminClockOutHistory
                  :employee-number="item.employeeNumber"
                  :refresh-key="adminHistoryRefresh"
                />
              </div>
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <v-tooltip :text="`Clock out ${item.fullName} (admin)`" location="top">
            <template #activator="{ props: tip }">
              <v-btn
                v-bind="tip"
                icon="mdi-logout-variant"
                size="small"
                variant="text"
                color="warning"
                :aria-label="`Force clock out ${item.fullName}`"
                :disabled="!item.hasOpenSession || !item.employeeNumber"
                @click="openForceClockOut(item)"
              />
            </template>
          </v-tooltip>
          <v-tooltip :text="`Test connection with ${item.fullName} (animation only, no screenshot)`" location="top">
            <template #activator="{ props: tip }">
              <v-btn
                v-bind="tip"
                icon="mdi-access-point"
                size="small"
                variant="text"
                color="primary"
                :aria-label="`Ping ${item.fullName}`"
                :disabled="!item.online || !item.userId"
                :loading="loading.pingId === item.rowKey"
                @click="pingUser(item)"
              />
            </template>
          </v-tooltip>
          <v-tooltip :text="`Request screenshot + activity from ${item.fullName}`" location="top">
            <template #activator="{ props: tip }">
              <v-btn
                v-bind="tip"
                icon="mdi-hand-back-right-outline"
                size="small"
                variant="text"
                color="primary"
                :aria-label="`Handshake with ${item.fullName}`"
                :disabled="!item.online || !item.userId"
                :loading="loading.helloId === item.rowKey"
                @click="startHandshake(item)"
              />
            </template>
          </v-tooltip>
        </template>
      </DataTableResponsive>
    </v-card>

    <HandshakeDialog v-model="dialog.show" :handshake="dialog.handshake" />

    <ForceClockOutDialog
      v-model="forceDialog.show"
      :employee-name="forceDialog.name"
      :employee-number="forceDialog.employeeNumber"
      @done="onForceDone"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { http, ensureFreshAccessToken } from '@/lib/http'
import { useResponsive } from '@/composables/useResponsive'
import { useAdminSocket } from '@/composables/useAdminSocket'
import type { HandshakeView, PingResult } from '@/types/handshake'
import HandshakeDialog from '@/components/LiveActivity/HandshakeDialog.vue'
import HandshakeHistory from '@/components/LiveActivity/HandshakeHistory.vue'
import AdminClockOutHistory from '@/components/LiveActivity/AdminClockOutHistory.vue'
import ForceClockOutDialog from '@/components/LiveActivity/ForceClockOutDialog.vue'
import {
  FORCE_CLOCK_OUT_REASON_LABEL,
  type AdminClockOutView,
  type ForceClockOutReason,
} from '@/types/adminClockOut'
import { STATUS_LABEL } from '@/components/LiveActivity/handshakeFormat'
import NovaInOutServices from '@/services/NovaInOutServices'
import { getTodayString } from '@/utils/getTodayString'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTableResponsive, {
  type ResponsiveHeader,
} from '@/components/common/DataTableResponsive.vue'

interface DeviceUser {
  email?: string | null
  profile?: {
    firstName?: string
    lastName?: string
    employee_number?: string
    /** true = modo NIO + AR (clock in/out siempre juntos); false = NIO independiente. */
    activity_linked?: boolean
  } | null
}

interface DeviceRecord {
  userId?: string
  handshakeCount?: number
  deviceId: string | null
  client?: string
  label?: string
  user?: DeviceUser | null
  /** Presencia real: hay un socket conectado (se abre en clock-in, se cierra en clock-out). */
  online?: boolean
  /** Hay un socket registrado (con o sin turno). */
  connected?: boolean
}

/** El listado es un monitor en vivo: se refresca solo. */
const REFRESH_MS = 20_000

const { btnSize } = useResponsive()

const loading = reactive({ devices: false, helloId: null as string | null, pingId: null as string | null })
const lastError = ref('')
const snackbar = reactive({ show: false, text: '', color: 'success' })

/** Handshake abierto en el dialog y filas con el historial desplegado. */
const dialog = reactive({ show: false, handshake: null as HandshakeView | null })
const expanded = ref<string[]>([])
/** Se incrementa con cada resultado para que los historiales abiertos se recarguen. */
const historyRefresh = ref(0)

/** Por defecto solo se listan los activos; las sesiones sin socket se ocultan. */
const showOffline = ref(false)
const user = ref<DeviceUser | null>(null)
const devices = ref<DeviceRecord[]>([])

/** Último CLOCK_IN de hoy por employee_number (fuente: asistencia, no el socket). */
const clockIns = ref<Record<string, string>>({})
/** employee_numbers con el Activity Report abierto hoy. null = no se pudo consultar. */
const arOpen = ref<Set<string> | null>(null)
/** Clock outs hechos por admin, por employee_number (historial independiente del handshake). */
const adminCounts = ref<Record<string, number>>({})
const adminHistoryRefresh = ref(0)
const forceDialog = reactive({ show: false, name: '', employeeNumber: '' })
let refreshTimer: ReturnType<typeof setInterval> | null = null

const headers: ResponsiveHeader[] = [
  { title: 'Full name', key: 'fullName', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Clocked in', key: 'clockedInAt', align: 'start' },
  { title: 'Client', key: 'client', align: 'start' },
  { title: 'Label', key: 'label', align: 'start' },
  { title: 'Device ID', key: 'deviceId', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]

function fullNameFromUser(value: DeviceUser | null): string {
  const first = value?.profile?.firstName ?? ''
  const last = value?.profile?.lastName ?? ''
  const name = `${first} ${last}`.trim()
  return name || value?.email || 'Unknown'
}

const allRows = computed(() =>
  devices.value.map((device) => {
    // Con `all=true` cada dispositivo trae su propio usuario; con `all=false`
    // el backend lo envía una sola vez en la raíz de la respuesta.
    const owner = device.user ?? user.value ?? null
    const fullName = fullNameFromUser(owner)

    const online = device.online === true
    const connected = device.connected === true
    const empNumber = owner?.profile?.employee_number ?? ''
    const linked = owner?.profile?.activity_linked === true
    const nioOpen = !!(empNumber && clockIns.value[empNumber])
    // Si AR no se pudo consultar no se puede afirmar desincronización.
    const arKnown = arOpen.value !== null
    const arIsOpen = !!(empNumber && arOpen.value?.has(empNumber))
    // NIO + AR van de la mano: turno abierto en uno solo es un estado inválido.
    const outOfSync = linked && arKnown && nioOpen !== arIsOpen
    const hasOpenSession = nioOpen || (linked && arIsOpen)
    // Prioridad al que ya tiene el clock in: ese es el activo; el otro es el desincronizado.
    const syncNote = outOfSync
      ? nioOpen
        ? 'NIO clocked in · Activity not synced'
        : 'Activity clocked in · NIO not synced'
      : ''
    // Por lado: el que tiene el turno abierto está bien; el otro, si falta, es el desincronizado.
    const sideOf = (name: string, open: boolean, known = true) => {
      if (!known) return { name, text: 'unknown', color: undefined, icon: 'mdi-help-circle-outline', title: `${name}: unknown` }
      if (open) return { name, text: 'Clocked in', color: 'success', icon: 'mdi-check-circle', title: `${name}: clocked in (OK)` }
      if (outOfSync) return { name, text: 'Not clocked in', color: 'warning', icon: 'mdi-alert-circle', title: `${name}: not clocked in — out of sync` }
      return { name, text: 'Clocked out', color: undefined, icon: 'mdi-circle-outline', title: `${name}: clocked out` }
    }
    const sides = [sideOf('NIO', nioOpen), sideOf('Activity', arIsOpen, arKnown)]
    const status: 'Active' | 'No connection' | 'Out of sync' | 'Offline' = outOfSync
      ? 'Out of sync'
      : online
        ? 'Active'
        : hasOpenSession
          ? 'No connection'
          : 'Offline'
    const statusDetail = [
      `Mode: ${linked ? 'NIO + AR' : 'NIO only'}`,
      `Socket: ${connected ? 'connected' : 'disconnected'}${connected ? (online ? ' (on shift)' : ' (off shift)') : ''}`,
      `NIO shift: ${nioOpen ? 'open' : 'closed'}`,
      ...(linked ? [`AR shift: ${arKnown ? (arIsOpen ? 'open' : 'closed') : 'unknown'}`] : []),
    ].join(' · ')

    const initials =
      [owner?.profile?.firstName?.[0], owner?.profile?.lastName?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() || (fullName[0] ?? '?').toUpperCase()

    return {
      // deviceId es null si el usuario nunca abrió la app: la clave de fila usa el userId.
      rowKey: device.deviceId ?? `user:${device.userId ?? fullName}`,
      userId: device.userId ?? '',
      handshakeCount: device.handshakeCount ?? 0,
      deviceId: device.deviceId ?? '',
      // El deviceId completo es ilegible en una celda; el título lo muestra entero.
      deviceIdShort:
        !device.deviceId
          ? '—'
          : device.deviceId.length > 14
            ? `${device.deviceId.slice(0, 8)}…${device.deviceId.slice(-4)}`
            : device.deviceId,
      client: device.client ?? '—',
      label: device.label ?? '—',
      fullName,
      initials,
      online,
      connected,
      linked,
      mode: linked ? 'NIO + AR' : 'NIO',
      status,
      statusDetail: syncNote ? `${syncNote} · ${statusDetail}` : statusDetail,
      syncNote,
      sides,
      clockedInAt: (empNumber && clockIns.value[empNumber]) || '',
      employeeNumber: empNumber,
      // Turno abierto en asistencia aunque el socket ya no esté (sin luz / sin internet).
      hasOpenSession,
      adminClockOutCount: (empNumber && adminCounts.value[empNumber]) || 0,
      email: owner?.email ?? null,
    }
  }),
)

const activeCount = computed(() => allRows.value.filter((r) => r.status === 'Active').length)
const noConnectionCount = computed(() => allRows.value.filter((r) => r.status === 'No connection').length)
const outOfSyncCount = computed(() => allRows.value.filter((r) => r.status === 'Out of sync').length)
const offlineCount = computed(
  () => allRows.value.length - activeCount.value - noConnectionCount.value - outOfSyncCount.value,
)
/** Por defecto: activos + turnos abiertos sin conexión (para poder hacerles clock out). */
const rows = computed(() =>
  showOffline.value
    ? allRows.value
    : allRows.value.filter((r) => r.online || r.hasOpenSession || r.status === 'Out of sync'),
)

/** Reintenta una vez tras refrescar el token si la primera llamada da 401. */
async function withAuthRetry<T>(fn: () => Promise<T>, label = ''): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    const status = error?.response?.status
    console.warn(`[retry] ${label} first try failed`, status, error?.message)
    if (status === 401) {
      await ensureFreshAccessToken()
      return await fn()
    }
    throw error
  }
}

function messageForError(error: any): string {
  const code = error?.code
  const status = error?.response?.status ?? error?.status
  const serverMessage = error?.response?.data?.message ?? error?.serverMessage

  if (code === 'NO_REFRESH_TOKEN') {
    return 'No refresh token in this browser. Sign in again on the web app.'
  }
  if (code === 'REFRESH_401' || status === 401) {
    const detail = serverMessage ? ` Details: ${serverMessage}` : ''
    return `The server rejected the token refresh (401). Sign in again on the web app.${detail}`
  }
  if (code === 'BAD_REFRESH_RESPONSE') {
    return 'The backend did not return tokens on refresh.'
  }
  return serverMessage || error?.message || String(error)
}

function notify(text: string, color: 'success' | 'error' | 'warning' = 'success'): void {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

async function loadDevices(): Promise<void> {
  loading.devices = true
  lastError.value = ''
  try {
    // Vista de monitoreo: siempre todos los usuarios (el backend exige rol admin).
    const url = '/devices/online?all=true'
    const [response, clocked, counts, arOpenList] = await Promise.all([
      withAuthRetry(() => http.get(url), `GET ${url}`),
      // El clock-in viene de asistencia; si falla no debe tumbar la vista.
      NovaInOutServices.getClockedInNow(getTodayString()).catch((err: unknown) => {
        console.warn('[live-staff] clocked-in-now falló; Clocked in no se mostrará', err)
        return []
      }),
      NovaInOutServices.getAdminClockOutCounts().catch((err: unknown) => {
        console.warn('[live-staff] admin clock-out counts falló', err)
        return {} as Record<string, number>
      }),
      // Activity Report abierto hoy; si falla no se afirma desincronización.
      NovaInOutServices.getActivityOpenNow(getTodayString()).catch((err: unknown) => {
        console.warn('[live-staff] activity open-now falló; modo NIO+AR sin validación de AR', err)
        return null
      }),
    ])
    arOpen.value = Array.isArray(arOpenList) ? new Set(arOpenList) : null
    adminCounts.value = counts ?? {}
    user.value = response.data?.user ?? null
    devices.value = Array.isArray(response.data?.devices)
      ? response.data.devices
      : []

    const map: Record<string, string> = {}
    for (const log of Array.isArray(clocked) ? clocked : []) {
      if (log?.employee_number && log?.clock_time) map[log.employee_number] = log.clock_time
    }
    console.debug('[live-staff] clock-ins hoy:', Object.keys(map).length, 'registros:', Array.isArray(clocked) ? clocked.length : clocked)
    clockIns.value = map
  } catch (error) {
    console.error('[devices] load error:', error)
    lastError.value = messageForError(error)
    devices.value = []
  } finally {
    loading.devices = false
  }
}

// ── Handshake: captura de pantalla + actividad bajo demanda ─────────────────

const adminSocket = useAdminSocket()
let offHandshake: (() => void) | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollId: string | null = null

/** Sondeo de respaldo por si el evento del WebSocket no llega (cada 3s, máx. 60s). */
function startPoll(id: string): void {
  stopPoll()
  pollId = id
  const startedAt = Date.now()
  pollTimer = setInterval(async () => {
    if (Date.now() - startedAt > 60_000) return stopPoll()
    try {
      const res = await http.get<HandshakeView>(`/handshakes/${id}`)
      applyUpdate(res.data)
    } catch {
      /* el siguiente ciclo reintenta */
    }
  }, 3000)
}

function stopPoll(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  pollId = null
}

/** Resultado llegado por WebSocket o por sondeo. */
function applyUpdate(h: HandshakeView): void {
  if (dialog.handshake?.id === h.id) dialog.handshake = h
  if (h.status === 'pending') return

  const visible = dialog.show && dialog.handshake?.id === h.id
  if (pollId === h.id) stopPoll()
  if (!visible) {
    notify(
      `Handshake ${h.targetName ?? ''}: ${STATUS_LABEL[h.status]}`.trim(),
      h.status === 'completed' ? 'success' : 'warning',
    )
  }
  historyRefresh.value += 1
  void loadDevices()
}

async function startHandshake(item: { rowKey: string; userId: string }): Promise<void> {
  if (!item.userId) return
  loading.helloId = item.rowKey
  try {
    const res = await withAuthRetry(
      () => http.post<HandshakeView>('/handshakes', { targetUserId: item.userId }),
      'POST /handshakes',
    )
    dialog.handshake = res.data
    dialog.show = true
    startPoll(res.data.id)
  } catch (error) {
    console.error('[handshake] error:', error)
    notify(messageForError(error), 'error')
  } finally {
    loading.helloId = null
  }
}

/** Prueba de conexión: el NIO del usuario muestra una animación y confirma; no toma captura. */
async function pingUser(item: { rowKey: string; userId: string; fullName?: string }): Promise<void> {
  if (!item.userId || loading.pingId) return
  loading.pingId = item.rowKey
  try {
    const res = await withAuthRetry(
      () => http.post<PingResult>('/handshakes/ping', { targetUserId: item.userId }),
      'POST /handshakes/ping',
    )
    notify(`${item.fullName ?? 'User'}: connection OK · ${res.data.rttMs} ms`)
  } catch (error) {
    console.error('[ping] error:', error)
    notify(messageForError(error), 'error')
  } finally {
    loading.pingId = null
  }
}

function openForceClockOut(item: { fullName: string; employeeNumber: string }): void {
  if (!item.employeeNumber) return
  forceDialog.name = item.fullName
  forceDialog.employeeNumber = item.employeeNumber
  forceDialog.show = true
}

function onForceDone(result: AdminClockOutView): void {
  const label = FORCE_CLOCK_OUT_REASON_LABEL[result.reason as ForceClockOutReason] ?? result.reason
  notify(`${forceDialog.name} was clocked out (${label}).`)
  adminHistoryRefresh.value += 1
  void loadDevices()
}

function toggleRow(key: string): void {
  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter((k) => k !== key)
    : [...expanded.value, key]
}

function openHandshake(h: HandshakeView): void {
  dialog.handshake = h
  dialog.show = true
}

onMounted(() => {
  adminSocket.connect() // idempotente: AppShell ya lo abre con la sesión
  offHandshake = adminSocket.on<HandshakeView>('handshake:update', applyUpdate)
  loadDevices()
  refreshTimer = setInterval(loadDevices, REFRESH_MS)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  offHandshake?.()
  stopPoll()
})
</script>

<style scoped>
.live__switch {
  flex: 0 0 auto;
}

.live__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

.live__status {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-text-sm);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Punto de estado, sin pulso: la animación no aporta información */
.live__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
}

.live__dot--idle {
  background: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.5;
}

.live__muted {
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
}

.live__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-text-sm);
  font-weight: 500;
}

.live__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.5;
}

.live__badge--on .live__badge-dot {
  background: rgb(var(--v-theme-success));
  opacity: 1;
}

.live__badge--warn {
  color: rgb(var(--v-theme-warning));
}

.live__badge--warn .live__badge-dot {
  background: rgb(var(--v-theme-warning));
  opacity: 1;
}

.live__warn {
  font-weight: 500;
  color: rgb(var(--v-theme-warning));
}

.live__subhead {
  padding: var(--app-space-2, 8px) var(--app-space-4, 16px) 0;
  font-size: var(--app-text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.live__badge--off {
  color: rgb(var(--v-theme-on-surface-variant));
}

.live__updated {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.live__device-id {
  font-family: var(--app-font-mono);
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Iniciales en cuadrado neutro: un círculo de color por fila satura la tabla */
.live__avatar {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--app-radius-xs);
  background: rgba(var(--v-theme-on-surface), 0.07);
  font-size: 10px;
  font-weight: 600;
}

.live__client {
  font-family: var(--app-font-mono);
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.live__error {
  margin: 0 0 var(--app-space-4);
  padding-inline-start: var(--app-space-3);
  border-inline-start: 2px solid rgb(var(--v-theme-error));
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-error));
}
</style>
