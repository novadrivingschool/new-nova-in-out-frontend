import { defineStore } from 'pinia'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Program {
    id: number
    name: string
    description?: string
    price: number
    isActive?: boolean
}

export const useProgramsStore = defineStore('programs', {
    state: () => ({
        programs: [] as Program[]
    }),
    actions: {
        loadMockPrograms() {
            this.programs = fakeDatabase.programs
        },
        addProgram(program: Program) {
            this.programs.push(program)
        },
        fetchPrograms() {
            // Simulating fetch; in a real case, you'd hit an API endpoint here.
            this.programs = fakeDatabase.programs
            return this.programs
        },
        getActivePrograms() {
            return this.programs.filter(program => program.isActive)
        },
        getProgramById(id: number) {
            return this.programs.find(program => program.id === id)
        },
        updateProgram(id: number, updatedData: Partial<Program>) {
            const index = this.programs.findIndex(p => p.id === id)
            if (index !== -1) {
                this.programs[index] = { ...this.programs[index], ...updatedData }
            }
        },
        removeProgram(id: number) {
            this.programs = this.programs.filter(p => p.id !== id)
        }
    }
})
