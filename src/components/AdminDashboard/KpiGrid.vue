<!--
  src/components/AdminDashboard/KpiGrid.vue

  KPIs del día en dos bloques:
   1. Asistencia: quién está, quién ya fichó, quién falta y la tasa de asistencia.
      Las tres primeras tarjetas enlazan a su lista de detalle (conservando la
      fecha elegida).
   2. Tiempo y actividad: horas, promedio, tasa de actividad, hora media de
      llegada, pico de presencia y turnos sin cierre.

  Los textos cambian según se vea hoy ("en vivo") o un día pasado.
-->
<template>
  <div class="kpis">
    <section v-for="group in groups" :key="group.title" class="kpis__group">
      <h2 class="app-eyebrow kpis__heading">{{ group.title }}</h2>

      <div class="app-autogrid" style="--app-autogrid-min: 13rem">
        <StatCard
          v-for="card in group.cards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :unit="card.unit"
          :hint="card.hint"
          :info="card.info"
          :loading="loading"
          :interactive="!!card.route"
          :role="card.route ? 'link' : undefined"
          :tabindex="card.route ? 0 : undefined"
          @click="open(card.route)"
          @keydown.enter="open(card.route)"
          @keydown.space.prevent="open(card.route)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/common/StatCard.vue'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { formatHour, roundTo } from '@/utils/chartFormat'
import { kpiHelp } from './dashboardHelp'
import type { AttendanceDashboard } from '@/types/attendanceDashboard'

interface Card {
  label: string
  value: number | string | null
  unit?: string
  hint: string
  /** Texto del tooltip "i". */
  info: string
  /** Ruta de detalle; sin ella la tarjeta no es un enlace. */
  route?: string
}

const props = defineProps<{
  data: AttendanceDashboard | null
  loading?: boolean
}>()

const router = useRouter()
const { date, isToday } = useSelectedDate()

const num = (value: number | null | undefined, digits = 1): number | null =>
  value === null || value === undefined ? null : roundTo(value, digits)

const groups = computed(() => {
  const d = props.data
  const live = isToday.value
  const k = d?.kpis

  const attendance: Card[] = [
    {
      label: live ? 'Clocked in now' : 'Still clocked in',
      value: d?.counts.clockedInNow ?? null,
      hint: live ? 'Currently on the clock' : 'No clock out recorded that day',
      info: kpiHelp.clockedInNow,
      route: '/clocked-in-now',
    },
    {
      label: live ? 'Clocked in today' : 'Clocked in that day',
      value: d?.counts.clockedInToday ?? null,
      hint: 'At least one entry',
      info: kpiHelp.clockedInToday,
      route: '/clocked-in-today',
    },
    {
      label: live ? 'Not clocked in now' : 'Off the clock',
      value: d?.counts.notClockedIn ?? null,
      hint: live ? 'Off the clock right now' : 'Not on the clock at day end',
      info: kpiHelp.notClockedIn,
      route: '/not-clocked-in-now',
    },
    {
      label: 'Attendance rate',
      value: num(k?.attendanceRate),
      unit: '%',
      hint: k ? `Of ${k.activeEmployees} active employees` : 'Of active employees',
      info: kpiHelp.attendanceRate,
    },
  ]

  const time: Card[] = [
    {
      label: 'Hours worked',
      value: num(k?.totalWorkedHours),
      unit: 'h',
      hint: live ? 'Includes shifts in progress' : 'Closed shifts only',
      info: kpiHelp.hoursWorked,
    },
    {
      label: 'Avg hours per employee',
      value: num(k?.avgWorkedHours),
      unit: 'h',
      hint: 'Among those who clocked in',
      info: kpiHelp.avgHours,
    },
    {
      label: 'Activity rate',
      value: num(k?.activityRate),
      unit: '%',
      hint: k
        ? `${num(k.activeHours)} h active · ${num(k.inactiveHours)} h idle`
        : 'Active time vs tracked time',
      info: kpiHelp.activityRate,
    },
    {
      label: 'Avg first clock in',
      value: k?.avgFirstClockIn ?? null,
      hint: 'Average arrival time',
      info: kpiHelp.avgFirstClockIn,
    },
    {
      label: 'Peak presence',
      value: k?.peak?.count ?? null,
      hint: k?.peak ? `People on the clock at ${formatHour(k.peak.hour)}` : 'No shifts recorded',
      info: kpiHelp.peakPresence,
    },
    {
      label: 'Admin clock outs',
      value: k?.adminClockOuts ?? null,
      hint: 'Shifts closed by an administrator',
      info: kpiHelp.adminClockOuts,
    },
  ]

  // En vivo, "turnos sin cierre" son simplemente los que están en turno
  // (ya cubierto por "Clocked in now"); solo es una alerta en días pasados.
  if (!live) {
    time.push({
      label: 'Missing clock out',
      value: k?.openShifts ?? null,
      hint: 'Shifts never closed that day',
      info: kpiHelp.missingClockOut,
    })
  }

  return [
    { title: 'Attendance', cards: attendance },
    { title: 'Time & activity', cards: time },
  ]
})

/** Navega al detalle conservando la fecha (omitida si es hoy). */
function open(path: string | undefined): void {
  if (!path) return
  router.push({ path, query: isToday.value ? {} : { date: date.value } })
}
</script>

<style scoped>
.kpis {
  display: grid;
  gap: var(--app-space-5);
  margin-bottom: var(--app-space-6);
}

.kpis__heading {
  margin: 0 0 var(--app-space-3);
}
</style>
