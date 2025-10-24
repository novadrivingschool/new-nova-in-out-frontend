<template>
    <v-container>
        <v-card elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h6">Students</span>
                <v-btn color="primary" @click="openAddDialog" size="small">
                    Add Student
                </v-btn>
            </v-card-title>

            <v-data-table :headers="headers" :items="students" class="elevation-1" item-value="id"
                density="comfortable">
                <template #item.fullName="{ item }">
                    {{ item.name }} {{ item.lastName }}
                </template>
                <template #item.actions="{ item }">
                    <v-icon style="cursor: pointer; margin-right: 8px;" @click="openEditDialog(item)" title="Edit">
                        mdi-pencil
                    </v-icon>
                    <v-icon style="cursor: pointer;" color="red" @click="handleDelete(item.id)" title="Delete">
                        mdi-delete
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>

        <v-dialog v-model="showDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">
                    {{ isEditing ? 'Edit Student' : 'New Student' }}
                </v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="handleSave" ref="formRef">
                        <v-text-field v-model="editedStudent.name" label="First Name" required />
                        <v-text-field v-model="editedStudent.lastName" label="Last Name" required />
                        <v-text-field v-model="editedStudent.email" label="Email" type="email" required />
                        <v-text-field v-model="editedStudent.phone" label="Phone" required />
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
import { useStudentsStore } from '@/stores/students/students'
import type { Student } from '@/stores/students/students'

const studentsStore = useStudentsStore()

watchEffect(() => {
    if (studentsStore.students.length === 0) {
        studentsStore.loadMockStudents()
    }
})

//const students = studentsStore.students
const students = computed(() => studentsStore.students)

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Full Name', key: 'fullName' },
    { title: 'Email', key: 'email' },
    { title: 'Phone', key: 'phone' },
    { title: 'Actions', key: 'actions', sortable: false }
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
