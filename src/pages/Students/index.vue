<template>
    <v-container fluid class="app-page">
        <div class="app-page-header">
            <div>
                <h1 class="app-page-title">Students</h1>
                <div class="app-page-subtitle">
                    {{ students.length }} {{ students.length === 1 ? 'student' : 'students' }} registered
                </div>
            </div>

            <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
                Add Student
            </v-btn>
        </div>

        <v-card class="app-card" elevation="0">
            <v-data-table :headers="headers" :items="students" class="app-table" item-value="id"
                density="comfortable">
                <template #item.fullName="{ item }">
                    <div class="d-flex align-center ga-3">
                        <v-avatar size="32" color="primary" class="text-white text-caption font-weight-bold">
                            {{ (item.name?.[0] || '?').toUpperCase() }}
                        </v-avatar>
                        <span class="font-weight-medium">{{ item.name }} {{ item.lastName }}</span>
                    </div>
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
                        <v-icon>mdi-account-multiple-outline</v-icon>
                        <div class="text-subtitle-2 font-weight-medium">No students yet</div>
                        <div class="text-body-2 mt-1">Click “Add Student” to register the first one.</div>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <v-dialog v-model="showDialog" max-width="520" persistent>
            <v-card class="pa-2">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">{{ isEditing ? 'mdi-pencil-outline' : 'mdi-account-plus-outline' }}</v-icon>
                    <span>{{ isEditing ? 'Edit Student' : 'New Student' }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="showDialog = false" />
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-form @submit.prevent="handleSave" ref="formRef" class="d-flex flex-column ga-4">
                        <div class="d-flex ga-3 flex-wrap flex-sm-nowrap">
                            <v-text-field v-model="editedStudent.name" label="First Name" required class="flex-grow-1" />
                            <v-text-field v-model="editedStudent.lastName" label="Last Name" required class="flex-grow-1" />
                        </div>
                        <v-text-field v-model="editedStudent.email" label="Email" type="email" required prepend-inner-icon="mdi-email-outline" />
                        <v-text-field v-model="editedStudent.phone" label="Phone" required prepend-inner-icon="mdi-phone-outline" />
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
import { useStudentsStore } from '@/stores/students/students'
import type { Student } from '@/stores/students/students'

const studentsStore = useStudentsStore()

watchEffect(() => {
    if (studentsStore.students.length === 0) {
        studentsStore.loadMockStudents()
    }
})

const students = computed(() => studentsStore.students)

const headers = [
    { title: 'ID', key: 'id', width: 80 },
    { title: 'Full Name', key: 'fullName' },
    { title: 'Email', key: 'email' },
    { title: 'Phone', key: 'phone' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 120 }
]

const showDialog = ref(false)
const isEditing = ref(false)
const editedStudent = ref<Student>({
    id: 0,
    name: '',
    lastName: '',
    email: '',
    phone: '',
    enrolledPrograms: [],
    progress: {}
})

const formRef = ref()

const resetForm = () => {
    editedStudent.value = {
        id: 0,
        name: '',
        lastName: '',
        email: '',
        phone: '',
        enrolledPrograms: [],
        progress: {}
    }
    isEditing.value = false
}

const openAddDialog = () => {
    resetForm()
    showDialog.value = true
}

const openEditDialog = (student: Student) => {
    editedStudent.value = { ...student }
    isEditing.value = true
    showDialog.value = true
}

const handleSave = () => {
    if (
        !editedStudent.value.name.trim() ||
        !editedStudent.value.lastName.trim() ||
        !editedStudent.value.email.trim() ||
        !editedStudent.value.phone.trim()
    ) return

    if (isEditing.value) {
        studentsStore.updateStudent(editedStudent.value)
    } else {
        studentsStore.addStudent({
            ...editedStudent.value,
            id: Date.now(),
            enrolledPrograms: [],
            progress: {}
        })
    }

    resetForm()
    showDialog.value = false
}

const handleDelete = (id: number) => {
    studentsStore.removeStudent(id)
}
</script>
