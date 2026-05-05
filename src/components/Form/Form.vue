<template>
    <v-card class="app-card pa-2" elevation="0">
        <v-card-title class="d-flex align-center ga-2 px-6 pt-5">
            <v-icon color="primary">
                {{
                    itemToEdit
                        ? itemToEdit.lost
                            ? 'mdi-close-circle-outline'
                            : itemToEdit.convertTo
                                ? 'mdi-compare-horizontal'
                                : 'mdi-pencil-outline'
                        : 'mdi-plus-circle-outline'
                }}
            </v-icon>
            <span class="text-h6 font-weight-bold">
                {{
                    itemToEdit
                        ? itemToEdit.lost
                            ? `Lost ${formatType(itemToEdit.type)}`
                            : itemToEdit.convertTo
                                ? `Convert to ${formatConvertType(itemToEdit.convertTo)}`
                                : 'Edit Record'
                        : 'New Record'
                }}
            </span>
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" size="small" @click="cancelForm" />
        </v-card-title>
        <v-divider />

        <v-card-text class="px-6 pt-5 pb-2">
            <v-form @submit.prevent="handleSave" ref="formRef" v-model="isValid">
                <div class="form-section-label">Personal information</div>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.name" label="First Name" required
                            :rules="[requiredRule]" prepend-inner-icon="mdi-account-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.lastName" label="Last Name" required
                            :rules="[requiredRule]" />
                    </v-col>
                </v-row>

                <div class="form-section-label mt-4">Contact</div>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.email" label="Email" type="email"
                            :rules="[requiredRule]" prepend-inner-icon="mdi-email-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.phone" label="Phone"
                            :rules="[requiredRule]" prepend-inner-icon="mdi-phone-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.phone2" label="Phone 2"
                            :rules="[requiredRule]" prepend-inner-icon="mdi-phone-plus-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.language" :items="['English', 'Spanish', 'Other']" label="Language"
                            :rules="[requiredRule]" prepend-inner-icon="mdi-translate" />
                    </v-col>
                    <v-col cols="12" sm="6" v-if="form.language === 'Other'">
                        <v-text-field v-model="form.otherLanguage" label="Other Language"
                            :rules="[requiredRule]" />
                    </v-col>
                </v-row>

                <div class="form-section-label mt-4">Origin & classification</div>
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.source" :items="sources" item-title="name" item-value="name"
                            label="Source" :rules="[requiredRule]" prepend-inner-icon="mdi-source-branch" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.location" :items="locations" item-title="name" item-value="name"
                            label="Location" :rules="[requiredRule]" prepend-inner-icon="mdi-map-marker-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select v-model="form.type" :items="['LEAD', 'CONTACT', 'DEAL']" label="Type"
                            :rules="[requiredRule]" prepend-inner-icon="mdi-tag-outline" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-menu v-model="reminderMenu" :close-on-content-click="false" transition="scale-transition"
                            offset-y max-width="290px" min-width="290px">
                            <template #activator="{ props }">
                                <v-text-field v-model="form.reminder" label="Reminder" readonly v-bind="props"
                                    :rules="[requiredRule]" prepend-inner-icon="mdi-calendar-clock-outline" />
                            </template>
                            <v-date-picker :model-value="form.reminder" @update:model-value="onReminderChange"
                                color="primary" />
                        </v-menu>
                    </v-col>
                </v-row>

                <div class="form-section-label mt-4">Programs</div>
                <v-row dense>
                    <v-col cols="12">
                        <v-select v-model="form.programsOffered" :items="programs" item-title="name" item-value="name"
                            label="Programs Offered" multiple chips closable-chips :rules="[
                                value =>
                                    (value && value.length > 0) || 'At least one program is required',
                            ]" prepend-inner-icon="mdi-school-outline" />
                    </v-col>
                </v-row>

                <div class="form-section-label mt-4">Notes</div>
                <v-row dense>
                    <v-col cols="12">
                        <v-textarea v-model="form.notes" label="Notes" rows="3" auto-grow
                            :rules="[requiredRule]" />
                    </v-col>
                </v-row>

                <template v-if="itemToEdit && itemToEdit.lost">
                    <div class="form-section-label mt-4">Reason</div>
                    <v-row dense>
                        <v-col cols="12">
                            <v-select v-model="form.notSoldReason" :items="notSoldReasons" item-title="name" item-value="name"
                                label="Reason Not Sold" :rules="[requiredRule]" clearable
                                prepend-inner-icon="mdi-comment-question-outline" />
                        </v-col>
                    </v-row>
                </template>
            </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-6 py-4 ga-2">
            <v-spacer />
            <v-btn variant="text" @click="cancelForm">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="handleSave" prepend-icon="mdi-content-save-outline">
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
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

watch(
    () => props.itemToEdit,
    (newVal) => {
        console.log('itemToEdit changed:', newVal)
        if (newVal) {
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
.form-section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgb(var(--v-theme-on-surface-variant));
    margin-bottom: 8px;
}
</style>
