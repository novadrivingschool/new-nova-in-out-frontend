<template>
    <v-container fluid class="pa-0">
        <v-card elevation="2" class="mx-4 my-6" style="max-width: 100%;">
            <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h6">{{ title }}</span>
            </v-card-title>

            <!-- FILTER -->
            <v-card class="mx-4 mt-4 mb-2 pa-4" elevation="5" rounded="lg" :style="{
                backgroundColor: $vuetify.theme.current.dark ? '#161B22' : undefined,
                border: $vuetify.theme.current.dark ? '1px solid #30363d' : '1px solid #e0e0e0'
            }">

                <div class="d-flex align-center mb-4" style="gap: 8px;">
                    <v-icon color="primary">mdi-filter-variant</v-icon>
                    <span class="text-subtitle-1 font-weight-medium">Filters</span>
                </div>

                <div class="d-flex flex-wrap" style="gap: 12px;">
                    <v-select v-model="selectedStatus" :items="statusOptions" label="Status" clearable
                        density="comfortable" variant="outlined" hide-details="auto" style="width: 180px;" />

                    <v-select v-model="selectedLocation" :items="locations.map(l => l.name)" label="Location" clearable
                        density="comfortable" variant="outlined" hide-details="auto" style="width: 180px;" />

                    <v-select v-model="selectedSource" :items="sources.map(s => s.name)" label="Source" clearable
                        density="comfortable" variant="outlined" hide-details="auto" style="width: 180px;" />

                    <v-select v-model="selectedEmployee" :items="Array.from(new Set(
                        props.items.flatMap(i =>
                            (i.assignedTo as EmployeeData[]).map((emp: EmployeeData) => emp.employeeNumber)
                        )
                    ))" label="Assigned To" clearable density="comfortable" variant="outlined" hide-details="auto"
                        style="width: 180px;" />

                    <v-select v-model="selectedProgram" :items="programs.map(p => ({ title: p.name, value: p.id }))"
                        label="Program Sold" clearable density="comfortable" variant="outlined" hide-details="auto"
                        style="width: 180px;" />

                    <v-select v-model="showOnlyWithFollowUp" :items="[
                        { title: 'With Follow-up', value: true },
                        { title: 'Without Follow-up', value: false }
                    ]" label="Follow-up" clearable density="comfortable" variant="outlined" hide-details="auto"
                        style="width: 180px;" />

                    <v-btn color="primary" class="align-self-end" @click="applyFilters">
                        Apply
                    </v-btn>
                </div>
            </v-card>

            <v-card-actions class="justify-end px-4 pt-0 pb-2 mt-8" style="gap: 12px;">
                <!-- Toggle vista -->
                <v-btn-toggle v-model="viewMode" mandatory density="comfortable" divided>
                    <v-btn value="table" :variant="viewMode === 'table' ? 'flat' : 'text'">
                        <v-icon start icon="mdi-table" /> Table
                    </v-btn>
                    <v-btn value="card" :variant="viewMode === 'card' ? 'flat' : 'text'">
                        <v-icon start icon="mdi-view-grid" /> Cards
                    </v-btn>
                </v-btn-toggle>

                <!-- Refresh -->
                <v-btn variant="text" density="comfortable" @click="refresh">
                    <v-icon start small>mdi-refresh</v-icon>
                    Refresh
                </v-btn>

                <!-- Add new -->
                <v-btn color="primary" density="comfortable" @click="openAddDialog">
                    Add New
                </v-btn>
            </v-card-actions>


            <v-data-table v-if="viewMode === 'table'" :headers="headers" :items="filteredItems" class="elevation-1"
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
                    <div class="d-flex align-center gap-2">
                        <v-icon class="cursor-pointer text-primary" @click="editItem(item)" title="Edit">
                            mdi-pencil
                        </v-icon>
                        <v-icon class="cursor-pointer text-error" @click="deleteItem(item)" title="Delete">
                            mdi-delete
                        </v-icon>

                        <!-- CONVERT MENU WITH ICON -->
                        <v-menu>
                            <template #activator="{ props }">
                                <v-icon class="cursor-pointer text-secondary" v-bind="props" title="Convert">
                                    mdi-compare-horizontal
                                </v-icon>
                            </template>
                            <v-list>
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
                    <v-chip :color="getStatusColor(item)" text-color="white" small>
                        {{ getStatusLabel(item) }}
                    </v-chip>
                </template>
            </v-data-table>

            <!-- VISTA TIPO CARDS -->
            <v-row v-if="viewMode === 'card'" class="px-4 pb-4" dense>
                <v-col v-for="item in filteredItems" :key="item.id" cols="12" sm="6" md="4" lg="3">
                    <v-card class="pa-4 fill-height d-flex flex-column justify-space-between" elevation="5" rounded="lg"
                        :style="{
                            backgroundColor: $vuetify.theme.current.dark ? '#161B22' : undefined,
                            border: $vuetify.theme.current.dark ? '1px solid #30363d' : '1px solid #e0e0e0'
                        }">
                        <!-- TYPE + STATUS como header visual -->
                        <div class="d-flex justify-space-between align-center mb-6" style="gap: 12px;">
                            <div class="d-flex align-center" style="gap: 12px;">
                                <!-- Type Chip -->
                                <v-chip :color="getTypeColor(item.type)"
                                    class="text-uppercase font-weight-bold text-white px-4 py-1"
                                    style="font-size: 1.15rem; height: auto;">
                                    {{ item.type || '—' }}
                                </v-chip>

                                <!-- Convert Menu -->
                                <v-menu location="bottom end">
                                    <template #activator="{ props }">
                                        <v-icon v-bind="props" class="cursor-pointer text-secondary" size="24"
                                            title="Convert">
                                            mdi-compare-horizontal
                                        </v-icon>
                                    </template>
                                    <v-list>
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

                            <!-- Status Chip -->
                            <v-chip :color="getStatusColor(item)" text-color="white" class="font-weight-bold px-4 py-1"
                                style="font-size: 1.15rem; height: auto;">
                                {{ getStatusLabel(item) }}
                            </v-chip>
                        </div>


                        <!-- Nombre y teléfono destacados -->
                        <div class="mb-6">
                            <div class="text-h6 font-weight-bold mb-2">
                                {{ item.name }} {{ item.lastName }}
                            </div>

                            <div class="d-flex align-center mb-1" style="gap: 10px;">
                                <v-icon size="22" color="primary">mdi-phone</v-icon>
                                <span class="text-subtitle-1 font-weight-medium">{{ item.phone || '—' }}</span>
                            </div>

                            <div class="d-flex align-center" style="gap: 10px;">
                                <v-icon size="20" color="primary">mdi-email-outline</v-icon>
                                <span class="text-subtitle-2 font-weight-medium">{{ item.email || '—' }}</span>
                            </div>
                        </div>


                        <!-- Detalles secundarios -->
                        <div class="text-caption mb-4" style="line-height: 1.6;">
                            <div><strong>Location:</strong> {{ item.location || '—' }}</div>
                            <div><strong>Source:</strong> {{ item.source || '—' }}</div>
                            <div><strong>Reminder:</strong> {{ item.reminder || '—' }}</div>
                            <div>
                                <strong>Assigned:</strong>
                                <span v-if="item.assignedTo?.length">
                                    {{ item.assignedTo[item.assignedTo.length - 1].name }}
                                    {{ item.assignedTo[item.assignedTo.length - 1].lastName }}
                                </span>
                                <span v-else>—</span>
                            </div>
                            <div v-if="item.followUp?.length">
                                <strong>Follow-up:</strong> {{ item.followUp.length }}
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="d-flex align-center justify-end" style="gap: 10px;">
                            <v-icon class="cursor-pointer text-primary" size="20" @click="editItem(item)" title="Edit">
                                mdi-pencil
                            </v-icon>

                            <v-icon class="cursor-pointer text-error" size="20" @click="deleteItem(item)"
                                title="Delete">
                                mdi-delete
                            </v-icon>

                            <v-icon v-if="item.followUp?.length" class="cursor-pointer text-secondary" size="20"
                                @click="openFollowUpDialog(item)" title="Follow-up">
                                mdi-timeline-clock-outline
                            </v-icon>

                            <v-icon v-if="item.programsOffered?.length" class="cursor-pointer text-info" size="20"
                                @click="openProgramsDialog(item.programsOffered, 'offered', item)"
                                title="Programs Offered">
                                mdi-eye-outline
                            </v-icon>

                            <v-icon v-if="item.programsSold?.length" class="cursor-pointer text-success" size="20"
                                @click="openProgramsDialog(item.programsSold, 'sold', item)" title="Programs Sold">
                                mdi-currency-usd
                            </v-icon>
                        </div>
                    </v-card>
                </v-col>
            </v-row>


            <!-- Follow-up Dialog -->
            <v-dialog v-model="showFollowUpDialog" max-width="600px">
                <v-card v-if="selectedLead">
                    <v-card-title>
                        Follow-up Timeline — {{ selectedLead.name }} {{ selectedLead.lastName }}
                        <v-spacer />
                    </v-card-title>
                    <v-card-text>
                        <v-timeline align="start">
                            <v-timeline-item v-for="(follow, i) in sortedFollowUps(selectedLead.followUp)" :key="i"
                                dot-color="primary">
                                <div>
                                    <strong>{{ new Date(follow.date).toLocaleDateString() }} at {{ follow.time
                                        }}</strong><br />
                                    <small>👤 {{ follow.employee.name }} {{ follow.employee.lastName }}</small>
                                </div>
                            </v-timeline-item>
                        </v-timeline>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <!-- Programs Dialog -->
            <v-dialog v-model="showProgramsDialog" max-width="500px">
                <v-card>
                    <v-card-title>
                        {{ programDialogTitle }} — {{ currentProgramLead?.name }} {{ currentProgramLead?.lastName }}
                        <v-spacer />
                    </v-card-title>
                    <v-card-text>
                        <v-list density="compact">
                            <v-list-item v-for="(program, index) in currentPrograms" :key="index">
                                <v-list-item-title>{{ program.name }}</v-list-item-title>
                                <v-list-item-subtitle>${{ program.price }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                        <v-divider class="my-2" />
                        <div class="text-right font-weight-bold">
                            Total: ${{ getProgramsTotal(currentPrograms) }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <!-- Add/Edit Form Dialog -->
            <v-dialog v-model="showFormDialog" max-width="900px" persistent>
                <Form :programs="programs" :sources="sources" :locations="locations" :notSoldReasons="notSoldReasons"
                    :itemToEdit="itemToEdit" @saved="onFormSaved" @cancel="closeFormDialog" />
            </v-dialog>
        </v-card>
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
</style>
