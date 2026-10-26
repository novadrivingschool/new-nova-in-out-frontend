export type ForceClockOutReason =
  | 'NO_INTERNET'
  | 'POWER_OUTAGE'
  | 'EMERGENCY_EXIT'
  | 'ABANDONED_EQUIPMENT'
  | 'ILLNESS'

export const FORCE_CLOCK_OUT_REASON_LABEL: Record<ForceClockOutReason, string> = {
  NO_INTERNET: 'No internet',
  POWER_OUTAGE: 'Power outage',
  EMERGENCY_EXIT: 'Emergency exit',
  ABANDONED_EQUIPMENT: 'Abandoned equipment',
  ILLNESS: 'Illness',
}

export interface AdminClockOutView {
  id: number
  employee_number: string
  reason: ForceClockOutReason | string
  note: string | null
  admin_user_id: string
  admin_name: string
  /** ISO */
  created_at: string
  clock_out_record_id: number
  /** Fecha/hora del CLOCK_OUT registrado (America/Chicago) */
  clock_out_date: string | null
  clock_out_time: string | null
  /** Último registro conocido del empleado antes del cierre (America/Chicago) */
  last_activity_date: string | null
  last_activity_time: string | null
}
