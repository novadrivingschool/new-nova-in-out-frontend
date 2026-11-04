// src/services/schedule-events.service.ts
import { http } from '@/lib/http'
import type {
  ScheduleEvent,
  ScheduleEventPayload,
  UpdateScheduleEventPayload,
} from '@/types/schedule-events'

const base = (userId: string) => `/users/${userId}/schedule-events`

/** Mismo criterio que schedules.service: propaga el cuerpo del error del backend. */
function rethrow(error: any): never {
  throw error?.response?.data || error
}

export const scheduleEventsService = {
  async list(
    userId: string,
    params: { from?: string; to?: string; type?: string } = {},
  ): Promise<ScheduleEvent[]> {
    try {
      const { data } = await http.get<ScheduleEvent[]>(base(userId), { params })
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async create(userId: string, payload: ScheduleEventPayload): Promise<ScheduleEvent> {
    try {
      const { data } = await http.post<ScheduleEvent>(base(userId), payload)
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async update(
    userId: string,
    eventId: string,
    payload: UpdateScheduleEventPayload,
  ): Promise<ScheduleEvent> {
    try {
      const { data } = await http.patch<ScheduleEvent>(`${base(userId)}/${eventId}`, payload)
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async remove(userId: string, eventId: string): Promise<void> {
    try {
      await http.delete(`${base(userId)}/${eventId}`)
    } catch (error) {
      rethrow(error)
    }
  },
}
