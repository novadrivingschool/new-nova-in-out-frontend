/**
 * src/composables/useHomeSnapshot.ts
 *
 * Resumen en vivo de asistencia para la Home. Solo consulta si `enabled`
 * (el endpoint exige la vista `admin-dashboard`); un fallo no rompe la página:
 * deja un mensaje y conserva los últimos datos buenos.
 */
import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import type { AttendanceDashboard } from '@/types/attendanceDashboard'

export function useHomeSnapshot (enabled: Ref<boolean>, refreshMs = 60_000) {
  const data = ref<AttendanceDashboard | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  async function load (): Promise<void> {
    if (!enabled.value || inFlight) return
    inFlight = true
    loading.value = true
    try {
      data.value = await NovaInOutServices.getDashboard()
      lastUpdated.value = new Date()
      error.value = null
    } catch (err) {
      error.value = err instanceof Error && err.message ? err.message : 'Could not load attendance.'
    } finally {
      loading.value = false
      inFlight = false
    }
  }

  onMounted(() => {
    void load()
    timer = setInterval(() => {
      // No gastar peticiones con la pestaña oculta.
      if (!document.hidden) void load()
    }, refreshMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { data, loading, error, lastUpdated, reload: load }
}
