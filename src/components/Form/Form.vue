<template>
    <v-container class="py-8" style="max-width: 880px;">
        <v-card elevation="2" class="pa-6 rounded-lg">
            <v-card-title class="text-h6 font-weight-bold mb-4 text-primary">
                {{
                    itemToEdit
                        ? itemToEdit.lost
                            ? `Lost ${formatType(itemToEdit.type)}`
                            : itemToEdit.convertTo
                                ? `Convert to ${formatConvertType(itemToEdit.convertTo)}`
                                : 'Edit Record'
                        : 'New Record'
                }}
            </v-card-title>

            <v-form @submit.prevent="handleSave" ref="formRef" v-model="isValid">
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.name" label="First Name" required variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.lastName" label="Last Name" required variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.email" label="Email" type="email" variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.phone" label="Phone" variant="underlined" :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.phone2" label="Phone 2" variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-select v-model="form.source" :items="sources" item-title="name" item-value="name"
                            label="Source" variant="underlined" :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-select v-model="form.location" :items="locations" item-title="name" item-value="name"
                            label="Location" variant="underlined" :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-select v-model="form.language" :items="['English', 'Spanish', 'Other']" label="Language"
                            variant="underlined" :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6" v-if="form.language === 'Other'">
                        <v-text-field v-model="form.otherLanguage" label="Other Language" variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-select v-model="form.programsOffered" :items="programs" item-title="name" item-value="name"
                            label="Programs Offered" multiple chips variant="underlined" :rules="[
                                value =>
                                    (value && value.length > 0) || 'At least one program is required',
                            ]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-select v-model="form.type" :items="['LEAD', 'CONTACT', 'DEAL']" label="Type"
                            variant="underlined" :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12">
                        <v-textarea v-model="form.notes" label="Notes" rows="2" auto-grow variant="underlined"
                            :rules="[requiredRule]" />
                    </v-col>

                    <v-col cols="12" sm="6">
                        <v-menu v-model="reminderMenu" :close-on-content-click="false" transition="scale-transition"
                            offset-y max-width="290px" min-width="290px">
                            <template #activator="{ props }">
                                <v-text-field v-model="form.reminder" label="Reminder" readonly v-bind="props"
                                    variant="underlined" :rules="[requiredRule]" />
                            </template>
                            <v-date-picker :model-value="form.reminder" @update:model-value="onReminderChange"
                                color="primary" />
                        </v-menu>
                    </v-col>

                    <v-col cols="12" v-if="itemToEdit && itemToEdit.lost">
                        <v-select v-model="form.notSoldReason" :items="notSoldReasons" item-title="name" item-value="name"
                            label="Reason Not Sold" variant="underlined" :rules="[requiredRule]" clearable />
                    </v-col>

                </v-row>

                <v-card-actions class="mt-6 justify-end">
                    <v-btn color="primary" variant="elevated" @click="handleSave">
                        Save
                    </v-btn>
                    <v-btn text @click="cancelForm">Cancel</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, watch, toRaw } from 'vue'
import type { Lead } from '@/stores/leads/leads'
import type { Program } from '@/stores/programs/programs';

const props = defineProps<{
    itemToEdit: Lead | null
    programs: Program[]
    sources: { name: string }[]
    locations: { name: string }[]
    notSoldReasons: { name: string }[]
}>();

const emit = defineEmits<{
    (e: 'saved', payload: Lead): void
    (e: 'cancel'): void
}>()

const formRef = ref()
const isValid = ref(true)
const reminderMenu = ref(false)

const requiredRule = (value: any) => !!value || 'This field is required'

const form = ref<Partial<Lead>>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    phone2: '',
    source: '',
    location: '',
    language: '',
    otherLanguage: '',
    programsOffered: [],
    notes: '',
    reminder: '',
    type: '',
    notSoldReason: '',
})

// Cuando cambia itemToEdit, actualizar el form
watch(
    () => props.itemToEdit,
    (newVal) => {
        console.log('itemToEdit changed:', newVal)
        if (newVal) {
            // Copiar valores para evitar mutaciones directas
            form.value = {
                name: newVal.name || '',
                lastName: newVal.lastName || '',
                email: newVal.email || '',
                phone: newVal.phone || '',
                phone2: newVal.phone2 || '',
                source: newVal.source || '',
                location: newVal.location || '',
                language: newVal.language || '',
                otherLanguage: newVal.otherLanguage || '',
                programsOffered: newVal.programsOffered || [],
                notes: newVal.notes || '',
                reminder: newVal.reminder || '',
                type: newVal.hasOwnProperty('convertTo') ? newVal.convertTo : (newVal.type || ''),
                notSoldReason: newVal.notSoldReason || '',
            }
        } else {
            // Si no hay itemToEdit (nuevo registro), resetear form
            form.value = {
                name: '',
                lastName: '',
                email: '',
                phone: '',
                phone2: '',
                source: '',
                location: '',
                language: '',
                otherLanguage: '',
                programsOffered: [],
                notes: '',
                reminder: '',
                type: '',
                notSoldReason: '',
            }
        }
    },
    { immediate: true }
)

const handleSave = () => {
    formRef.value?.validate().then((result: { valid: any; }) => {
        if (!result.valid) {
            console.warn('Form validation failed.')
            return
        }
        const savedData = {
            ...(props.itemToEdit || {}),
            ...toRaw(form.value),
        }
        // Ensure id is a number if present, otherwise remove it
        if ('id' in savedData && typeof savedData.id !== 'number') {
            delete savedData.id
        }
        emit('saved', savedData as Lead)
    })

}

const onReminderChange = (date: string) => {
    form.value.reminder = date
    reminderMenu.value = false
}

const cancelForm = () => {
    emit('cancel')
}

const formatConvertType = (type: any) => {
    switch (type) {
        case 'CONTACT': return 'Contact'
        case 'DEAL': return 'Deal'
        case 'DEAL_WON': return 'Deal Won'
        default: return type
    }
}

const formatType = (type: any) => {
    switch (type) {
        case 'lead': return 'Lead'
        case 'contact': return 'Contact'
        case 'deal': return 'Deal'
        default: return type
    }
}
</script>

<style scoped>
.v-card-title {
    padding-bottom: 16px;
    border-bottom: 1px solid #444;
}
</style>
