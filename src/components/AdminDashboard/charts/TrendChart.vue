<!--
  src/components/AdminDashboard/charts/TrendChart.vue

  Una métrica por gráfica (nunca doble eje) a lo largo de los últimos N días
  que terminan en la fecha elegida. Es contexto histórico, no un filtro por
  rango: la fecha seleccionada se resalta en azul y el resto queda en gris.
-->
<template>
  <ChartCard
    :title="title"
    :subtitle="subtitle"
    :info="info"
    :loading="loading"
    :error="error"
    :empty="!hasData"
    empty-title="No history"
    empty-description="There is no data in the days leading up to this date."
  >
    <apexchart
      :type="config.type"
      :height="height"
      :options="options"
      :series="series"
    />
  </ChartCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import apexchart from '@/components/common/ApexChart.vue'
import ChartCard from './ChartCard.vue'
import { chartHelp } from '../dashboardHelp'
import { useResponsive } from '@/composables/useResponsive'
import {
  integerAxis,
  mergeOptions,
  useChartTheme,
} from '@/composables/useChartTheme'
import { formatShortDate, formatShortMonthDay, roundTo } from '@/utils/chartFormat'
import type { TrendDay } from '@/types/attendanceDashboard'

type Metric = 'employees' | 'workedHours' | 'activityRate' | 'adminClockOuts'

const props = defineProps<{
  days: TrendDay[]
  metric: Metric
  title: string
  subtitle?: string
  /** Fecha seleccionada (YYYY-MM-DD): se resalta en la serie. */
  selectedDate: string
  loading?: boolean
  error?: string | null
}>()

const info = computed(() =>
  props.metric === 'employees'
    ? chartHelp.employeesPerDay
    : props.metric === 'workedHours'
      ? chartHelp.hoursPerDay
      : props.metric === 'adminClockOuts'
        ? chartHelp.adminClockOutsPerDay
        : chartHelp.activityPerDay,
)

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 200 : 230))

const config = computed(() => {
  switch (props.metric) {
    case 'employees':
      return {
        type: 'bar' as const,
        name: 'Employees',
        pick: (d: TrendDay): number | null => d.employees,
        format: (v: number) => `${v} ${v === 1 ? 'employee' : 'employees'}`,
      }
    case 'adminClockOuts':
      return {
        type: 'bar' as const,
        name: 'Admin clock outs',
        pick: (d: TrendDay): number | null => d.adminClockOuts,
        format: (v: number) => `${v} ${v === 1 ? 'clock out' : 'clock outs'}`,
      }
    case 'workedHours':
      return {
        type: 'bar' as const,
        name: 'Hours worked',
        pick: (d: TrendDay): number | null => d.workedHours,
        format: (v: number) => `${v.toFixed(1)} h`,
      }
    default:
      return {
        type: 'line' as const,
        name: 'Activity rate',
        pick: (d: TrendDay): number | null => d.activityRate,
        format: (v: number) => `${v.toFixed(1)}%`,
      }
  }
})

const values = computed(() => props.days.map(config.value.pick))
const hasData = computed(() => values.value.some((v) => v !== null && v > 0))
const selectedIndex = computed(() =>
  props.days.findIndex((d) => d.date === props.selectedDate),
)

const series = computed(() => [
  { name: config.value.name, data: values.value },
])

const options = computed(() => {
  const c = colors.value
  const numeric = values.value.filter((v): v is number => v !== null)
  const max = Math.max(0, ...numeric)

  const common = {
    xaxis: {
      categories: props.days.map((d) => formatShortMonthDay(d.date)),
      // Con 14 categorías las etiquetas se pisan: se muestran ~7 (4 en móvil).
      tickAmount: smAndDown.value ? 4 : 7,
      labels: { rotate: 0, hideOverlappingLabels: true, trim: false },
    },
    legend: { show: false },
    tooltip: {
      // El eje muestra "10/12"; el tooltip, la fecha completa ("Mon 10/12").
      x: {
        formatter: (_: unknown, opts?: { dataPointIndex?: number }) =>
          formatShortDate(props.days[opts?.dataPointIndex ?? 0]?.date ?? ''),
      },
      y: { formatter: config.value.format },
    },
  }

  if (config.value.type === 'line') {
    return mergeOptions(baseOptions.value, {
      ...common,
      colors: [c.primary],
      stroke: { width: 2, curve: 'straight' },
      markers: {
        size: 3,
        colors: [c.primary],
        strokeColors: c.surface,
        strokeWidth: 2,
        discrete:
          selectedIndex.value >= 0
            ? [
                {
                  seriesIndex: 0,
                  dataPointIndex: selectedIndex.value,
                  fillColor: c.primary,
                  strokeColor: c.surface,
                  size: 6,
                },
              ]
            : [],
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: { formatter: (v: number) => `${Math.round(v)}%` },
      },
    })
  }

  // Columnas: la fecha elegida en azul, el resto en gris (énfasis).
  return mergeOptions(baseOptions.value, {
    ...common,
    colors: props.days.map((d) =>
      d.date === props.selectedDate ? c.primary : c.neutral,
    ),
    plotOptions: {
      bar: {
        distributed: true,
        columnWidth: '62%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
      },
    },
    yaxis:
      props.metric === 'employees' || props.metric === 'adminClockOuts'
        ? {
            ...integerAxis(max),
            labels: { formatter: (v: number) => String(Math.round(v)) },
          }
        : {
            min: 0,
            tickAmount: 4,
            labels: { formatter: (v: number) => String(roundTo(v, 1)) },
          },
  })
})
</script>
