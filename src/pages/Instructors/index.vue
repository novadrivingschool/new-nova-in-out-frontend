<template>
    <v-container>
        <v-card elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h6">Instructors</span>
                <v-btn color="primary" @click="openDialogForNew" size="small">
                    Add Instructor
                </v-btn>
            </v-card-title>

            <v-data-table :headers="headers" :items="instructors" class="elevation-1" item-value="id"
                density="comfortable">
                <template #item.languages="{ item }">
                    {{ item.languages.join(', ') }}
                </template>

                <template #item.assignedPrograms="{ item }">
                    <span v-if="item.assignedPrograms.length === 0">None</span>
                    <span v-else>
                        {{item.assignedPrograms.map(p => p.name).join(', ')}}
                    </span>
                </template>

                <template #item.actions="{ item }">
                    <div class="d-flex align-center" style="gap: 8px;">
                        <v-icon @click="openDialogForEdit(item)" class="cursor-pointer">
                            mdi-pencil
                        </v-icon>
                        <v-icon @click="handleDelete(item.id)" class="cursor-pointer" color="red">
                            mdi-delete
                        </v-icon>
                    </div>
                </template>

            </v-data-table>
        </v-card>

        <v-dialog v-model="showDialog" max-width="600">
            <v-card>
                <v-card-title class="text-h6">{{ isEditing ? 'Edit Instructor' : 'New Instructor' }}</v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="handleSave" ref="formRef">
                        <v-text-field v-model="currentInstructor.name" label="Name" required />
                        <v-text-field v-model="currentInstructor.lastName" label="Last Name" required />
                        <v-text-field v-model="currentInstructor.email" label="Email" required type="email" />
                        <v-text-field v-model="currentInstructor.phone" label="Phone" required />
                        <v-text-field v-model="currentInstructor.expertise" label="Expertise" required />
                        <v-text-field v-model="languagesInput" label="Languages (comma separated)"
                            placeholder="e.g. English, Spanish" />
                    </v-form>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn text @click="closeDialog">Cancel</v-btn>
                    <v-btn color="primary" @click="handleSave">Save</v-btn>
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

//const instructors = instructorsStore.instructors
const instructors = computed(() => instructorsStore.instructors)

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Name', key: 'name' },
    { title: 'Last Name', key: 'lastName' },
    { title: 'Email', key: 'email' },
    { title: 'Phone', key: 'phone' },
    { title: 'Expertise', key: 'expertise' },
    { title: 'Languages', key: 'languages' },
    { title: 'Assigned Programs', key: 'assignedPrograms' },
    { title: 'Actions', key: 'actions', sortable: false },
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
