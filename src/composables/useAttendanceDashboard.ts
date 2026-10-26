/**
 * src/composables/useAttendanceDashboard.ts
 *
 * Estado y carga del admin dashboard para UNA fecha.
 *
 * - Pide en paralelo el dashboard del día y la tendencia que termina en ese
 *   día. Si falla la tendencia, el resto se sigue mostrando.
 * - Al cambiar la fecha limpia los datos (para mostrar el estado de carga y
 *   no números de otro día); en el refresco automático conserva los datos
 *   anteriores hasta que llegan los nuevos, para que no parpadee.
 * - Descarta respuestas obsoletas si el usuario cambia de fecha rápido.
 * - Refresca cada `refreshMs` solo mientras se ve el día de hoy.
 */
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import type {
  AttendanceDashboard,
  AttendanceTrend,
} from '@/types/attendanceDashboard'

interface Options {
  isToday: Ref<boolean>
  /** Se invoca en cada ciclo de refresco (p. ej. para actualizar "hoy"). */
  onTick?: () => void
  refreshMs?: number
  trendDays?: number
}

const errorReason = (err: unknown): string =>
  err instanceof Error && err.message ? ` (${err.message})` : ''

export function useAttendanceDashboard(date: Ref<string>, options: Options) {
  const { isToday, onTick, refreshMs = 30_000, trendDays = 14 } = options

  const data = ref<AttendanceDashboard | null>(null)
  const trend = ref<AttendanceTrend | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const trendError = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  let requestId = 0
  let timer: ReturnType<typeof setInterval> | null = null

  async function load(silent = false): Promise<void> {
    const currentId = ++requestId
    const target = date.value

    loading.value = true
    error.value = null
    trendError.value = null
    if (!silent) {
      data.value = null
      trend.value = null
    }

    const [dashboard, trendResult] = await Promise.allSettled([
      NovaInOutServices.getDashboard(target),
      NovaInOutServices.getDashboardTrend(target, trendDays),
    ])

    if (currentId !== requestId) return // llegó una consulta más reciente

    if (dashboard.status === 'fulfilled') {
      data.value = dashboard.value
      lastUpdated.value = new Date()
    } else {
      console.error('Error loading dashboard', dashboard.reason)
      error.value = `Could not load the dashboard${errorReason(dashboard.reason)}.`
    }

    if (trendResult.status === 'fulfilled') {
      trend.value = trendResult.value
    } else {
      console.error('Error loading trend', trendResult.reason)
      trendError.value = `Could not load the trend${errorReason(trendResult.reason)}.`
    }

    loading.value = false
  }

  watch(date, () => load(false))

  onMounted(() => {
    load(false)
    timer = setInterval(() => {
      onTick?.()
      if (isToday.value) load(true)
    }, refreshMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    data,
    trend,
    loading,
    error,
    trendError,
    lastUpdated,
    reload: () => load(true),
  }
}
