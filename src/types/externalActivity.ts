// src/types/externalActivity.ts
// AR externo (Vout) visto desde el NIO. Solo lectura.

export interface ExternalArEvent {
  id: string
  /** Convención del NIO: CLOCK IN | CLOCK OUT | LUNCH | BRB | BIO BREAK | ACTIVITY | EVENT */
  type: string
  created_date: string
  created_time: string
  start_time: string
  end_time: string
  total_time: string
  is_open: boolean
  external_employee_number: string
  employee_name: string
  title: string | null
  description: string | null
  reason: string | null
  customers: string[]
  departments: string[]
  /** true: tipo que el NIO no opera (BIO BREAK / ACTIVITY / EVENT). */
  read_only: boolean
  /** Solo en las respuestas de admin. */
  user_id?: string | null
  nio_employee_number?: string | null
}

export interface ExternalArState {
  clockedIn: boolean
  lunchOpen: boolean
  brbOpen: boolean
  bioOpen: boolean
  activityOpenCount: number
}

export interface ExternalArDay {
  date: string
  arNumber: string
  events: ExternalArEvent[]
  state: ExternalArState
}

export interface ExternalArOpenNowRow extends ExternalArState {
  employee_number: string
  employee_full_name: string
  user_id: string | null
  nio_employee_number: string | null
  first_clock_in_time: string | null
  last_event_type: string
  lunch_since: string | null
  brb_since: string | null
}

export interface ExternalArOpenNow {
  date: string
  total: number
  data: ExternalArOpenNowRow[]
  brb_tolerance_sec: number
}

export interface ExternalArEvents {
  start_date: string
  end_date: string
  total: number
  data: ExternalArEvent[]
}
