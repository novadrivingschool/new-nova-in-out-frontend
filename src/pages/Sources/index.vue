<template>
  <v-container>
    <v-card elevation="2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Sources</span>
        <v-btn color="primary" @click="openAddDialog" size="small">Add Source</v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="sources"
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

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ isEditMode ? 'Edit Source' : 'New Source' }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedSource.name" label="Name" required />
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
import { useSourcesStore } from '@/stores/sources/sources'
import type { Source } from '@/stores/sources/sources'

const sourcesStore = useSourcesStore()

watchEffect(() => {
  if (sourcesStore.sources.length === 0) {
    sourcesStore.loadMockSources()
  }
})

//const sources = sourcesStore.sources
const sources = computed(() => sourcesStore.sources)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const showDialog = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editedSource = ref<Source>({ id: 0, name: '' })

const openAddDialog = () => {
  editedSource.value = { id: 0, name: '' }
  isEditMode.value = false
  showDialog.value = true
}

const openEditDialog = (source: Source) => {
  editedSource.value = { ...source }
  isEditMode.value = true
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editedSource.value = { id: 0, name: '' }
}

const handleSave = () => {
  if (!editedSource.value.name.trim()) return

  if (isEditMode.value) {
    sourcesStore.updateSource(editedSource.value.id, { name: editedSource.value.name })
  } else {
    sourcesStore.addSource({
      id: Date.now(),
      name: editedSource.value.name,
    })
  }

  closeDialog()
}

const handleDelete = (id: number) => {
  if (confirm('Are you sure you want to delete this source?')) {
    sourcesStore.removeSource(id)
  }
}
</script>
