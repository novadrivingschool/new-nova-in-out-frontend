/**
 * src/composables/useAttendanceChart.ts
 *
 * Serie y configuración del gráfico de horas trabajadas.
 *
 * Los colores se leen del tema activo de Vuetify en lugar de estar escritos a
 * mano: la versión anterior fijaba `#00BFA5` y grises concretos, de modo que el
 * gráfico ignoraba el modo oscuro y no coincidía con el resto de la interfaz.
 */
import { computed, ref, type Ref } from 'vue'
import { useTheme } from 'vuetify'
import NovaInOutServices from '@/services/NovaInOutServices'
import type { ApexOptions } from 'apexcharts'

interface TotalHoursEntry {
  date: string
  totalHours: number
}

interface UseAttendanceChartReturn {
  loading: Ref<boolean>
  error: Ref<string | null>
  isEmpty: Ref<boolean>
  chartOptions: Ref<ApexOptions>
  chartSeries: Ref<Array<{ name: string; data: number[] }>>
  fetchChartData: (startDate?: string, endDate?: string) => Promise<void>
}

export function useAttendanceChart(): UseAttendanceChartReturn {
  const theme = useTheme()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const categories = ref<string[]>([])
  const maxY = ref(10)
  const chartSeries = ref([{ name: 'Total Hours', data: [] as number[] }])

  const isDark = computed(() => theme.global.name.value === 'dark')

  /** Colores del tema activo, en hexadecimal, que es lo que espera ApexCharts. */
  const palette = computed(() => {
    const colors = theme.current.value.colors
    return {
      primary: colors.primary,
      surface: colors.surface,
      onSurface: colors['on-surface'],
      onSurfaceVariant: colors['on-surface-variant'],
      border: String(theme.current.value.variables['border-color']),
    }
  })

  const isEmpty = computed(
    () => !loading.value && chartSeries.value[0].data.length === 0,
  )

  const chartOptions = computed<ApexOptions>(() => {
    const { primary, onSurface, onSurfaceVariant, border, surface } =
      palette.value

    return {
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        fontFamily: 'Inter, Roboto, sans-serif',
        animations: { enabled: true, speed: 400 },
      },
      theme: { mode: isDark.value ? 'dark' : 'light' },
      colors: [primary],
      stroke: { curve: 'straight', width: 3 },
      markers: {
        size: 4,
        colors: [primary],
        strokeColors: surface,
        strokeWidth: 2,
        hover: { size: 6 },
      },
      grid: {
        show: true,
        borderColor: border,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        categories: categories.value,
        labels: { style: { colors: onSurfaceVariant, fontSize: '11px' } },
        title: {
          text: 'Day of month',
          style: { color: onSurface, fontSize: '12px', fontWeight: 600 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickPlacement: 'on',
      },
      yaxis: {
        min: 0,
        max: maxY.value,
        tickAmount: 4,
        labels: {
          style: { colors: onSurfaceVariant, fontSize: '11px' },
          formatter: (value: number) => value.toFixed(1),
        },
        title: {
          text: 'Hours worked',
          style: { color: onSurface, fontSize: '12px', fontWeight: 600 },
        },
      },
      tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: { formatter: (value: number) => `${value.toFixed(2)} hrs` },
      },
      // ApexCharts no es responsive por sí solo con títulos de eje largos
      responsive: [
        {
          breakpoint: 600,
          options: {
            xaxis: { title: { text: undefined } },
            yaxis: { title: { text: undefined }, tickAmount: 3 },
            markers: { size: 0 },
          },
        },
      ],
    }
  })

  /** Rango por defecto: los últimos 30 días. */
  function defaultRange(): { start: string; end: string } {
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - 30)
    const format = (date: Date) => date.toISOString().split('T')[0]
    return { start: format(past), end: format(today) }
  }

  async function fetchChartData(
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    loading.value = true
    error.value = null

    const fallback = defaultRange()
    const start = startDate || fallback.start
    const end = endDate || fallback.end

    try {
      const result: TotalHoursEntry[] = await NovaInOutServices.getTotalHours(
        start,
        end,
      )

      const entries = Array.isArray(result) ? result : []
      const hours = entries.map((entry) => Number(entry.totalHours) || 0)

      categories.value = entries.map((entry) => entry.date.split('-')[2])
      // `Math.max` sobre un array vacío devuelve -Infinity: el 10 lo evita.
      maxY.value = Math.ceil(Math.max(...hours, 10) * 1.1)
      chartSeries.value = [{ name: 'Total Hours', data: hours }]
    } catch (err) {
      console.error('Error fetching chart data:', err)
      error.value = 'Could not load the hours chart.'
      categories.value = []
      chartSeries.value = [{ name: 'Total Hours', data: [] }]
    } finally {
      loading.value = false
    }
  }

  return { loading, error, isEmpty, chartOptions, chartSeries, fetchChartData }
}
