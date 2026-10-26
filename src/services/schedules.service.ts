// src/services/schedules.service.ts
import { http } from '@/lib/http'
import type {
  CreateSchedulePayload,
  EmployeeSchedule,
  ScheduleRevision,
  UpdateSchedulePayload,
} from '@/types/schedules'

const base = (userId: string) => `/users/${userId}/schedules`

/** Mismo criterio que users.service: propaga el cuerpo del error del backend. */
function rethrow(error: any): never {
  throw error?.response?.data || error
}

export const schedulesService = {
  async list(userId: string): Promise<EmployeeSchedule[]> {
    try {
      const { data } = await http.get<EmployeeSchedule[]>(base(userId))
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async history(userId: string, limit = 100): Promise<ScheduleRevision[]> {
    try {
      const { data } = await http.get<ScheduleRevision[]>(`${base(userId)}/history`, {
        params: { limit },
      })
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async create(userId: string, payload: CreateSchedulePayload): Promise<EmployeeSchedule> {
    try {
      const { data } = await http.post<EmployeeSchedule>(base(userId), payload)
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async update(
    userId: string,
    scheduleId: string,
    payload: UpdateSchedulePayload,
  ): Promise<EmployeeSchedule> {
    try {
      const { data } = await http.patch<EmployeeSchedule>(
        `${base(userId)}/${scheduleId}`,
        payload,
      )
      return data
    } catch (error) {
      rethrow(error)
    }
  },

  async remove(userId: string, scheduleId: string): Promise<void> {
    try {
      await http.delete(`${base(userId)}/${scheduleId}`)
    } catch (error) {
      rethrow(error)
    }
  },
}
