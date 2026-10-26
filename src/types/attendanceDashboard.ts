/**
 * src/types/attendanceDashboard.ts
 *
 * Contrato de GET /nova-in-out/dashboard y /nova-in-out/dashboard/trend.
 * Espejo de nova_in_out_backend/src/nova_in_out/dashboard.analytics.ts.
 */

export interface DashboardRecord {
  employee_number: string
  type_of_clock: string
  clock_time: string | null
  clock_date: string
  firstName?: string
  lastName?: string
  fullName?: string
}

export interface DashboardKpis {
  activeEmployees: number
  presentCount: number
  onClockCount: number
  /** % de empleados activos que fichó entrada. null si no hay empleados activos. */
  attendanceRate: number | null
  totalWorkedHours: number
  avgWorkedHours: number | null
  /** % de tiempo ACTIVO sobre el tiempo registrado por la app. null sin datos. */
  activityRate: number | null
  activeHours: number
  inactiveHours: number
  /** 'HH:mm' */
  avgFirstClockIn: string | null
  peak: { hour: number; count: number } | null
  openShifts: number
  /** Clock outs hechos por un admin ese día. */
  adminClockOuts: number
}

export interface AdminReasonCount {
  reason: string
  count: number
}

export interface HourPoint {
  hour: number
  headcount: number
}

export interface ActivityPoint {
  hour: number
  activeMin: number
  inactiveMin: number
}

export interface ArrivalBucket {
  label: string
  count: number
}

export type EmployeeStatus = 'ON_CLOCK' | 'LEFT' | 'ABSENT'

export interface DashboardEmployeeRow {
  employee_number: string
  fullName: string
  firstName?: string
  lastName?: string
  status: EmployeeStatus
  firstIn: string | null
  lastClock: string | null
  workedHours: number
  activityRate: number | null
  openShift: boolean
  /** Tuvo un clock out hecho por un admin ese día. */
  adminClockOut: boolean
}

export interface AttendanceDashboard {
  date: string
  isToday: boolean
  counts: {
    clockedInNow: number
    clockedInToday: number
    notClockedIn: number
  }
  totalHours: number
  kpis: DashboardKpis
  charts: {
    headcountByHour: HourPoint[]
    activityByHour: ActivityPoint[]
    arrivals: ArrivalBucket[]
    status: { onClock: number; left: number; absent: number }
    hoursByEmployee: Array<{
      employee_number: string
      fullName: string
      workedHours: number
    }>
    adminClockOutsByReason: AdminReasonCount[]
  }
  employees: DashboardEmployeeRow[]
  clockedInNow: DashboardRecord[]
  clockedInToday: DashboardRecord[]
  notClockedIn: DashboardRecord[]
  lastUpdate: string
}

export interface TrendDay {
  date: string
  employees: number
  workedHours: number
  activityRate: number | null
  adminClockOuts: number
}

export interface AttendanceTrend {
  from: string
  to: string
  days: TrendDay[]
}
