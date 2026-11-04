/**
 * src/composables/useMyDay.ts
 *
 * Estado del día del propio usuario (primera entrada, último movimiento y si está en turno),
 * leído de sus registros NIO de hoy (día de Chicago, igual que el backend y el Activity Report).
 * No requiere ninguna vista: solo pide el `employee_number` del usuario autenticado.
 */
import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import { chicagoDate } from '@/utils/clockSession'
import { formatLocalTime } from '@/utils/localTime'
import type { ClockRecord } from '@/types/remoteClock'

export type MyDayState = 'in' | 'out' | 'none'

export function useMyDay (employeeNumber: Ref<string | undefined>, refreshMs = 60_000) {
  const records = ref<ClockRecord[]>([])
  const loaded = ref(false)
  const error = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  async function load (): Promise<void> {
    const emp = employeeNumber.value
    if (!emp) return
    const day = chicagoDate()
    try {
      const data = await NovaInOutServices.getRecordsByDateRange(emp, day, day)
      records.value = Array.isArray(data) ? data : []
      error.value = false
    } catch {
      error.value = true // se conserva lo último mostrado
    } finally {
      loaded.value = true
    }
  }

  onMounted(() => {
    void load()
    timer = setInterval(() => {
      if (!document.hidden) void load()
    }, refreshMs)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  /** Solo entradas/salidas, en orden cronológico. */
  const events = computed(() =>
    records.value
      .filter(r => ['CLOCK_IN', 'CLOCK_OUT'].includes(String(r.type_of_clock).toUpperCase()))
      .sort((a, b) => String(a.clock_time).localeCompare(String(b.clock_time))),
  )

  const state = computed<MyDayState>(() => {
    const last = events.value[events.value.length - 1]
    if (!last) return 'none'
    return String(last.type_of_clock).toUpperCase() === 'CLOCK_IN' ? 'in' : 'out'
  })

  const hhmm = (r: ClockRecord | undefined): string | null =>
    r ? formatLocalTime(r.clock_date, r.clock_time, { seconds: false, fallbackDate: chicagoDate() }) : null

  const firstIn = computed(() =>
    hhmm(events.value.find(r => String(r.type_of_clock).toUpperCase() === 'CLOCK_IN')),
  )
  const lastEvent = computed(() => hhmm(events.value[events.value.length - 1]))

  return { loaded, error, state, firstIn, lastEvent, reload: load }
}
