// src/stores/global_schedule.ts
import { defineStore } from 'pinia'
import { fakeDatabase } from '@/stores/fakeDatabase/fakeDatabase'
import type { Instructor } from '@/stores/instructors/instructors'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end?: Date | null
  allDay: boolean
  color?: string | null
  person: Instructor           // 👈 objeto completo
}

let eventGuid = 0
function createEventId(): string {
  return String(eventGuid++)
}

export const useGlobalSchedule = defineStore('global_schedule', {
  state: () => ({
    events: [] as CalendarEvent[],
  }),

  getters: {
    // Filtra por ID del instructor (más estable que por nombre)
    eventsByPersonId: (state) => (personId: number) =>
      state.events.filter(e => e.person?.id === personId),

    // Todos (copia defensiva)
    all: (state) => state.events.slice(),
  },

  actions: {
    addEvent(evt: Omit<CalendarEvent, 'id'> & { id?: string }) {
      const id = evt.id ?? createEventId()
      this.events.push({ ...evt, id })
      return id
    },

    editEvent(id: string, patch: Partial<CalendarEvent>) {
      const idx = this.events.findIndex(e => e.id === id)
      if (idx === -1) return false
      this.events[idx] = { ...this.events[idx], ...patch, id }
      return true
    },

    deleteEvent(id: string) {
      const before = this.events.length
      this.events = this.events.filter(e => e.id !== id)
      return this.events.length < before
    },

    clearAll() {
      this.events = []
    },

    getAll(): CalendarEvent[] {
      return this.events.slice()
    },

    // Compatibilidad: filtrar por nombre completo (si lo necesitas en algún lugar)
    getByPersonName(fullName: string): CalendarEvent[] {
      return this.events.filter(e => `${e.person?.name} ${e.person?.lastName}`.trim() === fullName.trim())
    },

    // (Opcional) Semilla desde fakeDatabase, soporta person como nombre o personId
    seedFromFakeDB() {
      if (!fakeDatabase?.INITIAL_EVENTS) return
      const byId = new Map<number, Instructor>(
        fakeDatabase.instructors.map(i => [i.id, i])
      )

      const toDate = (v: any) => (v ? new Date(v) : null)

      const seeded: CalendarEvent[] = fakeDatabase.INITIAL_EVENTS.map((raw: any) => {
        // person puede venir como number (id) o string (nombre completo)
        let personObj: Instructor | undefined
        if (typeof raw.person === 'number') {
          personObj = byId.get(raw.person)
        } else if (typeof raw.person === 'string') {
          const targetName = String(raw.person).trim().toLowerCase()
          personObj = fakeDatabase.instructors.find(
            i => `${i.name} ${i.lastName}`.trim().toLowerCase() === targetName
          )
        }

        if (!personObj) {
          throw new Error(`seedFromFakeDB: no se encontró Instructor para person=${raw.person}`)
        }

        return {
          id: createEventId(),
          title: String(raw.title ?? ''),
          start: toDate(raw.start)!,
          end: raw.end ? toDate(raw.end) : null,
          allDay: !!raw.allDay,
          color: raw.color ?? null,
          person: personObj,
        }
      })

      this.events = seeded
    },
  },
})
