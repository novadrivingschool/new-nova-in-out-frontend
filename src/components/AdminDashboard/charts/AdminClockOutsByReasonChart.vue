<!--
  src/components/AdminDashboard/charts/AdminClockOutsByReasonChart.vue

  Clock outs hechos por un admin en el día, por motivo (barras horizontales:
  los nombres de motivo son largos y pocos, así se leen sin rotar etiquetas).
-->
<template>
  <ChartCard
    title="Admin clock outs"
    :info="info ?? chartHelp.adminClockOutsByReason"
    subtitle="Shifts closed by an administrator, by reason"
    :loading="loading"
    :empty="rows.length === 0"
    empty-title="No admin clock outs"
    :empty-description="emptyDescription ?? 'No shift was closed by an administrator on this date.'"
  >
    <apexchart type="bar" :height="height" :options="options" :series="series" />
  </ChartCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import ChartCard from './ChartCard.vue'
import { chartHelp } from '../dashboardHelp'
import { useResponsive } from '@/composables/useResponsive'
import { integerAxis, mergeOptions, useChartTheme } from '@/composables/useChartTheme'
import { FORCE_CLOCK_OUT_REASON_LABEL, type ForceClockOutReason } from '@/types/adminClockOut'
import type { AdminReasonCount } from '@/types/attendanceDashboard'

const props = defineProps<{
  rows: AdminReasonCount[]
  loading?: boolean
  /** Tooltip "i" alterno (p. ej. cuando el periodo es un rango y no un día). */
  info?: string
  emptyDescription?: string
}>()

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 240 : 290))

const labelOf = (reason: string): string =>
  FORCE_CLOCK_OUT_REASON_LABEL[reason as ForceClockOutReason] ?? 'Unknown'

const series = computed(() => [
  { name: 'Clock outs', data: props.rows.map((r) => r.count) },
])

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [colors.value.primary],
    plotOptions: {
      bar: { horizontal: true, barHeight: '58%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    xaxis: {
      categories: props.rows.map((r) => labelOf(r.reason)),
      ...integerAxis(Math.max(0, ...props.rows.map((r) => r.count))),
      labels: { formatter: (value: string) => String(Math.round(Number(value))) },
    },
    dataLabels: { enabled: true },
    tooltip: {
      y: { formatter: (value: number) => `${value} ${value === 1 ? 'clock out' : 'clock outs'}` },
    },
    legend: { show: false },
  }),
)
</script>
