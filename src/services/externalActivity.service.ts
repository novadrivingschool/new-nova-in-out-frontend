// src/services/externalActivity.service.ts
// AR externo (Vout) vía el backend del NIO. Solo lectura.
import { http } from '@/lib/http'
import { toRemoteClockError } from '@/services/remoteClock.service'
import type { ExternalArDay, ExternalArEvents, ExternalArOpenNow } from '@/types/externalActivity'

const BASE =
  (import.meta.env.VITE_API_NOVA_IN_OUT_URL || 'http://localhost:5017') + '/nova-in-out/external-activity'

export const externalActivityService = {
  /** Eventos del día (Chicago) del propio usuario. 409 EXTERNAL_AR_NOT_ENABLED si no usa el AR externo. */
  async day(date?: string): Promise<ExternalArDay> {
    try {
      const { data } = await http.get<ExternalArDay>(`${BASE}/day`, { params: date ? { date } : {} })
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Admin: usuarios con el AR externo abierto hoy (con lunch / BRB). */
  async openNow(date?: string): Promise<ExternalArOpenNow> {
    try {
      const { data } = await http.get<ExternalArOpenNow>(`${BASE}/open-now`, { params: date ? { date } : {} })
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },

  /** Admin: eventos por rango (máx. 31 días). */
  async events(startDate: string, endDate: string): Promise<ExternalArEvents> {
    try {
      const { data } = await http.get<ExternalArEvents>(`${BASE}/events`, {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    } catch (e) {
      throw toRemoteClockError(e)
    }
  },
}
