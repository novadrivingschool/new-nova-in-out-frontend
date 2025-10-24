import { defineStore } from 'pinia'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface NotSoldReason {
    id: number
    name: string
}

export const useNotSoldReasonsStore = defineStore('notSoldReasons', {
    state: () => ({
        reasons: [] as NotSoldReason[]
    }),
    actions: {
        loadMockReasons() {
            this.reasons = fakeDatabase.notSoldReasons
        },
        addReason(reason: NotSoldReason) {
            this.reasons.push(reason)
        },
        updateReason(id: number, updatedData: Partial<NotSoldReason>) {
            const index = this.reasons.findIndex(r => r.id === id)
            if (index !== -1) {
                this.reasons[index] = { ...this.reasons[index], ...updatedData }
            }
        },
        removeReason(id: number) {
            this.reasons = this.reasons.filter(r => r.id !== id)
        },
        fetchReasons() {
            this.reasons = fakeDatabase.notSoldReasons
            return this.reasons
        },
    }
})
