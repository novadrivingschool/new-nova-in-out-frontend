<template>
    <v-container class="py-8" style="max-width: 880px;">
        <v-card elevation="2" class="pa-6 rounded-lg">
            <v-card-title class="text-h6 font-weight-bold mb-4 text-primary">
                New Record
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
                            label="Programs Offered" multiple chips variant="underlined"
                            :rules="[value => (value && value.length > 0) || 'At least one program is required']" />
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
                            <v-date-picker :model-value="form.reminder" @update:model-value="date => {
                                const d = new Date(date)
                                const yyyy = d.getFullYear()
                                const mm = String(d.getMonth() + 1).padStart(2, '0')
                                const dd = String(d.getDate()).padStart(2, '0')
                                form.reminder = `${yyyy}-${mm}-${dd}`
                                reminderMenu = false
                            }" color="primary" />
                        </v-menu>
                    </v-col>



                </v-row>

                <v-card-actions class="mt-6 justify-end">
                    <v-btn color="primary" variant="elevated" @click="handleSave">
                        Save
                    </v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProgramsStore } from '@/stores/programs/programs'
import { useSourcesStore } from '@/stores/sources/sources'
import { useLocationsStore } from '@/stores/locations/locations'
import type { Lead } from '@/stores/leads/leads'

const formRef = ref()
const isValid = ref(true)
const reminderMenu = ref(false)

const requiredRule = (value: any) => !!value || 'This field is required'

const form = ref<Partial<Lead>>({
    name: '',
    lastName: '',
    source: '',
    location: '',
    /* age: 0, */
    programsOffered: [],
    programsSold: [],
    notes: '',
    reminder: '',
    phone: '',
    phone2: '',
    email: '',
    language: '',
    otherLanguage: '',
    followUp: [],
    assignedTo: [],
    type: ''
})

const programsStore = useProgramsStore()
const sourcesStore = useSourcesStore()
const locationsStore = useLocationsStore()

onMounted(() => {
    programsStore.loadMockPrograms()
    sourcesStore.loadMockSources()
    locationsStore.loadMockLocations()
})

const programs = programsStore.programs
const sources = sourcesStore.sources
const locations = locationsStore.locations

const handleSave = () => {
    formRef.value?.validate().then((res: boolean) => {
        if (res) {
            console.log('Submitted:', form.value)
            // dispatch to Pinia or API
        } else {
            console.warn('Form validation failed.')
        }
    })
}

const onReminderChange = (date: string) => {
    // date is already 'YYYY-MM-DD' from Vuetify
    form.value.reminder = date
    reminderMenu.value = false
}

</script>

<style scoped>
.v-card-title {
    padding-bottom: 16px;
    border-bottom: 1px solid #444;
}
</style>
