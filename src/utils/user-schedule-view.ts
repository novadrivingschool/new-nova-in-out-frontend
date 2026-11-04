// src/utils/user-schedule-view.ts
// Presentación del horario de una persona: tira semanal, resumen de horas y
// rango legible de eventos. Solo lectura; la lógica del horario base vive en
// el backend y en utils/schedule.ts.
import type { EmployeeSchedule, ScheduleDay } from '@/types/schedules'
import type { ScheduleEvent } from '@/types/schedule-events'
import { formatMinutes, toMinutes } from '@/utils/schedule-events'
import {
  addDaysIso,
  daysBetweenIso,
  formatDate,
  formatShortDate,
  mondayOf,
  scheduleStatus,
  todayIso,
  WEEKDAYS,
} from '@/utils/schedule'

export interface WeekStripDay {
  weekday: number
  short: string
  label: string
  /** Fecha de ese día en la semana mostrada ('YYYY-MM-DD'). */
  date: string
  isToday: boolean
  rest: boolean
  startTime: string | null
  endTime: string | null
  lunch: string | null
  /** Minutos trabajados (bloque menos lunch). */
  minutes: number
}

/** Minutos de un bloque: fin − inicio − lunch (admite bloques que cruzan medianoche). */
export function blockMinutes(day: ScheduleDay): number {
  let span = toMinutes(day.endTime) - toMinutes(day.startTime)
  if (span <= 0) span += 1440
  if (day.lunchStart && day.lunchEnd) {
    let lunch = toMinutes(day.lunchEnd) - toMinutes(day.lunchStart)
    if (lunch < 0) lunch += 1440
    span -= lunch
  }
  return Math.max(0, span)
}

/**
 * Semana L–D de un horario.
 *  fixed:    la semana tipo (se repite).
 *  variable: la semana que contiene hoy, o el extremo del periodo más cercano.
 */
export function buildWeekStrip(
  schedule: Pick<EmployeeSchedule, 'type' | 'validFrom' | 'validTo' | 'days'>,
  today: string = todayIso(),
): WeekStripDay[] {
  let ref = today
  if (schedule.type === 'variable') {
    if (today < schedule.validFrom) ref = schedule.validFrom
    else if (schedule.validTo && today > schedule.validTo) ref = schedule.validTo
  }
  const monday = mondayOf(ref)
  return WEEKDAYS.map((w, i) => {
    const date = addDaysIso(monday, i)
    const block =
      schedule.type === 'fixed'
        ? schedule.days.find((d) => d.weekday === w.value)
        : schedule.days.find((d) => d.date === date)
    return {
      weekday: w.value,
      short: w.short,
      label: w.label,
      date,
      isToday: date === today,
      rest: !block,
      startTime: block?.startTime ?? null,
      endTime: block?.endTime ?? null,
      lunch: block?.lunchStart && block.lunchEnd ? `${block.lunchStart}–${block.lunchEnd}` : null,
      minutes: block ? blockMinutes(block) : 0,
    }
  })
}

export function weekMinutes(strip: WeekStripDay[]): number {
  return strip.reduce((sum, d) => sum + d.minutes, 0)
}

/** Horario a destacar: el vigente (variable antes que fijo), si no el próximo, si no el último. */
export function pickFeatured(
  schedules: EmployeeSchedule[],
  today: string = todayIso(),
): EmployeeSchedule | null {
  const current = schedules.filter((s) => scheduleStatus(s, today) === 'current')
  const byFrom = (a: EmployeeSchedule, b: EmployeeSchedule) => a.validFrom.localeCompare(b.validFrom)
  const variable = current.filter((s) => s.type === 'variable').sort(byFrom).reverse()[0]
  if (variable) return variable
  const fixed = current.filter((s) => s.type === 'fixed').sort(byFrom).reverse()[0]
  if (fixed) return fixed
  const upcoming = schedules.filter((s) => scheduleStatus(s, today) === 'upcoming').sort(byFrom)[0]
  if (upcoming) return upcoming
  return [...schedules].sort(byFrom).reverse()[0] ?? null
}

/** Resto de horarios: próximos (más cercano primero) y luego pasados (más reciente primero). */
export function orderHistory(
  schedules: EmployeeSchedule[],
  featuredId: string | null,
  today: string = todayIso(),
): EmployeeSchedule[] {
  const rest = schedules.filter((s) => s.id !== featuredId)
  const rank = (s: EmployeeSchedule) => {
    const st = scheduleStatus(s, today)
    return st === 'current' ? 0 : st === 'upcoming' ? 1 : 2
  }
  return rest.sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r) return r
    return rank(a) === 1 ? a.validFrom.localeCompare(b.validFrom) : b.validFrom.localeCompare(a.validFrom)
  })
}

/** 'Javier Pérez' → 'JP' · 'ana' → 'A' */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** 'Nov 4' · 'Nov 4–6' · 'Nov 30–Dec 2' · 'Dec 30, 2026–Jan 2, 2027' (año solo si no es el actual). */
export function formatDateSpan(startDate: string, endDate: string, today: string = todayIso()): string {
  if (startDate === endDate) {
    return startDate.slice(0, 4) === today.slice(0, 4) ? formatShortDate(startDate) : formatDate(startDate)
  }
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4)
  if (!sameYear) return `${formatDate(startDate)}–${formatDate(endDate)}`
  const suffix = startDate.slice(0, 4) === today.slice(0, 4) ? '' : `, ${startDate.slice(0, 4)}`
  if (startDate.slice(0, 7) === endDate.slice(0, 7)) {
    return `${formatShortDate(startDate)}–${Number(endDate.slice(8))}${suffix}`
  }
  return `${formatShortDate(startDate)}–${formatShortDate(endDate)}${suffix}`
}

/** 'Nov 4–6 · 3 days' · 'Nov 4 · 14:00–16:00 · 2h' */
export function describeEventRange(
  e: Pick<ScheduleEvent, 'startDate' | 'endDate' | 'startTime' | 'endTime'>,
  today: string = todayIso(),
): string {
  const dates = formatDateSpan(e.startDate, e.endDate, today)
  const days = daysBetweenIso(e.startDate, e.endDate)
  if (e.startTime && e.endTime) {
    const base = `${dates} · ${e.startTime}–${e.endTime}`
    if (days > 1) return `${base} each day`
    let span = toMinutes(e.endTime) - toMinutes(e.startTime)
    if (span <= 0) span += 1440
    return `${base} · ${formatMinutes(span)}`
  }
  return `${dates} · ${days} ${days === 1 ? 'day' : 'days'}`
}
