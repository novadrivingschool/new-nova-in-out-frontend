<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Sources</h1>
        <div class="app-page-subtitle">
          {{ sources.length }} {{ sources.length === 1 ? 'source' : 'sources' }} available
        </div>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
        Add Source
      </v-btn>
    </div>

    <v-card class="app-card" elevation="0">
      <v-data-table
        :headers="headers"
        :items="sources"
        class="app-table"
        item-value="id"
        density="comfortable"
      >
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
            <v-icon>mdi-source-branch</v-icon>
            <div class="text-subtitle-2 font-weight-medium">No sources yet</div>
            <div class="text-body-2 mt-1">Click “Add Source” to create the first one.</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showDialog" max-width="420" persistent>
      <v-card class="pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="primary">{{ isEditMode ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline' }}</v-icon>
          <span>{{ isEditMode ? 'Edit Source' : 'New Source' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="handleSave" ref="formRef">
            <v-text-field v-model="editedSource.name" label="Name" required />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="handleSave">
            {{ isEditMode ? 'Update' : 'Save' }}
          </v-btn>
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

const sources = computed(() => sourcesStore.sources)

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Name', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 120 }
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
