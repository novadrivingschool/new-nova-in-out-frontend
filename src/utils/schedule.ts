// src/utils/schedule.ts
// Helpers de presentación y fechas calendario ('YYYY-MM-DD') para horarios.
// Todo se calcula en UTC sobre la fecha pura para no depender de la zona del
// navegador (el personal está en Chicago, Ecuador y México).
import type {
  EmployeeSchedule,
  ScheduleDay,
  ScheduleRevisionAction,
} from '@/types/schedules'

/** Los horarios y su vigencia se interpretan siempre en hora de Chicago. */
export const SCHEDULE_TIME_ZONE = 'America/Chicago'

export const WEEKDAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
] as const

export type ScheduleStatus = 'current' | 'upcoming' | 'past'

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIso(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toIso(date)
}

/** Lunes de la semana a la que pertenece `iso`. */
export function mondayOf(iso: string): string {
  const weekday = parseIso(iso).getUTCDay() // 0 = domingo
  return addDaysIso(iso, -((weekday + 6) % 7))
}

/** Hoy ('YYYY-MM-DD') en la zona de los horarios, igual que el backend. */
/** Días calendario entre dos fechas, ambas inclusive (mismo día = 1). */
export function daysBetweenIso(from: string, to: string): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000) + 1
}

/**
 * Fechas del periodo agrupadas por día de la semana ISO (1 = lunes … 7 = domingo).
 * Recorre como máximo 92 días: basta para saber qué días existen en el periodo.
 */
export function weekdayDates(from: string, to: string): Map<number, string[]> {
  const result = new Map<number, string[]>()
  const total = Math.min(daysBetweenIso(from, to), 92)
  for (let i = 0; i < total; i++) {
    const iso = addDaysIso(from, i)
    const jsDay = parseIso(iso).getUTCDay()
    const weekday = jsDay === 0 ? 7 : jsDay
    result.set(weekday, [...(result.get(weekday) ?? []), iso])
  }
  return result
}

/** Día de la semana ISO (1 = lunes … 7 = domingo) de una fecha calendario. */
export function isoWeekdayOf(iso: string): number {
  const jsDay = parseIso(iso).getUTCDay()
  return jsDay === 0 ? 7 : jsDay
}

export const MAX_VARIABLE_DAYS = 92

export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parseIso(iso))
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(parseIso(iso))
}

export function formatDateTime(isoTimestamp: string): string {
  return (
    new Intl.DateTimeFormat('en-US', {
      timeZone: SCHEDULE_TIME_ZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoTimestamp)) + ' CT'
  )
}

export function describeRange(
  schedule: Pick<EmployeeSchedule, 'type' | 'validFrom' | 'validTo'>,
): string {
  return schedule.validTo
    ? `${formatDate(schedule.validFrom)} → ${formatDate(schedule.validTo)}`
    : `From ${formatDate(schedule.validFrom)} · no end date`
}

export function scheduleStatus(
  schedule: Pick<EmployeeSchedule, 'validFrom' | 'validTo'>,
  today: string = todayIso(),
): ScheduleStatus {
  if (schedule.validFrom > today) return 'upcoming'
  if (schedule.validTo !== null && schedule.validTo < today) return 'past'
  return 'current'
}

/** [1,2,3,5] → 'Mon–Wed, Fri' */
function compressWeekdays(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b)
  const label = (n: number) => WEEKDAYS[n - 1].short
  const parts: string[] = []
  let start = 0
  for (let i = 1; i <= sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      const from = sorted[start]
      const to = sorted[i - 1]
      if (to - from >= 2) parts.push(`${label(from)}–${label(to)}`)
      else for (let n = from; n <= to; n++) parts.push(label(n))
      start = i
    }
  }
  return parts.join(', ')
}

export interface DayGroup {
  days: string
  hours: string
  lunch: string | null
}

/** ['2026-10-26','2026-10-27','2026-10-28','2026-11-02'] → 'Oct 26–Oct 28, Nov 2' */
function compressDates(dates: string[]): string {
  const sorted = [...dates].sort()
  const parts: string[] = []
  let start = 0
  for (let i = 1; i <= sorted.length; i++) {
    if (i === sorted.length || sorted[i] !== addDaysIso(sorted[i - 1], 1)) {
      const run = sorted.slice(start, i)
      if (run.length >= 3) parts.push(`${formatShortDate(run[0])}–${formatShortDate(run[run.length - 1])}`)
      else parts.push(...run.map(formatShortDate))
      start = i
    }
  }
  return parts.join(', ')
}

/**
 * Agrupa los días con idénticos bloques.
 *  fixed:    'Mon–Fri · 09:00–18:00 · lunch 14:00–15:00'
 *  variable: 'Oct 26–Oct 28, Nov 2 · 12:00–18:00' (por fecha)
 */
export function summarizeDays(days: ScheduleDay[]): DayGroup[] {
  const byDate = days.some((d) => !!d.date)
  const sorted = [...days].sort((a, b) =>
    byDate ? (a.date ?? '').localeCompare(b.date ?? '') : a.weekday - b.weekday,
  )
  const groups = new Map<string, { keys: (number | string)[]; first: ScheduleDay }>()
  for (const day of sorted) {
    const key = [day.startTime, day.endTime, day.lunchStart ?? '', day.lunchEnd ?? ''].join('|')
    const group = groups.get(key)
    const id = byDate ? (day.date as string) : day.weekday
    if (group) group.keys.push(id)
    else groups.set(key, { keys: [id], first: day })
  }
  return [...groups.values()].map(({ keys, first }) => ({
    days: byDate ? compressDates(keys as string[]) : compressWeekdays(keys as number[]),
    hours: `${first.startTime}–${first.endTime}`,
    lunch: first.lunchStart && first.lunchEnd ? `${first.lunchStart}–${first.lunchEnd}` : null,
  }))
}

export function describeDays(days: ScheduleDay[]): string {
  return summarizeDays(days)
    .map((g) => `${g.days} ${g.hours}${g.lunch ? ` (lunch ${g.lunch})` : ' (no lunch)'}`)
    .join(' · ')
}

export const ACTION_META: Record<ScheduleRevisionAction, { label: string; color: string }> = {
  created: { label: 'Created', color: 'success' },
  updated: { label: 'Edited', color: 'info' },
  closed: { label: 'Ended', color: 'warning' },
  deleted: { label: 'Deleted', color: 'error' },
}

/** Mensaje legible a partir del cuerpo de error de Nest o de un Error. */
export function parseApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = error as { statusCode?: number; message?: string | string[] } | undefined
  if (e?.statusCode === 403) return 'Only admins can manage schedules.'
  if (Array.isArray(e?.message) && e.message.length) return e.message[0]
  if (typeof e?.message === 'string' && e.message) return e.message
  return fallback
}
