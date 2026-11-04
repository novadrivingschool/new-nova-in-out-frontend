<!--
  src/pages/external-activity-report/index.vue

  Activity Report EXTERNO (Vout.net) dentro del NIO. SOLO LECTURA: lo que cada usuario con
  "Use external AR" registra en Vout. Independiente del Activity Report del NIO y del WebSocket
  (se actualiza con el botón, al volver a la pestaña y cada 30 s con la pestaña visible).
-->
<template>
  <PageContainer variant="fluid">
    <PageHeader title="External Activity Report" subtitle="Vout.net · read only">
      <template #actions>
        <span class="text-medium-emphasis text-caption mr-2">Chicago · {{ today }}</span>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="refreshAll">
          Refresh
        </v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" :text="errorMsg" closable @click:close="errorMsg = ''" />

    <!-- Mi día -->
    <v-card class="pa-4 mb-4" variant="flat" border>
      <div class="d-flex align-center ga-3 mb-2 flex-wrap">
        <h2 class="text-subtitle-1 font-weight-bold">My day</h2>
        <template v-if="myDay">
          <v-chip size="small" :color="myDay.state.clockedIn ? 'success' : undefined" variant="tonal">
            {{ myDay.state.clockedIn ? (myDay.state.lunchOpen ? 'On lunch' : myDay.state.brbOpen ? 'On BRB' : 'Clocked In') : 'Clocked Out' }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">AR # {{ myDay.arNumber }}</span>
        </template>
      </div>
      <v-alert v-if="notEnabled" type="info" variant="tonal" density="compact"
        text="Your user does not use the external AR. Use the NIO Activity Report instead." />
      <v-alert v-else-if="myMsg" type="warning" variant="tonal" density="compact" :text="myMsg" />
      <EventsTable v-else-if="myDay" :events="myDay.events" :show-employee="false" />
      <v-skeleton-loader v-else type="table" />
    </v-card>

    <!-- Admin: en vivo -->
    <v-card v-if="isAdmin" class="pa-4 mb-4" variant="flat" border>
      <h2 class="text-subtitle-1 font-weight-bold mb-2">Live (clocked in today)</h2>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Employee</th><th>AR #</th><th>Status</th><th>First clock in</th><th>Last event</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in live?.data ?? []" :key="r.employee_number">
            <td>{{ r.employee_full_name }}</td>
            <td>{{ r.employee_number }}</td>
            <td>
              <v-chip v-if="r.brbOpen" size="x-small" :color="brbCritical(r) ? 'error' : 'warning'" variant="tonal">
                BRB {{ brbElapsed(r) }}
              </v-chip>
              <v-chip v-else-if="r.lunchOpen" size="x-small" color="info" variant="tonal">Lunch</v-chip>
              <v-chip v-else-if="r.bioOpen" size="x-small" variant="tonal">Bio break</v-chip>
              <v-chip v-else size="x-small" color="success" variant="tonal">
                {{ r.activityOpenCount ? `Activity (${r.activityOpenCount})` : 'Clocked In' }}
              </v-chip>
            </td>
            <td>{{ r.first_clock_in_time ?? '—' }}</td>
            <td>{{ r.last_event_type }}</td>
          </tr>
          <tr v-if="live && !live.data.length">
            <td colspan="5" class="text-medium-emphasis text-center">Nobody is clocked in on the external AR.</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Admin: rango -->
    <v-card v-if="isAdmin" class="pa-4" variant="flat" border>
      <div class="d-flex align-center ga-3 flex-wrap mb-2">
        <h2 class="text-subtitle-1 font-weight-bold">Events by range</h2>
        <v-text-field v-model="start" type="date" label="From" density="compact" hide-details style="max-width: 170px" />
        <v-text-field v-model="end" type="date" label="To" density="compact" hide-details style="max-width: 170px" />
        <v-btn size="small" color="primary" :loading="loadingRange" @click="loadRange">Search</v-btn>
        <span class="text-caption text-medium-emphasis">Max. 31 days</span>
      </div>
      <EventsTable v-if="range" :events="range.data" show-employee />
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuth } from '@/stores/auth/useAuth'
import { externalActivityService } from '@/services/externalActivity.service'
import { chicagoDate, chicagoTime, hhmmssToSeconds, secondsToHHMMSS } from '@/utils/clockSession'
import { brbToleranceOf, isBrbCritical } from '@/utils/brb'
import type {
  ExternalArDay,
  ExternalArEvent,
  ExternalArEvents,
  ExternalArOpenNow,
  ExternalArOpenNowRow,
} from '@/types/externalActivity'
import type { RemoteClockError } from '@/types/remoteClock'

const auth = useAuth()
const isAdmin = computed(() => !!auth.user?.roles?.some((r: string) => ['admin', 'super_admin'].includes(r)))

const today = ref(chicagoDate())
const nowTime = ref(chicagoTime())
const loading = ref(false)
const loadingRange = ref(false)
const errorMsg = ref('')

const myDay = ref<ExternalArDay | null>(null)
const notEnabled = ref(false)
const myMsg = ref('')
const live = ref<ExternalArOpenNow | null>(null)
const range = ref<ExternalArEvents | null>(null)
const start = ref(chicagoDate())
const end = ref(chicagoDate())

/** Tabla de eventos (componente local mínimo, solo lectura). */
const EventsTable = defineComponent({
  props: { events: { type: Array as () => ExternalArEvent[], required: true }, showEmployee: Boolean },
  setup(p) {
    return () =>
      h('div', { style: 'overflow-x:auto' }, [
        h('table', { class: 'v-table v-table--density-compact', style: 'width:100%' }, [
          h('thead', h('tr', [
            ...(p.showEmployee ? [h('th', 'Date'), h('th', 'Employee')] : []),
            h('th', 'Type'), h('th', 'Start'), h('th', 'End'), h('th', 'Total'), h('th', 'Detail'),
          ])),
          h('tbody', p.events.length
            ? p.events.map((e) => h('tr', { key: e.id }, [
                ...(p.showEmployee ? [h('td', e.created_date), h('td', `${e.employee_name} (${e.external_employee_number})`)] : []),
                h('td', e.type + (e.read_only ? ' · view only' : '') + (e.is_open ? ' · open' : '')),
                h('td', e.start_time), h('td', e.is_open ? '—' : e.end_time),
                h('td', e.is_open ? '—' : e.total_time),
                h('td', [e.title, e.reason, ...e.customers].filter(Boolean).join(' · ') || '—'),
              ]))
            : [h('tr', h('td', { colspan: p.showEmployee ? 7 : 5, style: 'text-align:center;opacity:.6' }, 'No events'))]),
        ]),
      ])
  },
})

function msgOf(e: unknown): RemoteClockError {
  return e as RemoteClockError
}

function brbSeconds(r: ExternalArOpenNowRow): number {
  if (!r.brb_since) return 0
  return Math.max(0, hhmmssToSeconds(nowTime.value) - hhmmssToSeconds(r.brb_since))
}
const brbElapsed = (r: ExternalArOpenNowRow) => secondsToHHMMSS(brbSeconds(r))
const brbCritical = (r: ExternalArOpenNowRow) =>
  isBrbCritical(brbSeconds(r), brbToleranceOf(live.value?.brb_tolerance_sec))

async function loadMine() {
  notEnabled.value = false
  myMsg.value = ''
  try {
    myDay.value = await externalActivityService.day()
  } catch (e) {
    const err = msgOf(e)
    myDay.value = null
    if (err.code === 'EXTERNAL_AR_NOT_ENABLED') notEnabled.value = true
    else myMsg.value = err.message
  }
}

async function loadLive() {
  if (!isAdmin.value) return
  try {
    live.value = await externalActivityService.openNow()
  } catch (e) {
    errorMsg.value = msgOf(e).message
  }
}

async function loadRange() {
  loadingRange.value = true
  errorMsg.value = ''
  try {
    range.value = await externalActivityService.events(start.value, end.value)
  } catch (e) {
    errorMsg.value = msgOf(e).message
  } finally {
    loadingRange.value = false
  }
}

async function refreshAll() {
  loading.value = true
  today.value = chicagoDate()
  await Promise.all([loadMine(), loadLive()])
  loading.value = false
}

let timer: number | undefined
let tick: number | undefined
const onVisible = () => { if (document.visibilityState === 'visible') refreshAll() }

onMounted(() => {
  refreshAll()
  tick = window.setInterval(() => { nowTime.value = chicagoTime() }, 1000)
  // Sin WebSocket: refresco suave solo con la pestaña visible.
  timer = window.setInterval(() => { if (document.visibilityState === 'visible') refreshAll() }, 30000)
  document.addEventListener('visibilitychange', onVisible)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (tick) clearInterval(tick)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>
