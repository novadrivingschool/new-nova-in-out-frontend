// src/services/remoteClock.service.ts
import { http } from '@/lib/http'
import type {
  ActivityDay,
  LunchAction,
  RemoteClockAction,
  RemoteClockError,
  RemoteClockResult,
  RemoteClockStatus,
  SelfClockOutReason,
} from '@/types/remoteClock'

const API_NOVA_IN_OUT_URL =
  import.meta.env.VITE_API_NOVA_IN_OUT_URL || 'http://localhost:5017'

/** Convierte un error de axios/Nest en { status, code, message } estable para la UI. */
export function toRemoteClockError(e: any): RemoteClockError {
  const data = e?.response?.data ?? e
  const raw = data?.message
  const message = Array.isArray(raw) ? raw.join(', ') : raw
  return {
    status: e?.response?.status,
    code: typeof data?.code === 'string' ? data.code : undefined,
    message: String(message ?? e?.message ?? 'Unexpected error'),
  }
}

export const remoteClockService = {
  /** Estado del socket de la app de escritorio del propio usuario. */
  async status(): Promise<RemoteClockStatus> {
    try {
      const { data } = await http.get<RemoteClockStatus>('/remote-clock/status')
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Pide a la app Electron del usuario un clock in / out (origen ACTIVITY_REPORT). */
  async request(externalEmployeeNumber: string, action: RemoteClockAction): Promise<RemoteClockResult> {
    try {
      const { data } = await http.post<RemoteClockResult>('/remote-clock', {
        external_employee_number: externalEmployeeNumber,
        action,
      })
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Cierre de turno hecho por el propio usuario cuando su app no respondió. */
  async selfClockOut(params: {
    externalEmployeeNumber: string
    reason: SelfClockOutReason
    note?: string
  }): Promise<void> {
    try {
      await http.post(`${API_NOVA_IN_OUT_URL}/nova-in-out/self/clock-out`, {
        external_employee_number: params.externalEmployeeNumber,
        reason: params.reason,
        note: params.note || undefined,
      })
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Eventos del Activity Report del usuario (día America/Chicago) + estado propio. */
  async activityDay(date?: string): Promise<ActivityDay> {
    try {
      const { data } = await http.get<ActivityDay>(`${API_NOVA_IN_OUT_URL}/nova-in-out/activity/events`, {
        params: date ? { date } : undefined,
      })
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Clock in / out del Activity: directo en la tabla propia, sin app de escritorio ni NIO. */
  async activityClock(
    externalEmployeeNumber: string,
    action: RemoteClockAction,
    commandId: string,
    handshakeNonce?: string,
  ): Promise<void> {
    try {
      await http.post(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/activity/clock`,
        { external_employee_number: externalEmployeeNumber, action, command_id: commandId },
        // Modo NIO + AR: el backend exige las 3 validaciones con este nonce.
        handshakeNonce ? { headers: { 'X-Handshake-Nonce': handshakeNonce } } : undefined,
      )
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Lunch in / out del Activity (no pasa por la app de escritorio). */
  async lunch(externalEmployeeNumber: string, action: LunchAction): Promise<void> {
    try {
      await http.post(`${API_NOVA_IN_OUT_URL}/nova-in-out/activity/lunch`, {
        external_employee_number: externalEmployeeNumber,
        action,
      })
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },
}
