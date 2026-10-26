<!--
  src/components/AdminDashboard/charts/ArrivalsChart.vue

  Distribución de la hora de llegada (primer CLOCK_IN) en tramos de 30 min.
-->
<template>
  <ChartCard
    title="Arrival times"
    :info="chartHelp.arrivals"
    subtitle="First clock in, in 30-minute slots"
    :loading="loading"
    :empty="arrivals.length === 0"
    empty-title="No arrivals"
    empty-description="Nobody has clocked in on this date."
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
import {
  integerAxis,
  mergeOptions,
  useChartTheme,
} from '@/composables/useChartTheme'
import type { ArrivalBucket } from '@/types/attendanceDashboard'

const props = defineProps<{ arrivals: ArrivalBucket[]; loading?: boolean }>()

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 240 : 290))

const series = computed(() => [
  { name: 'Arrivals', data: props.arrivals.map((a) => a.count) },
])

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [colors.value.primary],
    plotOptions: {
      bar: {
        columnWidth: '58%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: { categories: props.arrivals.map((a) => a.label) },
    yaxis: {
      ...integerAxis(Math.max(0, ...props.arrivals.map((a) => a.count))),
      labels: { formatter: (value: number) => String(Math.round(value)) },
    },
    tooltip: {
      y: {
        formatter: (value: number) =>
          `${value} ${value === 1 ? 'arrival' : 'arrivals'}`,
      },
    },
    legend: { show: false },
  }),
)
</script>
