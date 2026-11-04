// src/types/schedule-events.ts
// Contratos de /users/:userId/schedule-events y /master-schedule (auth-and-users-api).

export type ScheduleEventType = 'vacation' | 'day_off' | 'time_off' | 'overtime' | 'absence'

export type ScheduleEventStatus = 'pending' | 'approved' | 'rejected'

export interface ScheduleEvent {
  id: string
  userId: string
  type: ScheduleEventType
  /** Solo time_off puede ser pending / rejected. */
  status: ScheduleEventStatus
  /** 'YYYY-MM-DD' */
  startDate: string
  /** 'YYYY-MM-DD', inclusive. */
  endDate: string
  /** 'HH:mm' (24h). null = día completo. */
  startTime: string | null
  endTime: string | null
  /** Solo absence. */
  justified: boolean | null
  reason: string | null
  createdAt: string
  updatedAt: string
}

export interface ScheduleEventPayload {
  type: ScheduleEventType
  startDate: string
  endDate?: string | null
  startTime?: string | null
  endTime?: string | null
  status?: ScheduleEventStatus
  justified?: boolean | null
  reason?: string | null
}

export type UpdateScheduleEventPayload = Partial<ScheduleEventPayload>

export type ScheduleEventRevisionAction = 'created' | 'updated' | 'deleted'

// ───────────────────────────── Master Schedule ─────────────────────────────

/** Evento tal como lo devuelve la grilla (sin userId ni auditoría). */
export type MasterScheduleEvent = Omit<ScheduleEvent, 'userId' | 'createdAt' | 'updatedAt'>

/**
 * work        → día laborable según el horario base.
 * rest        → hay horario vigente pero ese día no se trabaja.
 * off         → un evento aprobado de día completo lo quita (ver offReason).
 * unscheduled → no hay ningún horario vigente.
 */
export type DayKind = 'work' | 'rest' | 'off' | 'unscheduled'

export interface BaseBlock {
  startTime: string
  endTime: string
  lunchStart: string | null
  lunchEnd: string | null
}

export interface MasterScheduleDay {
  date: string
  kind: DayKind
  base: {
    scheduleId: string
    scheduleType: 'fixed' | 'variable'
    block: BaseBlock | null
  } | null
  events: MasterScheduleEvent[]
  offReason: ScheduleEventType | null
  /** Minutos que se espera trabajar ese día (base − lunch − horas libres + extra). */
  plannedMinutes: number
}

export interface MasterScheduleUser {
  userId: string
  employeeNumber: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  days: MasterScheduleDay[]
}

export interface MasterScheduleResponse {
  from: string
  to: string
  timeZone: string
  users: MasterScheduleUser[]
}
