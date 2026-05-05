<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Programs</h1>
        <div class="app-page-subtitle">
          {{ programs.length }} {{ programs.length === 1 ? 'program' : 'programs' }} configured
        </div>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Program
      </v-btn>
    </div>

    <v-card class="app-card" elevation="0">
      <v-data-table
        :headers="headers"
        :items="programs"
        class="app-table"
        item-value="id"
        density="comfortable"
      >
        <template #item.price="{ item }">
          <span class="font-weight-bold">${{ item.price.toFixed(2) }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-tooltip text="Edit" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="openEditDialog(item)" />
              </template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="handleDelete(item.id)" />
              </template>
            </v-tooltip>
          </div>
        </template>
        <template #no-data>
          <div class="app-empty-state py-8">
            <v-icon>mdi-school-outline</v-icon>
            <div class="text-subtitle-2 font-weight-medium">No programs yet</div>
            <div class="text-body-2 mt-1">Click “Add Program” to create the first one.</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showDialog" max-width="500" persistent>
      <v-card class="pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="primary">{{ isEditing ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline' }}</v-icon>
          <span>{{ isEditing ? 'Edit Program' : 'New Program' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="showDialog = false" />
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="handleSave" ref="formRef" class="d-flex flex-column ga-4">
            <v-text-field v-model="editedProgram.name" label="Name" required />
            <v-textarea v-model="editedProgram.description" label="Description" rows="3" auto-grow required />
            <v-text-field v-model.number="editedProgram.price" label="Price" type="number" prefix="$" required />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="handleSave">
            {{ isEditing ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useProgramsStore } from '@/stores/programs/programs'
import type { Program } from '@/stores/programs/programs'

const programsStore = useProgramsStore()

watchEffect(() => {
  if (programsStore.programs.length === 0) {
    programsStore.loadMockPrograms()
  }
})

const programs = computed(() => programsStore.programs)

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Price', key: 'price', align: 'end' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 120 },
]

const showDialog = ref(false)
const isEditing = ref(false)
const editedProgram = ref<Program>({
  id: 0,
  name: '',
  description: '',
  price: 0,
  isActive: true,
})

const formRef = ref()

const resetForm = () => {
  editedProgram.value = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    isActive: true,
  }
  isEditing.value = false
}

const openAddDialog = () => {
  resetForm()
  showDialog.value = true
}

const openEditDialog = (program: Program) => {
  editedProgram.value = { ...program }
  isEditing.value = true
  showDialog.value = true
}

const handleSave = () => {
  if (!editedProgram.value.name || !editedProgram.value.description || editedProgram.value.price <= 0) return

  if (isEditing.value) {
    programsStore.updateProgram(editedProgram.value.id, { ...editedProgram.value })
  } else {
    programsStore.addProgram({
      ...editedProgram.value,
      id: Date.now(),
    })
  }

  resetForm()
  showDialog.value = false
}

const handleDelete = (id: number) => {
  programsStore.removeProgram(id)
}
</script>
