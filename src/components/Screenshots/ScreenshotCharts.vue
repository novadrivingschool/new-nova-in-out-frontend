<!--
  src/components/Screenshots/ScreenshotCharts.vue

  Gráficas del rango buscado:
  - Rendimiento por hora del día (sólo capturas con conexión).
  - Estado de las capturas (activa, inactiva, sin internet, offline…).
  - Horas trabajadas vs activas por día (sólo si el rango abarca varios días).

  Reutiliza ChartCard y useChartTheme del dashboard para que se vean y se
  comporten igual (tema claro/oscuro incluido).
-->
<template>
  <div class="app-autogrid charts" style="--app-autogrid-min: 22rem">
    <ChartCard
      v-if="!multiDay"
      class="charts__wide"
      key="activity-during-the-day"
      title="Activity during the day"
      subtitle="Rendimiento de cada captura"
      info="Cada barra es una captura del día, coloreada según su rendimiento. Las barras moradas y negras son capturas sin conexión (sin internet / offline): la app sí mide la actividad aunque no haya red, y se envía al reconectar. Una línea punteada vertical marca una captura con 0% de actividad, del color de su estado (rojo si sí había conexión)."
      :empty="!stats.timeline.length"
      empty-title="No captures"
      empty-description="No hay capturas en este día."
    >
      <apexchart
        type="bar"
        :height="height"
        :key="'timeline'"
        :options="timelineOptions"
        :series="timelineSeries"
      />
      <ul class="charts__legend" aria-label="Significado de los colores">
        <li v-for="item in tierLegend" :key="item.label">
          <span class="dot" :style="{ background: item.color }" /> {{ item.label }}
        </li>
        <li v-for="item in connectionLegend" :key="item.label">
          <span class="dot" :style="{ background: item.color }" />
          {{ item.label }}
        </li>
      </ul>
    </ChartCard>

    <template v-if="multiDay">
      <ChartCard
        key="performance-per-day"
        title="Performance per day"
        subtitle="Todas las capturas del día"
        info="Tiempo activo sobre tiempo capturable de cada día, con el color de su tramo de rendimiento."
        :empty="!stats.days.length"
        empty-title="No activity"
        empty-description="No hay actividad en este rango."
      >
        <apexchart
          type="bar"
          :height="height"
          :key="'perfDay'"
          :options="perfDayOptions"
          :series="perfDaySeries"
        />
        <ul class="charts__legend" aria-label="Significado de los colores">
          <li v-for="item in tierLegend" :key="item.label">
            <span class="dot" :style="{ background: item.color }" /> {{ item.label }}
          </li>
        </ul>
      </ChartCard>

      <ChartCard
        key="clock-in-out-times"
        title="Clock in / out times"
        subtitle="Primera entrada y última salida de cada día"
        info="A qué hora empezó y terminó la jornada cada día. Sirve para ver la puntualidad y la constancia del horario."
        :empty="!hasClockTimes"
        empty-title="No clock times"
        empty-description="No hay entradas y salidas completas en este rango."
      >
        <apexchart
          type="line"
          :height="height"
          :key="'clock'"
          :options="clockOptions"
          :series="clockSeries"
        />
      </ChartCard>

      <ChartCard
        key="connection-per-day"
        title="Connection per day"
        subtitle="Capturas con y sin conexión"
        info="Capturas que se guardaron sin conexión (sin internet u offline). Si no hubo red, la actividad se mide igual y se envía al reconectar; offline (app cerrada o equipo apagado) no tiene actividad medida."
        :empty="!stats.days.length"
        empty-title="No activity"
        empty-description="No hay actividad en este rango."
      >
        <apexchart
          type="bar"
          :height="height"
          :key="'connection'"
          :options="connectionOptions"
          :series="connectionSeries"
        />
      </ChartCard>
    </template>

    <ChartCard
      key="performance-by-hour"
      title="Performance by hour"
      subtitle="Actividad promedio por hora del día"
      info="Tiempo activo sobre tiempo capturable en cada hora, contando solo capturas con conexión. Muestra cuándo la persona está más y menos activa."
      :empty="!stats.hours.length"
      empty-title="No captures"
      empty-description="No hay capturas con conexión en este rango."
    >
      <apexchart
        type="bar"
        :height="height"
        :key="'hour'"
        :options="hourOptions"
        :series="hourSeries"
      />
      <ul class="charts__legend" aria-label="Significado de los colores">
        <li v-for="item in tierLegend" :key="item.label">
          <span class="dot" :style="{ background: item.color }" /> {{ item.label }}
        </li>
      </ul>
    </ChartCard>

    <ChartCard
      key="capture-status"
      title="Capture status"
      subtitle="Cómo se registraron las capturas"
      info="Sin internet: la app sigue midiendo la actividad y la envía al reconectar; si fue de 0%, no entra al performance. Offline (app cerrada o equipo apagado) no tiene actividad medida y cuenta como 0%."
      :empty="!stats.coverage.byStatus.length"
      empty-title="No captures"
      empty-description="No hay capturas en este rango."
    >
      <apexchart
        type="donut"
        :height="height"
        :key="'status'"
        :options="statusOptions"
        :series="statusSeries"
      />
    </ChartCard>

    <ChartCard
      key="performance-distribution"
      title="Performance distribution"
      subtitle="Capturas con conexión por tramo de rendimiento"
      info="Cuántas capturas cayeron en cada tramo: 0–24%, 25–49%, 50–74% y 75–100%. Un buen día concentra capturas en los tramos altos."
      :empty="!distributionTotal"
      empty-title="No captures"
      empty-description="No hay capturas con conexión en este rango."
    >
      <apexchart
        type="donut"
        :height="height"
        :key="'distribution'"
        :options="distributionOptions"
        :series="distributionSeries"
      />
    </ChartCard>

    <ChartCard
      v-if="multiDay"
      key="worked-vs-active-hours"
      title="Worked vs active hours"
      subtitle="Por día"
      info="Horas entre clock in y clock out, junto a las horas con actividad real de teclado y mouse."
      :empty="!stats.days.length"
      empty-title="No activity"
      empty-description="No hay actividad en este rango."
    >
      <apexchart
        type="bar"
        :height="height"
        :key="'daily'"
        :options="dailyOptions"
        :series="dailySeries"
      />
    </ChartCard>

    <AdminClockOutsByReasonChart
      :rows="stats.adminClockOutsByReason ?? []"
      info="Sesiones del rango cuyo clock out hizo un administrador, agrupadas por el motivo que eligió: No internet, Power outage, Emergency exit, Abandoned equipment o Illness. Esas sesiones sí cuentan sus horas hasta el cierre."
      empty-description="Ninguna sesión de este rango fue cerrada por un administrador."
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import AdminClockOutsByReasonChart from '@/components/AdminDashboard/charts/AdminClockOutsByReasonChart.vue'
import { useTheme } from 'vuetify'
import ChartCard from '@/components/AdminDashboard/charts/ChartCard.vue'
import { useResponsive } from '@/composables/useResponsive'
import { mergeOptions, useChartTheme } from '@/composables/useChartTheme'
import { formatHour, formatShortDate, roundTo } from '@/utils/chartFormat'
import { statusLabel } from './screenshotFormat'
import type { ScreenshotStats } from './screenshotStats'

const props = defineProps<{ stats: ScreenshotStats; multiDay?: boolean }>()

const { baseOptions, colors } = useChartTheme()
const theme = useTheme()
const { smAndDown } = useResponsive()
const height = computed(() => (smAndDown.value ? 260 : 300))

/** Color de un token del tema (`perf-low`, `success`…), siguiendo el tema activo. */
function token(name: string): string {
  return String(theme.current.value.colors[name] ?? colors.value.primary)
}

/** Mismos cuatro tramos que la barra de cada captura. */
function tierColor(percentage: number): string {
  if (percentage < 25) return token('perf-low')
  if (percentage < 50) return token('perf-fair')
  if (percentage < 75) return token('perf-good')
  return token('perf-high')
}

// ── Rendimiento por hora ────────────────────────────────────
const hourSeries = computed(() => [
  { name: 'Performance', data: props.stats.hours.map((h) => h.performance) },
])

const hourOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    // Cada barra toma el color de su tramo.
    colors: [({ value }: { value: number }) => tierColor(value)],
    legend: { show: false },
    plotOptions: {
      bar: {
        columnWidth: '62%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      categories: props.stats.hours.map((h) => formatHour(h.hour)),
      tickAmount: smAndDown.value ? 5 : undefined,
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { formatter: (value: number) => `${Math.round(value)}%` },
    },
    tooltip: {
      y: {
        formatter: (value: number, opts?: { dataPointIndex: number }) => {
          const captures = props.stats.hours[opts?.dataPointIndex ?? 0]?.captures
          return captures ? `${value}% · ${captures} capturas` : `${value}%`
        },
      },
    },
  }),
)

// ── Estado de las capturas ──────────────────────────────────
const STATUS_TOKENS: Record<string, string> = {
  ACTIVE: 'perf-high',
  INACTIVE: 'secondary',
}

const statusSeries = computed(() => props.stats.coverage.byStatus.map((s) => s.count))

const statusOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    labels: props.stats.coverage.byStatus.map((s) => s.label),
    colors: props.stats.coverage.byStatus.map(
      (s) => STATUS_COLORS[s.status] ?? token(STATUS_TOKENS[s.status] ?? 'accent'),
    ),
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
              label: 'Captures',
              color: colors.value.inkSoft,
              formatter: () => String(props.stats.captures),
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      formatter: (name: string, opts: { seriesIndex: number }) =>
        `${name} · ${statusSeries.value[opts.seriesIndex]}`,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} ${value === 1 ? 'captura' : 'capturas'}`,
      },
    },
  }),
)

// ── Trabajadas vs activas por día ───────────────────────────
/** Cronológico (los datos vienen del más reciente al más antiguo). */
const daysAsc = computed(() => [...props.stats.days].reverse())

const dailySeries = computed(() => [
  {
    name: 'Worked',
    data: daysAsc.value.map((d) => roundTo(d.totalSeconds / 3600, 2)),
  },
  {
    name: 'Active',
    data: daysAsc.value.map((d) => roundTo(d.activeSeconds / 3600, 2)),
  },
])

const dailyOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [colors.value.neutral, colors.value.primary],
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
      },
    },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: daysAsc.value.map((d) => formatShortDate(d.date)),
      tickAmount: smAndDown.value ? 4 : undefined,
    },
    yaxis: {
      min: 0,
      labels: { formatter: (value: number) => `${roundTo(value, 1)}h` },
      title: {
        text: 'Hours',
        style: {
          color: colors.value.inkSoft,
          fontSize: '11px',
          fontWeight: 500,
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (value: number) => `${value.toFixed(2)} h` },
    },
  }),
)

// ── Actividad durante el día (un solo día) ─────────────────
/** Sin internet y offline tienen color propio, distinto de los tramos de rendimiento. */
const STATUS_COLORS: Record<string, string> = {
  NO_INTERNET: '#9d00ff',
  API_DOWN: '#0ea5e9',
  OFFLINE: '#000000',
  DISCONNECTED_WIFI: '#ec4899',
  DISCONNECTED_ETHERNET: '#92400e',
  RESTARTED: '#64748b',
}

const statusName = statusLabel

/** Color de un estado sin conexión (gris si es un estado desconocido). */
const statusColorOf = (status: string): string => STATUS_COLORS[status] ?? '#6b7280'

/** Leyenda de los tramos de rendimiento (mismos cortes y colores que las barras). */
const tierLegend = computed(() => [
  { label: 'Crítico · 0–24%', color: token('perf-low') },
  { label: 'Malo · 25–49%', color: token('perf-fair') },
  { label: 'Regular · 50–74%', color: token('perf-good') },
  { label: 'Bueno / Excelente · 75–100%', color: token('perf-high') },
])

/** Estados sin conexión que aparecen en el día; cada línea o barra respeta su tipo y color. */
const connectionLegend = computed(() => {
  const seen = new Set<string>()
  for (const point of props.stats.timeline) if (!point.connected) seen.add(point.status)
  return [...seen].map((status) => ({ label: statusName(status), color: statusColorOf(status) }))
})

const timelineSeries = computed(() => [
  {
    name: 'Performance',
    data: props.stats.timeline.map((p) => p.performance),
  },
])

/** Color de una captura con 0%: el de su estado si no hubo conexión, rojo si sí la hubo. */
function zeroColor(point: { connected: boolean; status: string }): string {
  if (point.connected) return token('perf-low')
  return statusColorOf(point.status)
}

/** Línea punteada vertical en cada captura con 0% de actividad (su barra no se vería). */
const zeroLines = computed(() =>
  props.stats.timeline
    .filter((p) => p.performance === 0)
    .map((p) => ({
      x: p.time,
      borderColor: zeroColor(p),
      borderWidth: 2,
      strokeDashArray: 4,
      opacity: 1,
    })),
)

/** Color de la barra (y del punto del tooltip) de cada captura: su estado o su tramo. */
function timelinePointColor(index: number): string {
  const point = props.stats.timeline[index]
  if (!point) return token('on-surface-variant')
  if (point.connected) return tierColor(point.performance)
  return statusColorOf(point.status)
}

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Texto del tooltip: porcentaje y, si aplica, estado sin conexión y falta de actividad. */
function timelineTooltipText(index: number): string {
  const point = props.stats.timeline[index]
  if (!point) return ''
  const notes: string[] = []
  if (!point.connected) notes.push(statusName(point.status))
  if (point.performance === 0) notes.push('sin actividad')
  return notes.length ? `${point.performance}% · ${notes.join(' · ')}` : `${point.performance}%`
}

const timelineOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    annotations: { xaxis: zeroLines.value },
    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) => timelinePointColor(dataPointIndex),
    ],
    legend: { show: false },
    plotOptions: {
      bar: {
        columnWidth: '70%',
        borderRadius: 2,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      categories: props.stats.timeline.map((p) => p.time),
      tickAmount: smAndDown.value ? 5 : 12,
      labels: { rotate: 0, hideOverlappingLabels: true },
      // Guía vertical que sigue al puntero, junto con el tooltip.
      crosshairs: { show: true, stroke: { color: colors.value.neutral, width: 1, dashArray: 0 } },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { formatter: (value: number) => `${Math.round(value)}%` },
    },
    // `intersect: false` hace que el tooltip salga al pasar por la columna de cada captura,
    // aunque su barra mida 0 (solo se ve la línea punteada). El tooltip es propio para que el
    // punto de color sea el de esa captura y no el de la serie.
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const point = props.stats.timeline[dataPointIndex]
        if (!point) return ''
        return (
          `<div class="apexcharts-tooltip-title">${escapeHtml(point.time)}</div>` +
          '<div class="apexcharts-tooltip-series-group apexcharts-active" style="display: flex">' +
          `<span class="apexcharts-tooltip-marker" style="background-color: ${timelinePointColor(dataPointIndex)}"></span>` +
          '<div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group">' +
          '<span class="apexcharts-tooltip-text-y-label">Performance: </span>' +
          `<span class="apexcharts-tooltip-text-y-value">${escapeHtml(timelineTooltipText(dataPointIndex))}</span>` +
          '</div></div></div>'
        )
      },
    },
  }),
)

// ── Distribución del rendimiento ────────────────────────────
const TIER_KEYS = ['low', 'fair', 'good', 'high'] as const
const TIER_LABELS = ['0–24%', '25–49%', '50–74%', '75–100%']
const TIER_TOKENS = ['perf-low', 'perf-fair', 'perf-good', 'perf-high']

const distributionSeries = computed(() => TIER_KEYS.map((key) => props.stats.distribution[key]))
const distributionTotal = computed(() => distributionSeries.value.reduce((sum, n) => sum + n, 0))

const distributionOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    labels: TIER_LABELS,
    colors: TIER_TOKENS.map(token),
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
              label: 'Connected',
              color: colors.value.inkSoft,
              formatter: () => String(distributionTotal.value),
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      formatter: (name: string, opts: { seriesIndex: number }) =>
        `${name} · ${distributionSeries.value[opts.seriesIndex]}`,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} ${value === 1 ? 'captura' : 'capturas'}`,
      },
    },
  }),
)

// ── Rendimiento por día ─────────────────────────────────────
const perfDaySeries = computed(() => [
  { name: 'Performance', data: daysAsc.value.map((d) => d.performance ?? 0) },
])

const perfDayOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) => {
        const value = daysAsc.value[dataPointIndex]?.performance
        return value == null ? token('on-surface-variant') : tierColor(value)
      },
    ],
    legend: { show: false },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      categories: daysAsc.value.map((d) => formatShortDate(d.date)),
      tickAmount: smAndDown.value ? 4 : undefined,
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { formatter: (value: number) => `${Math.round(value)}%` },
    },
    tooltip: { y: { formatter: (value: number) => `${value}%` } },
  }),
)

// ── Horas de entrada y salida ───────────────────────────────
const timeToHours = (time: string | null): number | null => {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  return roundTo(h + m / 60, 2)
}

const hoursToTime = (value: number): string => {
  const total = Math.round(value * 60)
  const h = Math.floor(total / 60) % 24
  return `${String(h).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const hasClockTimes = computed(() => daysAsc.value.some((d) => d.firstClockIn || d.lastClockOut))

const clockSeries = computed(() => [
  {
    name: 'First clock in',
    data: daysAsc.value.map((d) => timeToHours(d.firstClockIn)),
  },
  {
    name: 'Last clock out',
    data: daysAsc.value.map((d) => timeToHours(d.lastClockOut)),
  },
])

const clockOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [colors.value.primary, token('perf-low')],
    stroke: { width: 3, curve: 'straight' },
    markers: { size: 4 },
    xaxis: {
      categories: daysAsc.value.map((d) => formatShortDate(d.date)),
      tickAmount: smAndDown.value ? 4 : undefined,
    },
    yaxis: {
      labels: { formatter: (value: number) => hoursToTime(value) },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number | null) => (value == null ? '—' : hoursToTime(value)),
      },
    },
  }),
)

// ── Conexión por día ────────────────────────────────────────
const connectionSeries = computed(() => [
  {
    name: 'With connection',
    data: daysAsc.value.map((d) => d.captures - d.withoutConnection),
  },
  {
    name: 'Without connection',
    data: daysAsc.value.map((d) => d.withoutConnection),
  },
])

const connectionOptions = computed(() =>
  mergeOptions(baseOptions.value, {
    colors: [token('perf-high'), token('perf-fair')],
    chart: { stacked: true },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
    xaxis: {
      categories: daysAsc.value.map((d) => formatShortDate(d.date)),
      tickAmount: smAndDown.value ? 4 : undefined,
    },
    yaxis: {
      min: 0,
      labels: { formatter: (value: number) => String(Math.round(value)) },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${value} ${value === 1 ? 'captura' : 'capturas'}`,
      },
    },
  }),
)
</script>

<style scoped>
/* La gráfica del día ocupa todo el ancho de la fila. */
.charts__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--app-space-2) var(--app-space-4);
  margin: var(--app-space-2) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.charts__legend .dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  margin-inline-end: 0.35rem;
  border-radius: 50%;
}

.charts__wide {
  grid-column: 1 / -1;
}
</style>
