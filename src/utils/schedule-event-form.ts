// src/utils/schedule-event-form.ts
// Estado, validación y textos del formulario de eventos del Master Schedule.
// Funciones puras: las usan ScheduleEventDialog y sus subcomponentes ScheduleEvent*.
import type {
  ScheduleEventPayload,
  ScheduleEventStatus,
  ScheduleEventType,
} from '@/types/schedule-events'
import { daysBetweenIso, formatDate, formatShortDate, todayIso } from '@/utils/schedule'
import { EVENT_META, toMinutes } from '@/utils/schedule-events'

export type DialogType = ScheduleEventType | 'work_shift'

export const MAX_EVENT_DAYS = 366
export const MAX_REASON_LENGTH = 500

export interface EventFormState {
  userId: string
  type: DialogType
  startDate: string
  endDate: string
  /** Solo se consulta en time_off / absence; los demás tipos lo fijan por regla. */
  wholeDay: boolean
  startTime: string
  endTime: string
  status: ScheduleEventStatus
  justified: boolean
  reason: string
}

export type EventFormField =
  | 'userId'
  | 'startDate'
  | 'endDate'
  | 'startTime'
  | 'endTime'
  | 'reason'

export type EventFormErrors = Partial<Record<EventFormField, string>>

/** Orden en pantalla: sirve para enfocar el primer campo con error. */
export const FIELD_ORDER: EventFormField[] = [
  'userId',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'reason',
]

/** Lo mínimo de un evento existente para rellenar el formulario. */
export interface EventFormSource {
  type: ScheduleEventType
  status: ScheduleEventStatus
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  justified: boolean | null
  reason: string | null
}

export const TYPE_DESCRIPTIONS: Record<DialogType, string> = {
  work_shift: 'Regular hours and lunch: a weekly fixed shift or a variable one for a period.',
  vacation: 'Whole days away from work, from one date to another.',
  day_off: 'A one-off rest day, such as swapping the usual one. Whole days only.',
  time_off: 'Permission to miss work: whole days, or some hours of one day.',
  overtime: 'Extra hours on a single day, with a start and an end time.',
  absence: 'The employee was not at work: whole days, or some hours of one day.',
}

/** Tipo preseleccionado al crear: Work shift, salvo que el padre lo oculte (entonces vacation). */
export function createFormState(
  date: string | null | undefined,
  userId: string,
  hideWorkShift = false,
): EventFormState {
  // Sin fecha ni horas por defecto; solo la fecha de la celda si se abrió desde una.
  const day = date || ''
  return {
    userId,
    type: hideWorkShift ? 'vacation' : 'work_shift',
    startDate: day,
    endDate: day,
    wholeDay: true,
    startTime: '',
    endTime: '',
    status: 'approved',
    justified: false,
    reason: '',
  }
}

export function formStateFromEvent(e: EventFormSource, userId: string): EventFormState {
  return {
    userId,
    type: e.type,
    startDate: e.startDate,
    endDate: e.endDate,
    wholeDay: e.startTime === null,
    startTime: e.startTime ?? '',
    endTime: e.endTime ?? '',
    status: e.status,
    justified: e.justified ?? false,
    reason: e.reason ?? '',
  }
}

/** vacation / day_off: siempre días completos. overtime: siempre horas. */
export function canChooseWholeDay(type: DialogType): boolean {
  if (type === 'work_shift') return false
  const m = EVENT_META[type]
  return !m.wholeDayOnly && !m.hoursOnly
}

export function isWholeDayForm(s: Pick<EventFormState, 'type' | 'wholeDay'>): boolean {
  if (s.type === 'work_shift') return true
  const m = EVENT_META[s.type]
  if (m.wholeDayOnly) return true
  if (m.hoursOnly) return false
  return s.wholeDay
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const isIsoDate = (v: string): boolean => ISO_DATE.test(v)

export function validateEventForm(s: EventFormState): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!s.userId) errors.userId = 'Select an employee'
  if (s.type === 'work_shift') return errors

  const whole = isWholeDayForm(s)

  if (!isIsoDate(s.startDate)) errors.startDate = whole ? 'Choose a start date' : 'Choose a date'

  if (whole) {
    if (!isIsoDate(s.endDate)) {
      errors.endDate = 'Choose an end date'
    } else if (isIsoDate(s.startDate)) {
      if (s.endDate < s.startDate) {
        errors.endDate = 'End date cannot be before the start date'
      } else if (daysBetweenIso(s.startDate, s.endDate) > MAX_EVENT_DAYS) {
        errors.endDate = `An event can last at most ${MAX_EVENT_DAYS} days`
      }
    }
  } else {
    if (!s.startTime) errors.startTime = 'Choose a start time'
    if (!s.endTime) errors.endTime = 'Choose an end time'
    else if (s.startTime && s.endTime <= s.startTime) {
      errors.endTime = 'End time must be after the start time'
    }
  }

  if (s.reason.length > MAX_REASON_LENGTH) {
    errors.reason = `At most ${MAX_REASON_LENGTH} characters (${s.reason.length} now)`
  }
  return errors
}

/** Primer error en orden de pantalla: es el motivo por el que Save está deshabilitado. */
export function firstError(errors: EventFormErrors): { field: EventFormField; message: string } | null {
  for (const field of FIELD_ORDER) {
    const message = errors[field]
    if (message) return { field, message }
  }
  return null
}

export function buildEventPayload(s: EventFormState, type: ScheduleEventType): ScheduleEventPayload {
  const whole = isWholeDayForm(s)
  const payload: ScheduleEventPayload = {
    type,
    startDate: s.startDate,
    endDate: whole ? s.endDate || s.startDate : s.startDate,
    startTime: whole ? null : s.startTime,
    endTime: whole ? null : s.endTime,
    reason: s.reason.trim() || null,
  }
  if (type === 'time_off') payload.status = s.status
  if (type === 'absence') payload.justified = s.justified
  return payload
}

/** Con año solo si no es el actual: 'Nov 4' · 'Nov 4, 2027'. */
export function dateLabel(iso: string): string {
  const sameYear = iso.slice(0, 4) === todayIso().slice(0, 4)
  return sameYear ? formatShortDate(iso) : formatDate(iso)
}

/** 120 → '2 h' · 90 → '1 h 30 min' · 45 → '45 min' */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h && m) return `${h} h ${m} min`
  return h ? `${h} h` : `${m} min`
}

/**
 * Resumen en vivo: '3 days · Nov 4 – Nov 6' o 'Nov 4 · 14:00–16:00 (2 h)'.
 * null mientras faltan datos para describirlo.
 */
export function summarizeEventForm(s: EventFormState): string | null {
  if (s.type === 'work_shift' || !isIsoDate(s.startDate)) return null

  if (isWholeDayForm(s)) {
    if (!isIsoDate(s.endDate) || s.endDate < s.startDate) return null
    const n = daysBetweenIso(s.startDate, s.endDate)
    return n === 1
      ? `1 day · ${dateLabel(s.startDate)}`
      : `${n} days · ${dateLabel(s.startDate)} – ${dateLabel(s.endDate)}`
  }

  if (!s.startTime || !s.endTime || s.endTime <= s.startTime) return dateLabel(s.startDate)
  const mins = toMinutes(s.endTime) - toMinutes(s.startTime)
  return `${dateLabel(s.startDate)} · ${s.startTime}–${s.endTime} (${formatDuration(mins)})`
}

/** Evento que el API devuelve dentro del 409. */
export interface EventConflict {
  id: string
  type: string
  status: string | null
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
}

/** Extrae `conflicts` del cuerpo de error (el servicio propaga response.data). */
export function parseConflicts(error: unknown): EventConflict[] {
  const raw = (error as { conflicts?: unknown } | null | undefined)?.conflicts
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .filter((c) => typeof c.startDate === 'string')
    .map((c, i) => ({
      id: typeof c.id === 'string' ? c.id : `conflict-${i}`,
      type: typeof c.type === 'string' ? c.type : 'event',
      status: typeof c.status === 'string' ? c.status : null,
      startDate: c.startDate as string,
      endDate: typeof c.endDate === 'string' ? c.endDate : (c.startDate as string),
      startTime: typeof c.startTime === 'string' ? c.startTime : null,
      endTime: typeof c.endTime === 'string' ? c.endTime : null,
    }))
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
