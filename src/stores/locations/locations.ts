import { defineStore } from 'pinia'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

export interface Location {
    id: number
    name: string
    zipCode: string
}

export const useLocationsStore = defineStore('locations', {
    state: () => ({
        locations: [] as Location[]
    }),
    actions: {
        loadMockLocations() {
            this.locations = fakeDatabase.locations
        },
        addLocation(location: Location) {
            this.locations.push(location)
        },
        fetchLocations() {
            this.locations = fakeDatabase.locations
            return this.locations
        },
        updateLocation(id: number, updatedData: Partial<Location>) {
            const index = this.locations.findIndex(l => l.id === id)
            if (index !== -1) {
                this.locations[index] = { ...this.locations[index], ...updatedData }
            }
        },
        removeLocation(id: number) {
            this.locations = this.locations.filter(l => l.id !== id)
        }
    }
})
