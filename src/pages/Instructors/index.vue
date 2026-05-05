<template>
    <v-container fluid class="app-page">
        <div class="app-page-header">
            <div>
                <h1 class="app-page-title">Instructors</h1>
                <div class="app-page-subtitle">
                    {{ instructors.length }} {{ instructors.length === 1 ? 'instructor' : 'instructors' }} on staff
                </div>
            </div>

            <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialogForNew">
                Add Instructor
            </v-btn>
        </div>

        <v-card class="app-card" elevation="0">
            <v-data-table :headers="headers" :items="instructors" class="app-table" item-value="id"
                density="comfortable">
                <template #item.languages="{ item }">
                    <div class="d-flex flex-wrap ga-1">
                        <v-chip
                            v-for="lang in item.languages"
                            :key="lang"
                            size="x-small"
                            variant="tonal"
                            color="info"
                        >
                            {{ lang }}
                        </v-chip>
                    </div>
                </template>

                <template #item.assignedPrograms="{ item }">
                    <span v-if="item.assignedPrograms.length === 0" class="text-medium-emphasis">None</span>
                    <div v-else class="d-flex flex-wrap ga-1">
                        <v-chip
                            v-for="p in item.assignedPrograms"
                            :key="p.id"
                            size="x-small"
                            variant="tonal"
                            color="primary"
                        >
                            {{ p.name }}
                        </v-chip>
                    </div>
                </template>

                <template #item.actions="{ item }">
                    <div class="d-flex align-center ga-1">
                        <v-tooltip text="Edit" location="top">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="openDialogForEdit(item)" />
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
                        <v-icon>mdi-account-tie-outline</v-icon>
                        <div class="text-subtitle-2 font-weight-medium">No instructors yet</div>
                        <div class="text-body-2 mt-1">Click “Add Instructor” to register the first one.</div>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <v-dialog v-model="showDialog" max-width="640" persistent>
            <v-card class="pa-2">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">{{ isEditing ? 'mdi-pencil-outline' : 'mdi-account-tie' }}</v-icon>
                    <span>{{ isEditing ? 'Edit Instructor' : 'New Instructor' }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-form @submit.prevent="handleSave" ref="formRef" class="d-flex flex-column ga-4">
                        <div class="d-flex ga-3 flex-wrap flex-sm-nowrap">
                            <v-text-field v-model="currentInstructor.name" label="Name" required class="flex-grow-1" />
                            <v-text-field v-model="currentInstructor.lastName" label="Last Name" required class="flex-grow-1" />
                        </div>
                        <v-text-field v-model="currentInstructor.email" label="Email" required type="email" prepend-inner-icon="mdi-email-outline" />
                        <v-text-field v-model="currentInstructor.phone" label="Phone" required prepend-inner-icon="mdi-phone-outline" />
                        <v-text-field v-model="currentInstructor.expertise" label="Expertise" required prepend-inner-icon="mdi-star-outline" />
                        <v-text-field v-model="languagesInput" label="Languages (comma separated)"
                            placeholder="e.g. English, Spanish" prepend-inner-icon="mdi-translate" />
                    </v-form>
                </v-card-text>
                <v-card-actions class="px-6 pb-4 ga-2">
                    <v-spacer />
                    <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
                    <v-btn color="primary" variant="flat" @click="handleSave">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useInstructorsStore } from '@/stores/instructors/instructors'
import type { Instructor } from '@/stores/instructors/instructors'

const instructorsStore = useInstructorsStore()

watchEffect(() => {
    if (instructorsStore.instructors.length === 0) {
        instructorsStore.loadMockData()
    }
})

const instructors = computed(() => instructorsStore.instructors)

const headers = [
    { title: 'ID', key: 'id', width: 80 },
    { title: 'Name', key: 'name' },
    { title: 'Last Name', key: 'lastName' },
    { title: 'Email', key: 'email' },
    { title: 'Phone', key: 'phone' },
    { title: 'Expertise', key: 'expertise' },
    { title: 'Languages', key: 'languages' },
    { title: 'Assigned Programs', key: 'assignedPrograms' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 120 },
]

const showDialog = ref(false)
const formRef = ref()

const isEditing = ref(false)

const emptyInstructor = (): Omit<Instructor, 'id' | 'assignedPrograms'> => ({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    expertise: '',
    languages: []
})

const currentInstructor = ref<Omit<Instructor, 'id' | 'assignedPrograms'>>(emptyInstructor())

const languagesInput = ref('')

function openDialogForNew() {
    isEditing.value = false
    currentInstructor.value = emptyInstructor()
    languagesInput.value = ''
    showDialog.value = true
}

function openDialogForEdit(instructor: Instructor) {
    isEditing.value = true
    currentInstructor.value = {
        name: instructor.name,
        lastName: instructor.lastName,
        email: instructor.email,
        phone: instructor.phone,
        expertise: instructor.expertise,
        languages: [...instructor.languages]
    }
    languagesInput.value = instructor.languages.join(', ')
    showDialog.value = true
}

function handleSave() {
    if (
        !currentInstructor.value.name.trim() ||
        !currentInstructor.value.lastName.trim() ||
        !currentInstructor.value.email.trim() ||
        !currentInstructor.value.phone.trim() ||
        !currentInstructor.value.expertise.trim()
    ) return

    const langs = languagesInput.value
        .split(',')
        .map(l => l.trim())
        .filter(l => l.length > 0)

    if (isEditing.value) {
        const original = instructorsStore.instructors.find(i => i.email === currentInstructor.value.email)
        instructorsStore.updateInstructor({
            id: original?.id ?? Date.now(),
            ...currentInstructor.value,
            languages: langs,
            assignedPrograms: original?.assignedPrograms ?? []
        })
    } else {
        instructorsStore.addInstructor({
            id: Date.now(),
            ...currentInstructor.value,
            languages: langs,
            assignedPrograms: []
        })
    }

    closeDialog()
}

function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this instructor?')) {
        instructorsStore.deleteInstructor(id)
    }
}

function closeDialog() {
    showDialog.value = false
    currentInstructor.value = emptyInstructor()
    languagesInput.value = ''
}
</script>
