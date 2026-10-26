export type RemoteClockAction = 'CLOCK_IN' | 'CLOCK_OUT'

export interface RemoteClockResult {
  ok: true
  commandId: string
  action: RemoteClockAction
  recordId: number | null
  /** true si la app ya estaba en el estado pedido (no se creó registro). */
  alreadyInState: boolean
}

export interface RemoteClockStatus {
  /** Hay socket de la app de escritorio conectado ahora. */
  connected: boolean
  /** La app informa turno abierto. */
  onShift: boolean
  connectedAt: string | null
}

/** Error normalizado de los endpoints de clock. */
export interface RemoteClockError {
  status?: number
  code?: string
  message: string
}

export const SELF_CLOCK_OUT_REASONS = [
  'APP_CLOSED',
  'FORGOT_CLOCK_OUT',
  'NO_INTERNET',
  'POWER_OUTAGE',
  'DEVICE_FAILURE',
  'EMERGENCY_EXIT',
  'ILLNESS',
] as const
export type SelfClockOutReason = (typeof SELF_CLOCK_OUT_REASONS)[number]

export const SELF_CLOCK_OUT_REASON_LABEL: Record<SelfClockOutReason, string> = {
  APP_CLOSED: 'Desktop app was closed',
  FORGOT_CLOCK_OUT: 'I forgot to clock out',
  NO_INTERNET: 'No internet',
  POWER_OUTAGE: 'Power outage',
  DEVICE_FAILURE: 'Computer failure',
  EMERGENCY_EXIT: 'Emergency exit',
  ILLNESS: 'Illness',
}

/** Registro de clock tal como lo devuelve /nova-in-out/search (solo lo que usa la vista). */
export interface ClockRecord {
  id: number
  clock_date: string
  clock_time: string
  type_of_clock: string
  source?: string | null
}

/** Evento del Activity Report (tabla propia `activity_events`, independiente de NIO). */
export interface ActivityEvent {
  id: number
  created_date: string
  created_time: string
  type_of_activity: 'CLOCK IN' | 'CLOCK OUT' | 'LUNCH'
  start_time: string
  /** '00:00:00' mientras el LUNCH está abierto. */
  end_time: string
  total_time: string
  via: 'DEVICE' | 'SERVER' | 'WEB' | 'ADMIN'
  reason?: string | null
  note?: string | null
  /** Admin que forzó el clock out (via = ADMIN). */
  admin_name?: string | null
}

export interface ActivityDay {
  date: string
  events: ActivityEvent[]
  state: { clockedIn: boolean; lunchOpen: boolean }
  /** Modo vinculado: Clock In/Out del Activity exigen la app de escritorio activa. */
  linked: boolean
}

export type LunchAction = 'IN' | 'OUT'
