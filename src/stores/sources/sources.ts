import { defineStore } from 'pinia'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Source {
    id: number
    name: string
}

export const useSourcesStore = defineStore('sources', {
    state: () => ({
        sources: [] as Source[]
    }),
    actions: {
        loadMockSources() {
            this.sources = fakeDatabase.sources
        },
        addSource(source: Source) {
            this.sources.push(source)
        },
        fetchSources() {
            // Simulate fetching sources from backend or API
            this.sources = fakeDatabase.sources
            return this.sources
        },
        getSourceById(id: number) {
            return this.sources.find(source => source.id === id)
        },
        updateSource(id: number, updatedData: Partial<Source>) {
            const index = this.sources.findIndex(s => s.id === id)
            if (index !== -1) {
                this.sources[index] = { ...this.sources[index], ...updatedData }
            }
        },
        removeSource(id: number) {
            this.sources = this.sources.filter(s => s.id !== id)
        }
    }
})
