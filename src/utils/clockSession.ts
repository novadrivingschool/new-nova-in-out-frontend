import type { ClockRecord } from '@/types/remoteClock'

export const CHICAGO_TZ = 'America/Chicago'

/** 'YYYY-MM-DD' en America/Chicago (misma zona que usa el backend para clock_date). */
export function chicagoDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHICAGO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** 'HH:mm:ss' (24 h) en America/Chicago. */
export function chicagoTime(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CHICAGO_TZ,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export function hhmmssToSeconds(t: string | null | undefined): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(String(t ?? ''))
  if (!m) return 0
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

export function secondsToHHMMSS(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

/** Solo CLOCK_IN / CLOCK_OUT, en orden cronológico (hora, luego id). */
export function clockRowsOf(records: ClockRecord[]): ClockRecord[] {
  return records
    .filter((r) => ['CLOCK_IN', 'CLOCK_OUT'].includes(String(r.type_of_clock).toUpperCase()))
    .sort(
      (a, b) =>
        hhmmssToSeconds(a.clock_time) - hhmmssToSeconds(b.clock_time) || a.id - b.id,
    )
}

/** true si el último evento de clock del día es un CLOCK_IN. */
export function isClockedIn(records: ClockRecord[]): boolean {
  const rows = clockRowsOf(records)
  const last = rows[rows.length - 1]
  return !!last && String(last.type_of_clock).toUpperCase() === 'CLOCK_IN'
}

/**
 * Segundos clockeados hoy: suma cada ciclo IN→OUT cerrado y, si sigue abierto, lo corrido hasta
 * `nowTime` (HH:mm:ss de Chicago). Un OUT sin IN previo se ignora.
 */
export function totalClockSecondsToday(records: ClockRecord[], nowTime: string): number {
  let total = 0
  let openAt: number | null = null
  for (const r of clockRowsOf(records)) {
    const t = hhmmssToSeconds(r.clock_time)
    if (String(r.type_of_clock).toUpperCase() === 'CLOCK_IN') {
      if (openAt === null) openAt = t
    } else if (openAt !== null) {
      total += Math.max(0, t - openAt)
      openAt = null
    }
  }
  if (openAt !== null) total += Math.max(0, hhmmssToSeconds(nowTime) - openAt)
  return total
}

export function sourceLabel(source?: string | null): string {
  switch (String(source ?? '').toUpperCase()) {
    case 'ACTIVITY_REPORT':
      return 'Activity Report'
    case 'ADMIN_FORCE':
      return 'Admin'
    case 'APP_LOGOUT':
      return 'NIO log out'
    default:
      return 'Desktop app'
  }
}
