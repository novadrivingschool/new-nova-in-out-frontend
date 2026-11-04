/**
 * ACTIVITY (multitask): varias actividades abiertas a la vez, solo registro del Activity Report
 * (no afecta horas ni performance). Mismos límites que el backend: se validan aquí para avisar antes.
 */
import { hhmmssToSeconds } from '@/utils/clockSession'
import type { ActivityEvent } from '@/types/remoteClock'

export const ACTIVITY_TITLE_MIN = 5
export const ACTIVITY_TITLE_MAX = 150
export const ACTIVITY_NOTES_MIN = 20
export const ACTIVITY_NOTES_MAX = 2000
export const ACTIVITY_MAX_OPEN = 5
/** Notas que pone el sistema al cerrar solo una actividad (force clock out, logout, cierre de respaldo). */
export const ACTIVITY_AUTO_CLOSED_NOTES = 'Closed automatically'

export const isOpenEvent = (e: ActivityEvent): boolean => String(e.end_time ?? '').startsWith('00:00:00')

/** Regla de Vuetify para el título (obligatorio, trim, mín/máx). */
export function titleRule(v: string): true | string {
  const n = (v ?? '').trim().length
  if (n === 0) return 'Title is required'
  if (n < ACTIVITY_TITLE_MIN) return `At least ${ACTIVITY_TITLE_MIN} characters (${n}/${ACTIVITY_TITLE_MIN})`
  if (n > ACTIVITY_TITLE_MAX) return `Max ${ACTIVITY_TITLE_MAX} characters`
  return true
}

/** Regla de Vuetify para las notas (obligatorias, trim, mín/máx). */
export function notesRule(v: string): true | string {
  const n = (v ?? '').trim().length
  if (n === 0) return 'Notes are required'
  if (n < ACTIVITY_NOTES_MIN) return `At least ${ACTIVITY_NOTES_MIN} characters (${n}/${ACTIVITY_NOTES_MIN})`
  if (n > ACTIVITY_NOTES_MAX) return `Max ${ACTIVITY_NOTES_MAX} characters`
  return true
}

/**
 * Segundos de la ventana [startSec, endSec] que se solapan con filas BIO BREAK / BRB del día (abiertas o
 * cerradas; la abierta cuenta hasta `nowSec`). Una actividad no cuenta ese tramo: su cronómetro se pausa
 * durante el break y retoma donde iba (mismo criterio que Vout).
 */
export function pausedSecondsDuring(
  events: ActivityEvent[],
  startSec: number,
  endSec: number,
  nowSec: number,
): number {
  if (endSec <= startSec) return 0
  let total = 0
  for (const r of events) {
    if (r.type_of_activity !== 'BIO BREAK' && r.type_of_activity !== 'BRB') continue
    const bStart = hhmmssToSeconds(r.start_time)
    const bEnd = isOpenEvent(r) ? nowSec : hhmmssToSeconds(r.end_time)
    const overlap = Math.min(endSec, bEnd) - Math.max(startSec, bStart)
    if (overlap > 0) total += overlap
  }
  return total
}

/** Segundos netos de una actividad: cerrada = su `total_time` guardado; abierta = hasta ahora menos los breaks. */
export function activityNetSeconds(e: ActivityEvent, events: ActivityEvent[], nowSec: number): number {
  if (!isOpenEvent(e)) return hhmmssToSeconds(e.total_time)
  const start = hhmmssToSeconds(e.start_time)
  return Math.max(0, nowSec - start - pausedSecondsDuring(events, start, nowSec, nowSec))
}
