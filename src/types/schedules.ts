// src/types/schedules.ts
// Contratos de /users/:userId/schedules (auth-and-users-api).

/** fixed = recurrente con vigencia · variable = un periodo concreto con horario por fecha. */
export type ScheduleType = 'fixed' | 'variable'

export interface ScheduleDay {
  /** ISO: 1 = lunes … 7 = domingo. Los días ausentes son descanso. */
  weekday: number
  /** variable: fecha 'YYYY-MM-DD' del bloque. fixed: null/ausente. */
  date?: string | null
  /** 'HH:mm' (24h) */
  startTime: string
  endTime: string
  lunchStart: string | null
  lunchEnd: string | null
}

export interface EmployeeSchedule {
  id: string
  userId: string
  type: ScheduleType
  /** 'YYYY-MM-DD' — primer día de vigencia. */
  validFrom: string
  /** 'YYYY-MM-DD' inclusive; null = sin fecha de término. */
  validTo: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  days: ScheduleDay[]
}

export interface CreateSchedulePayload {
  type: ScheduleType
  validFrom: string
  validTo?: string | null
  days: ScheduleDay[]
  notes?: string | null
  /** Solo fixed: cierra el fijo vigente el día anterior en vez de rechazar. */
  closePrevious?: boolean
}

export type UpdateSchedulePayload = Partial<
  Pick<CreateSchedulePayload, 'validFrom' | 'validTo' | 'days' | 'notes'>
>

export type ScheduleRevisionAction = 'created' | 'updated' | 'closed' | 'deleted'

export interface ScheduleSnapshot {
  id: string
  type: ScheduleType
  validFrom: string
  validTo: string | null
  notes: string | null
  days: ScheduleDay[]
}

export interface ScheduleRevision {
  id: string
  scheduleId: string
  action: ScheduleRevisionAction
  snapshot: ScheduleSnapshot
  changedBy: string | null
  changedByName: string | null
  changedAt: string
}
