<template>
    <v-container fluid class="app-page">
        <!-- HEADER de página -->
        <div class="app-page-header">
            <div>
                <h1 class="app-page-title">{{ title }}</h1>
                <div class="app-page-subtitle">
                    {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'record' : 'records' }}
                </div>
            </div>

            <div class="app-toolbar">
                <!-- Toggle vista -->
                <v-btn-toggle v-model="viewMode" mandatory density="comfortable" divided rounded="lg" color="primary" variant="outlined">
                    <v-btn value="table" size="small">
                        <v-icon start icon="mdi-table" /> Table
                    </v-btn>
                    <v-btn value="card" size="small">
                        <v-icon start icon="mdi-view-grid" /> Cards
                    </v-btn>
                </v-btn-toggle>

                <v-btn variant="text" density="comfortable" prepend-icon="mdi-refresh" @click="refresh">
                    Refresh
                </v-btn>

                <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
                    Add New
                </v-btn>
            </div>
        </div>

        <!-- FILTROS -->
        <v-card class="app-card mb-5 pa-4 pa-sm-5" elevation="0">
            <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="primary" size="20">mdi-filter-variant</v-icon>
                <span class="text-subtitle-2 font-weight-bold">Filters</span>
                <v-spacer />
                <v-btn
                    variant="text"
                    size="small"
                    @click="applyFilters"
                    color="primary"
                >
                    Apply
                </v-btn>
            </div>

            <div class="filter-grid">
                <v-select v-model="selectedStatus" :items="statusOptions" label="Status" clearable />
                <v-select v-model="selectedLocation" :items="locations.map(l => l.name)" label="Location" clearable />
                <v-select v-model="selectedSource" :items="sources.map(s => s.name)" label="Source" clearable />
                <v-select v-model="selectedEmployee" :items="Array.from(new Set(
                    props.items.flatMap(i =>
                        (i.assignedTo as EmployeeData[]).map((emp: EmployeeData) => emp.employeeNumber)
                    )
                ))" label="Assigned To" clearable />
                <v-select v-model="selectedProgram" :items="programs.map(p => ({ title: p.name, value: p.id }))"
                    label="Program Sold" clearable />
                <v-select v-model="showOnlyWithFollowUp" :items="[
                    { title: 'With Follow-up', value: true },
                    { title: 'Without Follow-up', value: false }
                ]" label="Follow-up" clearable />
            </div>
        </v-card>

        <!-- CONTENIDO -->
        <v-card class="app-card" elevation="0">


            <v-data-table v-if="viewMode === 'table'" :headers="headers" :items="filteredItems" class="app-table"
                item-value="id" density="comfortable">
                <!-- Leads table custom columns -->
                <template #item.fullName="{ item }">
                    {{ item.name }} {{ item.lastName }}
                </template>

                <!-- Assigned to -->
                <template #item.assignedTo="{ item }">
                    <div v-if="item.assignedTo && item.assignedTo.length > 0">
                        <span>
                            {{ item.assignedTo[item.assignedTo.length - 1].name }}
                            {{ item.assignedTo[item.assignedTo.length - 1].lastName }}
                        </span>
                    </div>
                </template>

                <!-- Follow up -->
                <template #item.followUp="{ item }">
                    <v-icon v-if="item.followUp && item.followUp.length > 0" class="cursor-pointer"
                        @click="openFollowUpDialog(item)" :title="`Show Follow-up for ${item.name}`">
                        mdi-timeline-clock-outline
                    </v-icon>
                </template>

                <!-- Programs offered -->
                <template #item.programsOffered="{ item }">
                    <div v-if="item.programsOffered.length">
                        <v-icon class="cursor-pointer"
                            @click="openProgramsDialog(item.programsOffered, 'offered', item)"
                            title="View Offered Programs">
                            mdi-eye-outline
                        </v-icon>
                    </div>
                </template>

                <!-- Programs sold -->
                <template #item.programsSold="{ item }">
                    <div v-if="item.programsSold.length">
                        <v-icon class="cursor-pointer" @click="openProgramsDialog(item.programsSold, 'sold', item)"
                            title="View Sold Programs">
                            mdi-currency-usd
                        </v-icon>
                    </div>
                </template>

                <!-- ACTIONS COLUMN -->
                <template #item.actions="{ item }">
                    <div class="d-flex align-center ga-1">
                        <v-tooltip text="Edit" location="top">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="editItem(item)" />
                            </template>
                        </v-tooltip>
                        <v-tooltip text="Delete" location="top">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="deleteItem(item)" />
                            </template>
                        </v-tooltip>

                        <v-menu>
                            <template #activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-compare-horizontal" size="x-small" variant="text" title="Convert" />
                            </template>
                            <v-list density="compact">
                                <v-list-item @click="convertItem(item, 'CONTACT')">
                                    <v-list-item-title>Convert to Contact</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="convertItem(item, 'DEAL')">
                                    <v-list-item-title>Convert to Deal</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="convertItem(item, 'DEAL_WON')">
                                    <v-list-item-title>Convert to Deal Won</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="lostItem(item)">
                                    <v-list-item-title>Lost</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>
                </template>

                <template #item.status="{ item }">
                    <v-chip :color="getStatusColor(item)" variant="tonal" size="small" class="font-weight-bold">
                        {{ getStatusLabel(item) }}
                    </v-chip>
                </template>

                <template #item.type="{ item }">
                    <v-chip :color="getTypeColor(item.type)" variant="tonal" size="small" class="text-uppercase font-weight-bold">
                        {{ item.type || '—' }}
                    </v-chip>
                </template>

                <template #no-data>
                    <div class="app-empty-state py-8">
                        <v-icon>mdi-inbox-outline</v-icon>
                        <div class="text-subtitle-2 font-weight-medium">No records to show</div>
                        <div class="text-body-2 mt-1">Try adjusting your filters or add a new record.</div>
                    </div>
                </template>
            </v-data-table>

            <!-- VISTA TIPO CARDS -->
            <div v-if="viewMode === 'card'" class="pa-4 pa-sm-5">
                <div v-if="filteredItems.length === 0" class="app-empty-state">
                    <v-icon>mdi-inbox-outline</v-icon>
                    <div class="text-subtitle-1 font-weight-medium">No records to show</div>
                    <div class="text-body-2 mt-1">Try adjusting your filters or add a new record.</div>
                </div>

                <v-row v-else dense>
                    <v-col v-for="item in filteredItems" :key="item.id" cols="12" sm="6" md="4" lg="3">
                        <v-card class="record-card pa-5 fill-height d-flex flex-column" elevation="0">
                            <!-- TYPE + STATUS como header visual -->
                            <div class="d-flex justify-space-between align-center mb-4 ga-2">
                                <div class="d-flex align-center ga-2">
                                    <v-chip :color="getTypeColor(item.type)"
                                        size="small"
                                        class="text-uppercase font-weight-bold"
                                        variant="tonal">
                                        {{ item.type || '—' }}
                                    </v-chip>

                                    <v-menu location="bottom end">
                                        <template #activator="{ props }">
                                            <v-btn
                                                v-bind="props"
                                                icon="mdi-compare-horizontal"
                                                size="x-small"
                                                variant="text"
                                                title="Convert"
                                            />
                                        </template>
                                        <v-list density="compact">
                                            <v-list-item @click="convertItem(item, 'CONTACT')">
                                                <v-list-item-title>Convert to Contact</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="convertItem(item, 'DEAL')">
                                                <v-list-item-title>Convert to Deal</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="convertItem(item, 'DEAL_WON')">
                                                <v-list-item-title>Convert to Deal Won</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="lostItem(item)">
                                                <v-list-item-title>Lost</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </div>

                                <v-chip :color="getStatusColor(item)" size="small" variant="tonal" class="font-weight-bold">
                                    {{ getStatusLabel(item) }}
                                </v-chip>
                            </div>

                            <!-- Nombre + contacto -->
                            <div class="mb-4">
                                <div class="text-h6 font-weight-bold text-truncate" :title="`${item.name} ${item.lastName}`">
                                    {{ item.name }} {{ item.lastName }}
                                </div>
                                <div class="d-flex align-center ga-2 mt-2 text-body-2">
                                    <v-icon size="16" color="primary">mdi-phone-outline</v-icon>
                                    <span class="text-truncate">{{ item.phone || '—' }}</span>
                                </div>
                                <div class="d-flex align-center ga-2 mt-1 text-body-2 text-medium-emphasis">
                                    <v-icon size="16">mdi-email-outline</v-icon>
                                    <span class="text-truncate">{{ item.email || '—' }}</span>
                                </div>
                            </div>

                            <!-- Detalles -->
                            <div class="record-meta mb-4 flex-grow-1">
                                <div class="record-meta-row">
                                    <span class="record-meta-label">Location</span>
                                    <span class="record-meta-value">{{ item.location || '—' }}</span>
                                </div>
                                <div class="record-meta-row">
                                    <span class="record-meta-label">Source</span>
                                    <span class="record-meta-value">{{ item.source || '—' }}</span>
                                </div>
                                <div class="record-meta-row">
                                    <span class="record-meta-label">Reminder</span>
                                    <span class="record-meta-value">{{ item.reminder || '—' }}</span>
                                </div>
                                <div class="record-meta-row">
                                    <span class="record-meta-label">Assigned</span>
                                    <span class="record-meta-value">
                                        <template v-if="item.assignedTo?.length">
                                            {{ item.assignedTo[item.assignedTo.length - 1].name }}
                                            {{ item.assignedTo[item.assignedTo.length - 1].lastName }}
                                        </template>
                                        <template v-else>—</template>
                                    </span>
                                </div>
                            </div>

                            <v-divider class="mb-3" />

                            <!-- Acciones -->
                            <div class="d-flex align-center justify-end ga-1">
                                <v-tooltip text="Edit" location="top">
                                    <template #activator="{ props }">
                                        <v-btn v-bind="props" icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="editItem(item)" />
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete" location="top">
                                    <template #activator="{ props }">
                                        <v-btn v-bind="props" icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="deleteItem(item)" />
                                    </template>
                                </v-tooltip>
                                <v-tooltip v-if="item.followUp?.length" text="Follow-up" location="top">
                                    <template #activator="{ props }">
                                        <v-btn v-bind="props" icon="mdi-timeline-clock-outline" size="x-small" variant="text" @click="openFollowUpDialog(item)" />
                                    </template>
                                </v-tooltip>
                                <v-tooltip v-if="item.programsOffered?.length" text="Programs offered" location="top">
                                    <template #activator="{ props }">
                                        <v-btn v-bind="props" icon="mdi-eye-outline" size="x-small" variant="text" color="info" @click="openProgramsDialog(item.programsOffered, 'offered', item)" />
                                    </template>
                                </v-tooltip>
                                <v-tooltip v-if="item.programsSold?.length" text="Programs sold" location="top">
                                    <template #activator="{ props }">
                                        <v-btn v-bind="props" icon="mdi-currency-usd" size="x-small" variant="text" color="success" @click="openProgramsDialog(item.programsSold, 'sold', item)" />
                                    </template>
                                </v-tooltip>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </div>


        </v-card>

        <!-- Follow-up Dialog -->
        <v-dialog v-model="showFollowUpDialog" max-width="600px">
            <v-card v-if="selectedLead" class="pa-2">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">mdi-timeline-clock-outline</v-icon>
                    <span>Follow-up Timeline</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="showFollowUpDialog = false" />
                </v-card-title>
                <v-card-subtitle>{{ selectedLead.name }} {{ selectedLead.lastName }}</v-card-subtitle>
                <v-card-text class="pt-4">
                    <v-timeline align="start" density="comfortable" side="end">
                        <v-timeline-item v-for="(follow, i) in sortedFollowUps(selectedLead.followUp)" :key="i"
                            dot-color="primary" size="small">
                            <div>
                                <div class="text-body-2 font-weight-medium">
                                    {{ new Date(follow.date).toLocaleDateString() }} at {{ follow.time }}
                                </div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ follow.employee.name }} {{ follow.employee.lastName }}
                                </div>
                            </div>
                        </v-timeline-item>
                    </v-timeline>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Programs Dialog -->
        <v-dialog v-model="showProgramsDialog" max-width="500px">
            <v-card class="pa-2">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">mdi-school-outline</v-icon>
                    <span>{{ programDialogTitle }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="showProgramsDialog = false" />
                </v-card-title>
                <v-card-subtitle>{{ currentProgramLead?.name }} {{ currentProgramLead?.lastName }}</v-card-subtitle>
                <v-card-text class="pt-2">
                    <v-list density="compact" class="bg-transparent">
                        <v-list-item v-for="(program, index) in currentPrograms" :key="index" class="px-0">
                            <template #prepend>
                                <v-icon size="18" color="primary">mdi-checkbox-marked-circle-outline</v-icon>
                            </template>
                            <v-list-item-title class="font-weight-medium">{{ program.name }}</v-list-item-title>
                            <template #append>
                                <span class="text-body-2 font-weight-bold">${{ program.price }}</span>
                            </template>
                        </v-list-item>
                    </v-list>
                    <v-divider class="my-3" />
                    <div class="d-flex align-center justify-space-between">
                        <span class="text-subtitle-2 text-medium-emphasis">Total</span>
                        <span class="text-h6 font-weight-bold text-primary">
                            ${{ getProgramsTotal(currentPrograms) }}
                        </span>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Add/Edit Form Dialog -->
        <v-dialog v-model="showFormDialog" max-width="900px" persistent>
            <Form :programs="programs" :sources="sources" :locations="locations" :notSoldReasons="notSoldReasons"
                :itemToEdit="itemToEdit" @saved="onFormSaved" @cancel="closeFormDialog" />
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Form from '@/components/Form/Form.vue'
import { useProgramsStore, type Program } from '@/stores/programs/programs'
import { useSourcesStore, type Source } from '@/stores/sources/sources'

import { useNotSoldReasonsStore, type NotSoldReason } from '@/stores/notSoldReasons/notSoldReasons'
import { useLocationsStore, type Location } from '@/stores/locations/locations'
import type { EmployeeData } from '@/stores/leads/leads'

const viewMode = ref('card')

// Props
const props = defineProps<{
    title: string
    /* headers: any[] */
    items: any[]
    tableType: string
}>()

const headers = [
    { title: 'Actions', key: 'actions', align: 'center' as const },
    { title: 'Type', key: 'type' },
    { title: 'Status', key: 'status' },
    { title: 'Full Name', key: 'fullName' },
    { title: 'Phone', key: 'phone' },
    { title: 'Email', key: 'email' },
    { title: 'Source', key: 'source' },
    { title: 'Location', key: 'location' },
    { title: 'Reminder', key: 'reminder' },
    { title: 'Follow Up', key: 'followUp' },
    { title: 'Assigned To', key: 'assignedTo' },
    { title: 'Programs Offered', key: 'programsOffered' },
    { title: 'Programs Sold', key: 'programsSold' }
]

// --- Dialog States ---
const showFollowUpDialog = ref(false)
const selectedLead = ref<any>(null)

const showProgramsDialog = ref(false)
const currentPrograms = ref<Program[]>([])
const currentProgramLead = ref<{ name?: string; lastName?: string } | null>(null)
const programDialogTitle = ref('')

const showFormDialog = ref(false)
const itemToEdit = ref<any>(null)

// --- Stores ---
const programsStore = useProgramsStore()
const sourcesStore = useSourcesStore()
const locationsStore = useLocationsStore()
const notSoldReasonsStore = useNotSoldReasonsStore()

// --- Reactive data for Form props ---
//const programs = ref([])
const programs = ref<Program[]>([])
//const sources = ref([])
const sources = ref<Source[]>([])
//const locations = ref([])
const locations = ref<Location[]>([])
//const reasons = ref([])
const notSoldReasons = ref<NotSoldReason[]>([])

// Load stores data on mount
onMounted(async () => {
    // Asumiendo que tus stores tienen métodos para cargar datos:
    if (programsStore.fetchPrograms) await programsStore.fetchPrograms()
    if (sourcesStore.fetchSources) await sourcesStore.fetchSources()
    if (locationsStore.fetchLocations) await locationsStore.fetchLocations()
    if (notSoldReasonsStore.fetchReasons) await notSoldReasonsStore.fetchReasons()

    programs.value = programsStore.programs || []
    sources.value = sourcesStore.sources || []
    locations.value = locationsStore.locations || []
    notSoldReasons.value = notSoldReasonsStore.reasons || []

})

// --- Follow-up helpers ---
const sortedFollowUps = (list: any) => {
    if (!list) return []
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
const openFollowUpDialog = (lead: null) => {
    selectedLead.value = lead
    showFollowUpDialog.value = true
}
const openProgramsDialog = (programsList: never[], type: string, lead: null) => {
    currentPrograms.value = programsList
    currentProgramLead.value = lead
    programDialogTitle.value = type === 'offered' ? 'Programs Offered' : 'Programs Sold'
    showProgramsDialog.value = true
}
const getProgramsTotal = (list: any[]) =>
    list.reduce((total, p) => total + (p.price || 0), 0)

// --- Actions ---
const editItem = (item: any) => {
    itemToEdit.value = { ...(item ?? {}) }
    showFormDialog.value = true
}

const deleteItem = (item: any) => {
    console.log('Deleting item:', item)
    // Aquí agregar lógica para eliminar, o emitir evento al padre
}

const convertItem = (item: { id: any } | null, targetType: any) => {
    if (!item) {
        console.warn('No item provided to convert.');
        return;
    }
    console.log(`Converting item ${item.id} to ${targetType}`)
    // Aquí agregar lógica de conversión
    // Prepara el item para edición (podrías agregar una propiedad para tipo de conversión)
    itemToEdit.value = { ...item, convertTo: targetType }
    showFormDialog.value = true
}

const lostItem = (item: { id: any }) => {
    console.log(`Lost item ${item.id}`)
    // Aquí agregar lógica de conversión
    // Prepara el item para edición (podrías agregar una propiedad para tipo de conversión)
    itemToEdit.value = { ...item, lost: true }
    showFormDialog.value = true
}

const refresh = () => {
    console.log('Refreshing table data...')
    // Aquí emitir evento o llamar función para recargar datos
}

const openAddDialog = () => {
    itemToEdit.value = null
    showFormDialog.value = true
}

const closeFormDialog = () => {
    showFormDialog.value = false
    itemToEdit.value = null
}

const onFormSaved = (savedItem: any) => {
    closeFormDialog()
    console.log('Item saved:', savedItem)
    // Aquí refrescar datos o emitir evento para que el padre recargue la tabla
}

/* FILTER */
const selectedType = ref<string | null>(null)
const selectedLocation = ref<string | null>(null)
const selectedSource = ref<string | null>(null)
const selectedEmployee = ref<string | null>(null)
const selectedProgram = ref<number | null>(null)
const showOnlyWithFollowUp = ref<boolean | null>(null)

// Inicializa en undefined o null (sin selección)
const selectedStatus = ref<string | null>(null)

// Opciones con "All"
const statusOptions = computed(() => {
    if (props.tableType === 'deals') {
        return [
            { title: 'All', value: '' },  // Mantienes "All"
            { title: 'Open', value: 'open' },
            { title: 'Deal Won', value: 'deal_won' },
            { title: 'Deal Lost', value: 'deal_lost' }
        ];
    } else {
        return [
            { title: 'All', value: '' },  // También en otros casos
            { title: 'Lost', value: 'lost' },
            { title: 'Open', value: 'open' }
        ];
    }
});

// filteredItems ahora es un ref y se inicializa con todos los items al inicio
const filteredItems = ref(
    props.tableType === 'deals'
        ? props.items.filter(
            item => String(item.type).toUpperCase() === 'DEAL' && !item.lost && !item.dealWon
        )
        : props.items.filter(
            item => (item.type === 'LEAD' || item.type === 'CONTACT') && !item.lost
        )
)


// función para filtrar cuando se pulse el botón
function applyFilters() {
    filteredItems.value = props.items.filter(lead => {
        console.log('---------------------------------')
        console.log(`Evaluando lead ID: ${lead.id} - ${lead.name} ${lead.lastName}`)

        // Filtro por tipo solo para 'deals' (mostrar solo DEALS)
        if (props.tableType === 'deals') {
            const isDeal = String(lead.type).toUpperCase() === 'DEAL'
            if (!isDeal) {
                console.log(`  -> DESCARTADO porque tabla es 'deals' pero lead.type NO es 'DEAL' (lead.type=${lead.type})`)
                return false
            }
        }

        // Evaluaciones básicas para status
        const isLost = Boolean(lead.lost)
        const isDealWon = Boolean(lead.dealWon)
        const isDealType = String(lead.type).toUpperCase() === 'DEAL'

        // Status filter dinámico, solo si hay filtro activo
        let matchesStatus = true
        if (selectedStatus.value && selectedStatus.value !== '') {
            if (props.tableType === 'deals') {
                if (selectedStatus.value === 'open') {
                    matchesStatus = isDealType && !isLost && !isDealWon
                    if (!matchesStatus) console.log(`  -> DESCARTADO por status: Se esperaba 'open', pero lost=${isLost} y dealWon=${isDealWon}`)
                } else if (selectedStatus.value === 'deal_won') {
                    matchesStatus = isDealType && !isLost && isDealWon
                    if (!matchesStatus) console.log(`  -> DESCARTADO por status: Se esperaba 'deal_won', pero lost=${isLost} y dealWon=${isDealWon}`)
                } else if (selectedStatus.value === 'deal_lost') {
                    matchesStatus = isDealType && isLost && !isDealWon
                    if (!matchesStatus) console.log(`  -> DESCARTADO por status: Se esperaba 'deal_lost', pero lost=${isLost} y dealWon=${isDealWon}`)
                } else {
                    matchesStatus = false
                    console.log(`  -> DESCARTADO por status: filtro desconocido '${selectedStatus.value}'`)
                }
            } else {
                if (selectedStatus.value === 'lost') {
                    matchesStatus = isLost
                    if (!matchesStatus) console.log(`  -> DESCARTADO por status: Se esperaba 'lost' pero lost=false`)
                } else if (selectedStatus.value === 'open') {
                    matchesStatus = !isLost
                    if (!matchesStatus) console.log(`  -> DESCARTADO por status: Se esperaba 'open' pero lost=true`)
                } else {
                    matchesStatus = false
                    console.log(`  -> DESCARTADO por status: filtro desconocido '${selectedStatus.value}'`)
                }
            }
        } else {
            console.log(`  -> matchesStatus: no hay filtro activo, acepta todo`)
        }

        if (!matchesStatus) return false

        // Otros filtros, solo si hay valor seleccionado
        if (selectedType.value && lead.type !== selectedType.value) {
            console.log(`  -> DESCARTADO por tipo: se esperaba '${selectedType.value}', pero es '${lead.type}'`)
            return false
        }
        console.log(`  -> matchesType: ok`)

        if (selectedLocation.value && lead.location !== selectedLocation.value) {
            console.log(`  -> DESCARTADO por location: se esperaba '${selectedLocation.value}', pero es '${lead.location}'`)
            return false
        }
        console.log(`  -> matchesLocation: ok`)

        if (selectedSource.value && lead.source !== selectedSource.value) {
            console.log(`  -> DESCARTADO por source: se esperaba '${selectedSource.value}', pero es '${lead.source}'`)
            return false
        }
        console.log(`  -> matchesSource: ok`)

        if (selectedEmployee.value) {
            const foundEmp = (lead.assignedTo || []).some((emp: { employeeNumber: string | null }) => emp.employeeNumber === selectedEmployee.value)
            if (!foundEmp) {
                console.log(`  -> DESCARTADO por employee: no tiene employeeNumber '${selectedEmployee.value}' asignado`)
                return false
            }
        }
        console.log(`  -> matchesEmployee: ok`)

        if (selectedProgram.value) {
            const foundProgram = (lead.programsSold || []).some((p: { id: number | null }) => p.id === selectedProgram.value)
            if (!foundProgram) {
                console.log(`  -> DESCARTADO por program: no tiene programa con id '${selectedProgram.value}' vendido`)
                return false
            }
        }
        console.log(`  -> matchesProgram: ok`)

        if (showOnlyWithFollowUp.value !== null) {
            const hasFollowUp = lead.followUp.length > 0
            if (showOnlyWithFollowUp.value === true && !hasFollowUp) {
                console.log(`  -> DESCARTADO por followUp: se esperaba con seguimiento, pero no tiene`)
                return false
            }
            if (showOnlyWithFollowUp.value === false && hasFollowUp) {
                console.log(`  -> DESCARTADO por followUp: se esperaba sin seguimiento, pero tiene`)
                return false
            }
        }
        console.log(`  -> matchesFollowUp: ok`)

        console.log(`  -> Resultado final: ✅ ACEPTADO`)
        return true
    })

    console.log('')
    console.log(`Total filtrados: ${filteredItems.value.length}`)
    console.log('IDs filtrados:', filteredItems.value.map(i => i.id))
}


function getStatusLabel(item: any): string {
    if (item.type === 'DEAL') {
        if (!item.lost && !item.dealWon) return 'Open';
        if (item.lost && !item.dealWon) return 'Lost';
        if (!item.lost && item.dealWon) return 'Won';
    }

    if (item.type === 'LEAD' || item.type === 'CONTACT') {
        return item.lost ? 'Lost' : 'Open';
    }

    return '-';
}

function getStatusColor(item: any): string {
    if (item.type === 'DEAL') {
        if (!item.lost && !item.dealWon) return 'success';    // Deal Open → Verde
        if (item.lost && !item.dealWon) return 'error';       // Deal Lost → Rojo
        if (!item.lost && item.dealWon) return '#DAA520';     // Deal Won → Dorado (hex)
    }

    if (item.type === 'LEAD' || item.type === 'CONTACT') {
        return item.lost ? 'error' : 'success';
    }

    return 'grey';
}

function getTypeColor(type: any) {
    switch (type) {
        case 'LEAD': return 'deep-purple';
        case 'CONTACT': return 'blue';
        case 'DEAL': return 'green';
        default: return 'secondary';
    }
}



</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.gap-2 {
    gap: 8px;
}

/* Grid responsivo de filtros */
.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

/* Cards de registros */
.record-card {
    border-radius: 16px !important;
    border: 1px solid rgb(var(--v-theme-surface-variant)) !important;
    background-color: rgb(var(--v-theme-surface)) !important;
    transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease;
}
.record-card:hover {
    box-shadow: var(--app-shadow-md);
    transform: translateY(-2px);
    border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

.record-meta {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    font-size: 0.8rem;
}
.record-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}
.record-meta-label {
    color: rgb(var(--v-theme-on-surface-variant));
    font-weight: 500;
}
.record-meta-value {
    font-weight: 600;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 60%;
}

/* Tabla */
.app-table {
    border-radius: 0 0 12px 12px;
    overflow: hidden;
}
</style>
