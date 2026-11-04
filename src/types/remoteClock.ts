/**
 * LUNCH_IN = Go to lunch · LUNCH_OUT = Back to lunch · BRB_IN = Be right back · BRB_OUT = I'm back ·
 * BIO_IN = Bio break · BIO_OUT = I'm back (solo modo NIO + AR; los ejecuta la app NIO).
 */
export type RemoteClockAction =
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'LUNCH_IN'
  | 'LUNCH_OUT'
  | 'BRB_IN'
  | 'BRB_OUT'
  | 'BIO_IN'
  | 'BIO_OUT'

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
  type_of_activity: 'CLOCK IN' | 'CLOCK OUT' | 'LUNCH' | 'BRB' | 'BIO BREAK' | 'ACTIVITY'
  start_time: string
  /** '00:00:00' mientras el LUNCH / BRB / BIO BREAK / ACTIVITY está abierto. */
  end_time: string
  total_time: string
  via: 'DEVICE' | 'SERVER' | 'WEB' | 'ADMIN'
  reason?: string | null
  note?: string | null
  /** Admin que forzó el clock out (via = ADMIN). */
  admin_name?: string | null
  /** Solo ACTIVITY: título (se pide al Activity In). */
  activity_title?: string | null
  /** Solo ACTIVITY: notas (se piden al Activity Out; 'Closed automatically' si lo cerró el sistema). */
  activity_description?: string | null
}

export interface ActivityDay {
  date: string
  events: ActivityEvent[]
  state: {
    clockedIn: boolean
    lunchOpen: boolean
    /** Be right back abierto (excluyente con lunchOpen). */
    brbOpen?: boolean
    /** Tolerancia (s) de cada BRB antes de que impacte el performance. */
    brbToleranceSec?: number
    /** Bio break abierto (excluyente con lunchOpen y brbOpen). */
    bioOpen?: boolean
    /** Tolerancia (s) de cada BIO BREAK antes de que impacte el performance. */
    bioToleranceSec?: number
    /** Cantidad de ACTIVITY abiertas (varias a la vez). */
    activitiesOpen?: number
  }
  /** Tolerancia (s) del BRB si el backend la informa fuera de `state`. */
  brbToleranceSec?: number
  /** Tolerancia (s) del BIO BREAK si el backend la informa fuera de `state`. */
  bioToleranceSec?: number
  /** Modo vinculado: Clock In/Out del Activity exigen la app de escritorio activa. */
  linked: boolean
  /** true: el AR se identifica con el número externo (RR.HH.); false: con el employee_number del NIO. */
  useExternalAr?: boolean
  /** Número con el que el AR se identifica (externo si useExternalAr; si no, el del NIO). */
  arNumber?: string | null
}

export type LunchAction = 'IN' | 'OUT'
/** IN = Be right back · OUT = I'm back. */
export type BrbAction = 'IN' | 'OUT'
/** IN = Bio break · OUT = I'm back. */
export type BioAction = 'IN' | 'OUT'
