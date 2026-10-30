<!--
  src/components/AdminDashboard/charts/AttendanceStatusDonut.vue

  Parte-del-todo de la plantilla: en turno / ya salió / no fichó. Tres
  segmentos (el máximo cómodo para una dona) con la cifra en la leyenda, de
  modo que el aqua en modo claro no dependa solo del color.
-->
<template>
  <ChartCard
    title="Attendance status"
    :info="chartHelp.status"
    subtitle="Where the team is right now"
    :loading="loading"
    :empty="total === 0"
    empty-title="No employees"
    empty-description="There are no active employees to report on."
  >
    <apexchart
      type="donut"
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
import { mergeOptions, useChartTheme } from '@/composables/useChartTheme'

const props = defineProps<{
  status: { onClock: number; left: number; absent: number } | null
  loading?: boolean
}>()

const { baseOptions, colors } = useChartTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 280 : 300))

const series = computed(() => [
  props.status?.onClock ?? 0,
  props.status?.left ?? 0,
  props.status?.absent ?? 0,
])
const total = computed(() => series.value.reduce((a, b) => a + b, 0))

const options = computed(() =>
  mergeOptions(baseOptions.value, {
    labels: ['On the clock', 'Clocked out', 'Not clocked in'],
    colors: [colors.value.primary, colors.value.secondary, colors.value.neutral],
    // Separación de 2px entre segmentos con el color de la superficie.
    stroke: { width: 2, colors: [colors.value.surface] },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { show: true, color: colors.value.inkSoft, fontSize: '12px' },
            value: {
              show: true,
              color: colors.value.ink,
              fontSize: '28px',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Employees',
              color: colors.value.inkSoft,
              formatter: () => String(total.value),
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      formatter: (name: string, opts: { seriesIndex: number }) =>
        `${name} · ${series.value[opts.seriesIndex]}`,
    },
    tooltip: {
      y: {
        formatter: (value: number) =>
          `${value} ${value === 1 ? 'employee' : 'employees'}`,
      },
    },
  }),
)
</script>
