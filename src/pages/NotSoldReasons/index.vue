<template>
  <v-container>
    <v-card elevation="2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Not Sold Reasons</span>
        <v-btn color="primary" @click="openAddDialog" size="small">
          Add Reason
        </v-btn>
      </v-card-title>

      <v-data-table :headers="headers" :items="reasons" class="elevation-1" item-value="id" density="comfortable">
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

    <v-dialog v-model="showDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Edit Reason' : 'New Reason' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedReason.name" label="Name" required />
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
import { useNotSoldReasonsStore } from '@/stores/notSoldReasons/notSoldReasons'
import type { NotSoldReason } from '@/stores/notSoldReasons/notSoldReasons'

const reasonsStore = useNotSoldReasonsStore()

watchEffect(() => {
  if (reasonsStore.reasons.length === 0) {
    reasonsStore.loadMockReasons()
  }
})

//const reasons = reasonsStore.reasons
const reasons = computed(() => reasonsStore.reasons)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false },
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
