<!--
  src/components/AdminDashboard/charts/ActivityByHourChart.vue

  Minutos ACTIVOS vs INACTIVOS por hora, a partir de los registros de
  actividad de la app de escritorio. Énfasis: lo activo en azul, lo inactivo
  en gris de contexto. Columnas apiladas con 2px de separación.
-->
<template>
  <ChartCard
    title="Activity by hour"
    :info="chartHelp.activityByHour"
    subtitle="Active vs idle minutes tracked by the desktop app"
    :loading="loading"
    :empty="visible.length === 0"
    empty-title="No activity data"
    empty-description="The desktop app has not reported activity for this date."
  >
    <apexchart
      type="bar"
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
import { mergeOptions, useChartTheme } from '@/composables/useChartTheme'
import { formatHour, roundTo } from '@/utils/chartFormat'
import type { ActivityPoint } from '@/types/attendanceDashboard'

const props = defineProps<{ points: ActivityPoint[]; loading?: boolean }>()

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 240 : 290))

/** Rango contiguo de horas con actividad (las horas intermedias vacías se conservan). */
const visible = computed(() => {
  const withData = props.points.filter((p) => p.activeMin + p.inactiveMin > 0)
  if (!withData.length) return []
  const lo = withData[0].hour
  const hi = withData[withData.length - 1].hour
  return props.points.filter((p) => p.hour >= lo && p.hour <= hi)
})

const series = computed(() => [
  { name: 'Active', data: visible.value.map((p) => roundTo(p.activeMin, 0)) },
  { name: 'Idle', data: visible.value.map((p) => roundTo(p.inactiveMin, 0)) },
])

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    chart: { stacked: true },
    colors: [colors.value.primary, colors.value.neutral],
    plotOptions: {
      bar: {
        columnWidth: '62%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    stroke: { show: true, width: 2, colors: [colors.value.surface] },
    xaxis: {
      categories: visible.value.map((p) => formatHour(p.hour)),
      tickAmount: smAndDown.value ? 5 : undefined,
    },
    yaxis: {
      min: 0,
      labels: { formatter: (value: number) => String(Math.round(value)) },
      title: {
        text: 'Minutes',
        style: { color: colors.value.inkSoft, fontSize: '11px', fontWeight: 500 },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (value: number) => `${value} min` },
    },
  }),
)
</script>
