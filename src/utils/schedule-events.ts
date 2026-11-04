// src/utils/schedule-events.ts
// Presentación de los eventos del Master Schedule.
import type {
  BaseBlock,
  MasterScheduleDay,
  MasterScheduleEvent,
  MasterScheduleUser,
  ScheduleEventStatus,
  ScheduleEventType,
} from '@/types/schedule-events'
import { formatDate, formatShortDate } from '@/utils/schedule'

export interface EventTypeMeta {
  label: string
  /** Color propio del tipo (hex) para fichas, celdas y leyenda. */
  hex: string
  /** Etiqueta corta para las celdas de la grilla. */
  short: string
  color: string
  icon: string
  /** Siempre día completo (sin horas). */
  wholeDayOnly: boolean
  /** Siempre un tramo de horas de un solo día. */
  hoursOnly: boolean
}

export const EVENT_TYPES: ScheduleEventType[] = [
  'vacation',
  'day_off',
  'time_off',
  'overtime',
  'absence',
]

export const EVENT_META: Record<ScheduleEventType, EventTypeMeta> = {
  vacation: {
    label: 'Vacation',
    hex: '#0288D1',
    short: 'Vacation',
    color: 'info',
    icon: 'mdi-beach',
    wholeDayOnly: true,
    hoursOnly: false,
  },
  day_off: {
    label: 'Day off',
    hex: '#607D8B',
    short: 'Day off',
    color: 'blue-grey',
    icon: 'mdi-sleep',
    wholeDayOnly: true,
    hoursOnly: false,
  },
  time_off: {
    label: 'Time off request',
    hex: '#B45309',
    short: 'Time off',
    color: 'warning',
    icon: 'mdi-account-clock-outline',
    wholeDayOnly: false,
    hoursOnly: false,
  },
  overtime: {
    label: 'Overtime',
    hex: '#8E24AA',
    short: 'Overtime',
    color: 'purple',
    icon: 'mdi-timer-plus-outline',
    wholeDayOnly: false,
    hoursOnly: true,
  },
  absence: {
    label: 'Absence',
    hex: '#D32F2F',
    short: 'Absence',
    color: 'error',
    icon: 'mdi-account-off-outline',
    wholeDayOnly: false,
    hoursOnly: false,
  },
}

/**
 * Work shift no es un evento: es el horario base (con lunch). Se lista junto a
 * los eventos en "Add event" y en la leyenda, con su propio color.
 */
export const WORK_SHIFT_META = {
  label: 'Work shift',
  hex: '#00897B',
  icon: 'mdi-briefcase-clock-outline',
} as const

export const STATUS_META: Record<ScheduleEventStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'default' },
}

/** 450 → '7h 30m' · 480 → '8h' · 0 → '0h' */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

/** 'HH:mm' → minutos desde medianoche. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isWholeDay(event: Pick<MasterScheduleEvent, 'startTime'>): boolean {
  return event.startTime === null
}

/** 'Dec 22 – Dec 26, 2026' · 'Dec 22, 2026 · 14:00–16:00' */
export function describeEventWhen(
  e: Pick<MasterScheduleEvent, 'startDate' | 'endDate' | 'startTime' | 'endTime'>,
): string {
  const dates =
    e.startDate === e.endDate
      ? formatDate(e.startDate)
      : `${formatShortDate(e.startDate)} – ${formatDate(e.endDate)}`
  return e.startTime && e.endTime ? `${dates} · ${e.startTime}–${e.endTime}` : dates
}

/** Texto corto para la chip de una celda: 'Vacation', 'Overtime 18:00–20:00', 'Time off · pending'. */
export function describeEventChip(e: MasterScheduleEvent): string {
  const meta = EVENT_META[e.type]
  let text = meta.short
  if (e.startTime && e.endTime) text += ` ${e.startTime}–${e.endTime}`
  if (e.type === 'time_off' && e.status !== 'approved') text += ` · ${e.status}`
  if (e.type === 'absence') text += e.justified ? ' · justified' : ' · unjustified'
  return text
}

export function fullName(user: Pick<MasterScheduleUser, 'firstName' | 'lastName' | 'email'>): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed user'
}

/** Minutos planeados de un usuario en todo el rango de la grilla. */
export function totalPlannedMinutes(user: Pick<MasterScheduleUser, 'days'>): number {
  return user.days.reduce((sum, d) => sum + d.plannedMinutes, 0)
}

// ─────────────────────── Master Schedule: filtros y vista de día ───────────────────────

/** Lo que se puede mostrar / ocultar en la grilla: el work shift o un tipo de evento. */
export type ScheduleFilterKey = 'work_shift' | ScheduleEventType

export const FILTER_KEYS: ScheduleFilterKey[] = ['work_shift', ...EVENT_TYPES]

export function filterMeta(key: ScheduleFilterKey): { label: string; hex: string; icon: string } {
  return key === 'work_shift' ? WORK_SHIFT_META : EVENT_META[key]
}

/** Iniciales para el avatar: 'Ana Pérez' → 'AP'; sin nombre, las dos primeras del correo. */
export function initials(
  user: Pick<MasterScheduleUser, 'firstName' | 'lastName' | 'email'>,
): string {
  const letters = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => (part as string).trim().charAt(0))
    .join('')
  return (letters || (user.email ?? '?').slice(0, 2)).slice(0, 2).toUpperCase()
}

/** Minutos planeados por semana (la grilla siempre arranca en lunes: bloques de 7 días). */
export function weeklyPlannedMinutes(user: Pick<MasterScheduleUser, 'days'>): number[] {
  const weeks: number[] = []
  user.days.forEach((d, i) => {
    const w = Math.floor(i / 7)
    weeks[w] = (weeks[w] ?? 0) + d.plannedMinutes
  })
  return weeks
}

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/** 'Nov 2–8, 2026' · 'Oct 26 – Nov 1, 2026' · 'Dec 28, 2026 – Jan 3, 2027' */
export function formatRangeTitle(from: string, to: string): string {
  const a = utcDate(from)
  const b = utcDate(to)
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts })
  if (a.getUTCFullYear() !== b.getUTCFullYear()) {
    return `${formatDate(from)} – ${formatDate(to)}`
  }
  if (a.getUTCMonth() === b.getUTCMonth()) {
    if (from === to) return formatDate(from)
    return `${fmt({ month: 'short' }).format(a)} ${a.getUTCDate()}–${b.getUTCDate()}, ${a.getUTCFullYear()}`
  }
  return `${formatShortDate(from)} – ${formatShortDate(to)}, ${b.getUTCFullYear()}`
}

/** 'Mon, Nov 2' */
export function formatWeekdayDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(utcDate(iso))
}

/** 'Nov' (para cabeceras de día). */
export function monthShort(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(utcDate(iso))
}

export interface ResolvedDay {
  /** Tipo efectivo del día tras aplicar los filtros. */
  kind: MasterScheduleDay['kind']
  /** Color (hex) con el que se tiñe la celda, o null. */
  tint: string | null
  /** Turno visible (null si no hay o está filtrado). */
  shift: BaseBlock | null
  /** Hay un evento visible que quita el día: el turno va tachado. */
  isOff: boolean
  events: MasterScheduleEvent[]
}

/** Aplica los filtros de tipo a un día para que grilla y agenda pinten lo mismo. */
export function resolveDay(day: MasterScheduleDay, hidden: ReadonlySet<ScheduleFilterKey>): ResolvedDay {
  const offHidden = day.kind === 'off' && (!day.offReason || hidden.has(day.offReason))
  let kind = day.kind
  if (offHidden) kind = day.base ? (day.base.block ? 'work' : 'rest') : 'unscheduled'

  const shift = day.base?.block && !hidden.has('work_shift') ? day.base.block : null
  const isOff = kind === 'off'
  let tint: string | null = null
  if (isOff && day.offReason) tint = EVENT_META[day.offReason].hex
  else if (kind === 'work') tint = WORK_SHIFT_META.hex

  return { kind, tint, shift, isOff, events: day.events.filter((e) => !hidden.has(e.type)) }
}

/** Texto accesible de un evento: 'Vacation, Dec 22 – Dec 26, 2026, approved'. */
export function describeEventAria(e: MasterScheduleEvent): string {
  return `${EVENT_META[e.type].label}, ${describeEventWhen(e)}, ${e.status}`
}
