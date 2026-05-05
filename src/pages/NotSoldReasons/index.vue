<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Not Sold Reasons</h1>
        <div class="app-page-subtitle">
          {{ reasons.length }} {{ reasons.length === 1 ? 'reason' : 'reasons' }} configured
        </div>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Reason
      </v-btn>
    </div>

    <v-card class="app-card" elevation="0">
      <v-data-table :headers="headers" :items="reasons" class="app-table" item-value="id" density="comfortable">
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
            <v-icon>mdi-comment-question-outline</v-icon>
            <div class="text-subtitle-2 font-weight-medium">No reasons yet</div>
            <div class="text-body-2 mt-1">Click “Add Reason” to create the first one.</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showDialog" max-width="420" persistent>
      <v-card class="pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="primary">{{ isEditing ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline' }}</v-icon>
          <span>{{ isEditing ? 'Edit Reason' : 'New Reason' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="showDialog = false" />
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedReason.name" label="Name" required />
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
import { useNotSoldReasonsStore } from '@/stores/notSoldReasons/notSoldReasons'
import type { NotSoldReason } from '@/stores/notSoldReasons/notSoldReasons'

const reasonsStore = useNotSoldReasonsStore()

watchEffect(() => {
  if (reasonsStore.reasons.length === 0) {
    reasonsStore.loadMockReasons()
  }
})

const reasons = computed(() => reasonsStore.reasons)

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Name', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 120 },
]

const showDialog = ref(false)
const isEditing = ref(false)
const editedReason = ref<NotSoldReason>({
  id: 0,
  name: '',
})

const formRef = ref()

const resetForm = () => {
  editedReason.value = {
    id: 0,
    name: '',
  }
  isEditing.value = false
}

const openAddDialog = () => {
  resetForm()
  showDialog.value = true
}

const openEditDialog = (reason: NotSoldReason) => {
  editedReason.value = { ...reason }
  isEditing.value = true
  showDialog.value = true
}

const handleSave = () => {
  if (!editedReason.value.name) return

  if (isEditing.value) {
    reasonsStore.updateReason(editedReason.value.id, { ...editedReason.value })
  } else {
    reasonsStore.addReason({
      ...editedReason.value,
      id: Date.now(),
    })
  }

  resetForm()
  showDialog.value = false
}

const handleDelete = (id: number) => {
  reasonsStore.removeReason(id)
}
</script>
