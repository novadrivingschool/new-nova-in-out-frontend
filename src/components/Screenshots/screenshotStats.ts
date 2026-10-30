/**
 * src/components/Screenshots/screenshotStats.ts
 *
 * Tipos de las estadísticas del rango buscado y utilidades de presentación.
 *
 * Los números NO se calculan aquí: los entrega el backend
 * (GET /nova-in-out/report/stats), que es la única fuente de estas reglas y la
 * misma que alimenta el PDF. Mantener los tipos en sintonía con
 * `nova_in_out_backend/src/nova_in_out/report/report.stats.ts`.
 */

export interface ClockSession {
  startDate: string
  startTime: string
  endDate: string | null
  endTime: string | null
  /** Tiempo trabajado de la sesión, ya sin el lunch. */
  durationSeconds: number
  /** Lunch descontado dentro de la sesión (s). */
  lunchSeconds?: number
  open: boolean
  /** El clock out lo hizo un admin. */
  closedByAdmin: boolean
  /** Motivo del cierre de admin (p. ej. POWER_OUTAGE), o null. */
  adminReason: string | null
}

/** Un lunch (Go to lunch → Back to lunch). No entra al cálculo del performance. */
export interface LunchPeriod {
  /** YYYY-MM-DD del inicio. */
  date: string
  /** HH:MM */
  start: string
  /** HH:MM; null si sigue en curso. */
  end: string | null
  seconds: number
  /** El regreso lo registró un admin por un force clock out. */
  closedByAdmin: boolean
}

export interface DayStats {
  /** YYYY-MM-DD */
  date: string
  totalSeconds: number
  /** Lunch del día (s); ya descontado de totalSeconds. */
  lunchSeconds: number
  activeSeconds: number
  sessions: number
  /** 0–100, o `null` si ese día no hay capturas. */
  performance: number | null
  captures: number
  /** Capturas sin conexión (offline / sin internet) ese día. */
  withoutConnection: number
  /** HH:MM de la primera entrada y de la última salida del día. */
  firstClockIn: string | null
  lastClockOut: string | null
}

/** Capturas con conexión por tramo de rendimiento. */
export interface PerformanceDistribution {
  low: number
  fair: number
  good: number
  high: number
}

/** Una captura dentro del día (sólo con un solo día en el rango). */
export interface TimelinePoint {
  /** HH:MM */
  time: string
  performance: number
  connected: boolean
  /** Estado de la captura, p. ej. NO_INTERNET u OFFLINE. */
  status: string
}

export interface StatusCount {
  /** Estado en mayúsculas, p. ej. NO_INTERNET. */
  status: string
  label: string
  count: number
  connected: boolean
}

export interface HourStats {
  /** 0–23 */
  hour: number
  /** Sólo capturas con conexión. 0–100. */
  performance: number
  captures: number
}

export type AnomalyType =
  | 'open_session'
  | 'duplicate_clock_in'
  | 'orphan_clock_out'
  | 'short_session'
  | 'long_session'

export interface Anomaly {
  type: AnomalyType
  date: string
  time: string
  detail: string
}

export interface ScreenshotStats {
  sessions: ClockSession[]
  /** Del día más reciente al más antiguo. */
  days: DayStats[]
  totalSeconds: number
  /** Lunch total del rango (s). Ya descontado de totalSeconds y fuera del performance. */
  lunchSeconds: number
  /** Cada lunch del rango, en orden. */
  lunches: LunchPeriod[]
  activeSeconds: number
  /** Tiempo activo sobre tiempo trabajado (0–100), o `null`. */
  activeShare: number | null
  performance: number | null
  /** Rendimiento contando sólo capturas con conexión. */
  connectedPerformance: number | null
  captures: number
  coverage: {
    connected: number
    withoutConnection: number
    connectedPct: number | null
    byStatus: StatusCount[]
  }
  pauses: { count: number; totalSeconds: number; longestSeconds: number }
  hours: HourStats[]
  distribution: PerformanceDistribution
  /** Vacío si el rango abarca varios días. */
  timeline: TimelinePoint[]
  anomalies: Anomaly[]
  /** Sesiones cerradas por un admin en el rango. */
  adminClockOuts: number
  /** Esas mismas, agrupadas por motivo (de mayor a menor). */
  adminClockOutsByReason: Array<{ reason: string; count: number }>
}

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  open_session: 'Open session',
  duplicate_clock_in: 'Duplicate clock in',
  orphan_clock_out: 'Orphan clock out',
  short_session: 'Very short session',
  long_session: 'Very long session',
}

/** 3725 → "1h 2m"; 125 → "2m 5s"; 18 → "18s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
