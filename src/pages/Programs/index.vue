<template>
  <v-container>
    <v-card elevation="2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Programs</span>
        <v-btn color="primary" @click="openAddDialog" size="small">
          Add Program
        </v-btn>
      </v-card-title>

      <v-data-table :headers="headers" :items="programs" class="elevation-1" item-value="id" density="comfortable">
        <template #item.price="{ item }">
          ${{ item.price.toFixed(2) }}
        </template>
        <template #item.actions="{ item }">
          <v-icon class="mr-2" style="cursor: pointer;" @click="openEditDialog(item)" title="Edit">
            mdi-pencil
          </v-icon>
          <v-icon color="red" style="cursor: pointer;" @click="handleDelete(item.id)" title="Delete">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Edit Program' : 'New Program' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedProgram.name" label="Name" required />
            <v-textarea v-model="editedProgram.description" label="Description" required />
            <v-text-field v-model.number="editedProgram.price" label="Price" type="number" required />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="showDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="handleSave">
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

//const programs = programsStore.programs
const programs = computed(() => programsStore.programs)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Price', key: 'price' },
  { title: 'Actions', key: 'actions', sortable: false },
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
