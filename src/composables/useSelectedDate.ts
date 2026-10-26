/**
 * src/composables/useSelectedDate.ts
 *
 * Fecha seleccionada en el admin dashboard. La fuente de verdad es el query
 * param `?date=YYYY-MM-DD` de la ruta, de modo que:
 *  - sin parámetro, la fecha es hoy;
 *  - la selección sobrevive a un refresh y se puede compartir como enlace;
 *  - las pantallas de detalle (clocked-in-now, etc.) leen la misma fecha.
 *
 * Un valor inválido o futuro se ignora y cae a hoy.
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { formatDateString, parseDateString } from '@/utils/dateString'

const DASHBOARD_PATH = '/admin-dashboard'

export function useSelectedDate() {
  const route = useRoute()

  // Se guarda como ref para poder refrescarlo si la pestaña pasa la medianoche.
  const today = ref(formatDateString(new Date()))

  /** Actualiza "hoy"; el dashboard lo llama en cada ciclo de refresco. */
  function syncToday(): void {
    today.value = formatDateString(new Date())
  }

  const date = computed(() => {
    const raw = route.query.date
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value || !parseDateString(value)) return today.value
    // Las cadenas ISO se comparan bien lexicográficamente.
    return value > today.value ? today.value : value
  })

  const isToday = computed(() => date.value === today.value)

  const label = computed(() => {
    const parsed = parseDateString(date.value)
    return parsed
      ? parsed.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : date.value
  })

  /** Ruta de vuelta al dashboard conservando la fecha elegida. */
  const dashboardLink = computed(() =>
    isToday.value ? DASHBOARD_PATH : `${DASHBOARD_PATH}?date=${date.value}`,
  )

  return { date, isToday, label, today, dashboardLink, syncToday }
}
