<!--
  src/components/AdminDashboard/charts/HeadcountByHourChart.vue

  Personas con turno activo, por hora. Una sola serie en área: muestra la
  forma del día (picos y valles) mejor que una tabla de horas.
-->
<template>
  <ChartCard
    title="People on the clock"
    :info="chartHelp.headcountByHour"
    subtitle="Employees with a shift in progress, by hour"
    :loading="loading"
    :empty="!hasData"
    empty-title="No shifts yet"
    empty-description="Nobody has clocked in on this date."
  >
    <apexchart
      type="area"
      :height="height"
      :options="options"
      :series="series"
    />
  </ChartCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import ChartCard from './ChartCard.vue'
import { chartHelp } from '../dashboardHelp'
import { useResponsive } from '@/composables/useResponsive'
import {
  integerAxis,
  mergeOptions,
  useChartTheme,
} from '@/composables/useChartTheme'
import { formatHour } from '@/utils/chartFormat'
import type { HourPoint } from '@/types/attendanceDashboard'

const props = defineProps<{ points: HourPoint[]; loading?: boolean }>()

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 240 : 290))

/** Recorta las horas vacías de los extremos (deja una de margen). */
const visible = computed(() => {
  const active = props.points.filter((p) => p.headcount > 0)
  if (!active.length) return []
  const lo = Math.max(0, active[0].hour - 1)
  const hi = Math.min(23, active[active.length - 1].hour + 1)
  return props.points.filter((p) => p.hour >= lo && p.hour <= hi)
})

const hasData = computed(() => visible.value.length > 0)

const series = computed(() => [
  { name: 'People on the clock', data: visible.value.map((p) => p.headcount) },
])

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    stroke: { width: 2, curve: 'straight', colors: [colors.value.primary] },
    fill: { type: 'solid', opacity: 0.16 },
    markers: {
      size: 4,
      colors: [colors.value.primary],
      strokeColors: colors.value.surface,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    xaxis: {
      categories: visible.value.map((p) => formatHour(p.hour)),
      tickPlacement: 'on',
      // En móvil se muestran menos etiquetas para que no se pisen.
      tickAmount: smAndDown.value ? 5 : undefined,
    },
    yaxis: {
      ...integerAxis(Math.max(0, ...visible.value.map((p) => p.headcount))),
      labels: { formatter: (value: number) => String(Math.round(value)) },
    },
    tooltip: {
      y: {
        formatter: (value: number) =>
          `${value} ${value === 1 ? 'person' : 'people'}`,
      },
    },
    legend: { show: false },
  }),
)
</script>
