<template>
  <v-container>
    <v-card elevation="2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Locations</span>
        <v-btn color="primary" @click="openAddDialog" size="small">Add Location</v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="locations"
        class="elevation-1"
        item-value="id"
        density="comfortable"
      >
        <template #item.actions="{ item }">
          <v-icon
            class="mr-2"
            style="cursor: pointer;"
            @click="openEditDialog(item)"
            title="Edit"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            color="red"
            style="cursor: pointer;"
            @click="handleDelete(item.id)"
            title="Delete"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">{{ isEditMode ? 'Edit Location' : 'New Location' }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedLocation.name" label="Name" required />
            <v-text-field v-model="editedLocation.zipCode" label="Zip Code" required />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="handleSave">{{ isEditMode ? 'Update' : 'Save' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useLocationsStore } from '@/stores/locations/locations'
import type { Location } from '@/stores/locations/locations'

const locationsStore = useLocationsStore()

watchEffect(() => {
  if (locationsStore.locations.length === 0) {
    locationsStore.loadMockLocations()
  }
})

//const locations = locationsStore.locations
const locations = computed(() => locationsStore.locations)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Zip Code', key: 'zipCode' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const showDialog = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editedLocation = ref<Location>({ id: 0, name: '', zipCode: '' })

const openAddDialog = () => {
  editedLocation.value = { id: 0, name: '', zipCode: '' }
  isEditMode.value = false
  showDialog.value = true
}

const openEditDialog = (location: Location) => {
  editedLocation.value = { ...location }
  isEditMode.value = true
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editedLocation.value = { id: 0, name: '', zipCode: '' }
}

const handleSave = () => {
  if (!editedLocation.value.name.trim() || !editedLocation.value.zipCode.trim()) return

  if (isEditMode.value) {
    locationsStore.updateLocation(editedLocation.value.id, {
      name: editedLocation.value.name,
      zipCode: editedLocation.value.zipCode
    })
  } else {
    locationsStore.addLocation({
      id: Date.now(),
      name: editedLocation.value.name,
      zipCode: editedLocation.value.zipCode
    })
  }

  closeDialog()
}

const handleDelete = (id: number) => {
  if (confirm('Are you sure you want to delete this location?')) {
    locationsStore.removeLocation(id)
  }
}
</script>
