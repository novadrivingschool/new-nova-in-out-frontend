/**
 * src/components/AdminDashboard/dashboardHelp.ts
 *
 * Textos de ayuda (tooltip "i") del dashboard: qué significa cada KPI/gráfica
 * y cómo se calcula su valor. Viven en un único archivo para que la
 * explicación y la fórmula se mantengan junto a la lógica descrita
 * (backend: nova_in_out_backend/src/nova_in_out/dashboard.analytics.ts).
 */

/** Regla común de horas; se reutiliza en varias explicaciones. */
const HOURS_RULE =
  'Suma de cada par CLOCK_IN → CLOCK_OUT completo. Hoy, un turno aún abierto cuenta hasta la hora actual (hora de Chicago). En fechas pasadas, un turno sin CLOCK_OUT no suma horas.'

export const kpiHelp = {
  clockedInNow:
    'Empleados cuyo último registro del día seleccionado es un CLOCK_IN, es decir, están trabajando ahora. En fechas pasadas son los turnos que nunca se cerraron (sin CLOCK_OUT).',
  clockedInToday:
    'Empleados con al menos un CLOCK_IN en la fecha seleccionada. Cada uno cuenta una sola vez, aunque haya entrado y salido varias veces.',
  notClockedIn:
    'Empleados activos que no están en "Clocked in now". Incluye a quienes ya registraron salida y a quienes nunca registraron entrada. La lista de empleados activos viene del servicio de usuarios.',
  attendanceRate:
    'Empleados activos que registraron entrada al menos una vez ÷ total de empleados activos × 100.',
  hoursWorked: HOURS_RULE,
  avgHours:
    'Horas trabajadas totales ÷ número de empleados que registraron entrada ese día. Quienes no registraron entrada no se cuentan.',
  activityRate:
    'Tiempo activo ÷ (tiempo activo + tiempo inactivo) × 100. Se basa en los registros de actividad que la app de escritorio envía cada 5 minutos mientras el empleado está en turno. Muestra "—" si la app no reportó nada.',
  avgFirstClockIn:
    'Promedio del primer CLOCK_IN del día de cada empleado. Quienes no registraron entrada no se cuentan.',
  peakPresence:
    'Máximo de empleados trabajando al mismo tiempo y la hora en que ocurrió. Un empleado cuenta en cada hora que toca alguno de sus turnos.',
  missingClockOut:
    'Empleados cuyo último registro en esa fecha pasada es un CLOCK_IN: nunca registraron salida. Sus horas no se cuentan.',
  adminClockOuts:
    'CLOCK_OUT hechos por un administrador (por ejemplo, un corte de luz o de internet) en la fecha seleccionada. Cierran el turno igual que uno normal, así que sus horas sí se cuentan hasta ese momento; no traen captura de pantalla.',
} as const

export const chartHelp = {
  headcountByHour:
    'Número de empleados en turno en cada hora. Un turno cuenta en todas las horas que toca. Un turno abierto llega hasta ahora (hoy) o hasta el último registro de actividad del empleado (fechas pasadas).',
  status:
    'Divide al equipo en: On the clock (último registro CLOCK_IN), Clocked out (entró antes y su último registro es CLOCK_OUT) y Not clocked in (empleados activos sin CLOCK_IN ese día). El centro muestra el total.',
  hoursByEmployee: `Horas trabajadas por empleado, de mayor a menor (top 12). ${HOURS_RULE}`,
  arrivals:
    'Primer CLOCK_IN del día de cada empleado, agrupado en bloques de 30 minutos. Cada barra es el número de empleados que llegaron en ese bloque.',
  activityByHour:
    'Minutos de tiempo activo vs inactivo reportados por la app de escritorio, sumados por la hora de cada registro. Activo = hay actividad de teclado/ratón; inactivo = no la hay. Si falta una barra, la app no reportó nada esa hora.',
  adminClockOutsByReason:
    'Clock outs hechos por un administrador en la fecha seleccionada, agrupados por el motivo que eligió: No internet, Power outage, Emergency exit, Abandoned equipment o Illness.',
  adminClockOutsPerDay:
    'Clock outs hechos por un administrador en cada uno de los 14 días que terminan en la fecha seleccionada. La barra azul es la fecha seleccionada; los días sin cierres de admin muestran 0.',
  employeesPerDay:
    'Empleados con al menos un CLOCK_IN en cada uno de los 14 días que terminan en la fecha seleccionada. La barra azul es la fecha seleccionada; los días sin registros muestran 0 (por ejemplo, fines de semana).',
  hoursPerDay: `Horas totales del equipo por día, en los 14 días que terminan en la fecha seleccionada. La barra azul es la fecha seleccionada. ${HOURS_RULE}`,
  activityPerDay:
    'Porcentaje del tiempo registrado en que el equipo estuvo activo (tiempo activo ÷ tiempo activo + inactivo × 100), día por día, en los 14 días que terminan en la fecha seleccionada. Un valor alto significa que casi todo el tiempo en turno hubo actividad de teclado/ratón. El punto grande es la fecha seleccionada; los días sin datos de actividad quedan en blanco.',
  employeeTable:
    'Una fila por empleado activo, más cualquiera que haya registrado entrada. First in / Last clock son el primer y el último registro del día. Hours y Activity siguen las mismas reglas que los KPIs; "—" significa sin datos. "No clock out" marca un turno de una fecha pasada que nunca se cerró.',
} as const
