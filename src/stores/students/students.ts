// src/stores/students.ts
import { defineStore } from 'pinia'
import type { Program } from '@/stores/programs/programs'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Student {
    id: number
    name: string
    lastName: string
    email: string
    phone: string
    enrolledPrograms: Program[]
}

export const useStudentsStore = defineStore('students', {
    state: () => ({
        students: [] as Student[],
    }),
    actions: {
        loadMockStudents() {
            this.students = fakeDatabase.students
        },
        fetchByProgram(programId: number) {
            this.students = fakeDatabase.students.filter(
                (student) => student.enrolledPrograms.some((p) => p.id === programId)
            )
        },
        addStudent(student: Student) {
            this.students.push(student)
        },
        updateStudent(updated: Student) {
            const index = this.students.findIndex(s => s.id === updated.id)
            if (index !== -1) {
                this.students[index] = { ...updated }
            }
        },
        removeStudent(id: number) {
            this.students = this.students.filter(s => s.id !== id)
        }
    }
})

