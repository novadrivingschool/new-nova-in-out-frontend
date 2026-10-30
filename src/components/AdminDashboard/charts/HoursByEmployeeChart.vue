<!--
  src/components/AdminDashboard/charts/HoursByEmployeeChart.vue

  Ranking de horas trabajadas por empleado. Barras horizontales (los nombres
  son largos) en un solo color: la longitud ya ordena, no hace falta una
  paleta por empleado.
-->
<template>
  <ChartCard
    title="Hours by employee"
    :info="chartHelp.hoursByEmployee"
    subtitle="Worked hours on the selected date, highest first"
    :loading="loading"
    :empty="rows.length === 0"
    empty-title="No hours recorded"
    empty-description="Nobody has worked a shift on this date."
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
import apexchart from '@/components/common/ApexChart.vue'
import ChartCard from './ChartCard.vue'
import { chartHelp } from '../dashboardHelp'
import { mergeOptions, useChartTheme } from '@/composables/useChartTheme'
import { roundTo } from '@/utils/chartFormat'

const props = defineProps<{
  rows: Array<{ employee_number: string; fullName: string; workedHours: number }>
  loading?: boolean
}>()

const { baseOptions, colors } = useChartTheme()

/** Alto proporcional al nº de barras para que no se aplasten ni se estiren. */
const height = computed(() => Math.max(220, props.rows.length * 34 + 70))

const series = computed(() => [
  { name: 'Hours worked', data: props.rows.map((r) => r.workedHours) },
])

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [colors.value.primary],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        barHeight: '62%',
      },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: props.rows.map((r) => r.fullName),
      labels: {
        formatter: (value: string) => `${roundTo(Number(value), 1)} h`,
      },
    },
    yaxis: { labels: { maxWidth: 150 } },
    tooltip: {
      y: { formatter: (value: number) => `${value.toFixed(2)} h` },
    },
    legend: { show: false },
  }),
)
</script>
