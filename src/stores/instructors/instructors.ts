import { defineStore } from 'pinia'
import type { Program } from '@/stores/programs/programs'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Instructor {
    id: number
    name: string
    lastName: string
    expertise: string
    email: string
    phone: string
    languages: string[]
    assignedPrograms: Program[]
}

export const useInstructorsStore = defineStore('instructors', {
    state: () => ({
        instructors: [] as Instructor[],
    }),
    actions: {
        loadMockData() {
            console.log('>>> loadMockData CALLED')
            this.instructors = fakeDatabase.instructors
        },
        fetchByExpertise(expertise: string) {
            console.log('>>> fetchByExpertise CALLED')
            this.instructors = fakeDatabase.instructors.filter(
                (inst) => inst.expertise === expertise
            )
        },
        addInstructor(instructor: Instructor) {
            console.log('>>> addInstructor CALLED', instructor)
            this.instructors.push(instructor)
        },
        updateInstructor(updatedInstructor: Instructor) {
            const index = this.instructors.findIndex(i => i.id === updatedInstructor.id)
            if (index !== -1) {
                this.instructors[index] = updatedInstructor
            }
        },
        deleteInstructor(id: number) {
            this.instructors = this.instructors.filter(i => i.id !== id)
        }
    }
})

