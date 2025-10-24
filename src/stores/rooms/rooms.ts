// src/stores/classrooms.ts
import { defineStore } from 'pinia'
import type { Program } from '@/stores/programs/programs'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Classroom {
    id: number
    name: string
    location: string
    capacity: number
    equipment?: string[]        // e.g. ['Projector', 'Whiteboard']
    isAvailable: boolean
    assignedPrograms: Program[] // programas que se imparten en este salón
}

export const useClassroomsStore = defineStore('classrooms', {
    state: () => ({
        classrooms: [] as Classroom[],
    }),

    actions: {
        loadMockClassrooms() {
            this.classrooms = fakeDatabase.classrooms
        },

        fetchByProgram(programId: number) {
            this.classrooms = fakeDatabase.classrooms.filter((room) =>
                room.assignedPrograms.some((p) => p.id === programId)
            )
        },

        addClassroom(room: Classroom) {
            this.classrooms.push(room)
        },

        updateClassroom(updated: Classroom) {
            const index = this.classrooms.findIndex(r => r.id === updated.id)
            if (index !== -1) {
                this.classrooms[index] = { ...updated }
            }
        },

        removeClassroom(id: number) {
            this.classrooms = this.classrooms.filter(r => r.id !== id)
        }
    }
})
