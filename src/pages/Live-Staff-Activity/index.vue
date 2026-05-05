<template>
    <v-container fluid class="app-page">
        <!-- Header de página -->
        <div class="app-page-header">
            <div class="d-flex align-center ga-3">
                <div class="app-icon-badge">
                    <v-icon color="primary" size="22">mdi-account-clock-outline</v-icon>
                </div>
                <div>
                    <div class="d-flex align-center ga-2 flex-wrap">
                        <h1 class="app-page-title">Live Staff Activity</h1>
                        <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
                            {{ activeStaff.length }} active
                        </v-chip>
                    </div>
                    <div class="app-page-subtitle">Realtime view of staff clock-ins and current windows</div>
                </div>
            </div>

            <v-btn color="primary" prepend-icon="mdi-refresh" @click="refresh">
                Refresh
            </v-btn>
        </div>

        <!-- ====== TABLA: Live Staff Activity ====== -->
        <v-card class="app-card mb-6" elevation="0">
            <!-- Vista DESKTOP / TABLET (md+) -->
            <v-data-table
                v-if="!smAndDown"
                :headers="staffHeaders"
                :items="activeStaff"
                class="app-table"
                item-value="employeeNumber"
                density="comfortable"
            >
                <template #item.staff="{ item }">
                    <div class="d-flex align-center ga-3">
                        <v-avatar size="36" color="primary" class="text-white text-caption font-weight-bold">
                            {{ getInitials(item.fullName) }}
                        </v-avatar>
                        <div>
                            <div class="font-weight-medium">{{ item.fullName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.employeeNumber }}</div>
                        </div>
                    </div>
                </template>

                <template #item.status="{ item }">
                    <v-chip
                        :color="statusColor(item.status)"
                        variant="flat"
                        size="small"
                        class="font-weight-bold text-uppercase status-chip"
                    >
                        {{ item.status }}
                    </v-chip>
                </template>

                <template #item.clockIn="{ item }">
                    <span class="font-feature-num">{{ item.clockIn }}</span>
                </template>

                <template #item.lastType="{ item }">
                    <span class="text-uppercase text-body-2">{{ item.lastType }}</span>
                </template>

                <template #item.window="{ item }">
                    <div class="d-flex align-center ga-2 font-feature-num text-body-2">
                        <span>{{ item.windowStart }}</span>
                        <v-icon size="14" class="text-medium-emphasis">mdi-arrow-right</v-icon>
                        <span :class="{ 'text-medium-emphasis': !item.windowEnd }">
                            {{ item.windowEnd || '…' }}
                        </span>
                    </div>
                </template>

                <template #item.actions="{ item }">
                    <v-btn
                        color="error"
                        variant="flat"
                        size="small"
                        prepend-icon="mdi-logout-variant"
                        @click="forceClockOut(item)"
                    >
                        Force Clock Out
                    </v-btn>
                </template>

                <template #no-data>
                    <div class="app-empty-state py-8">
                        <v-icon>mdi-account-clock-outline</v-icon>
                        <div class="text-subtitle-2 font-weight-medium">No active staff right now</div>
                        <div class="text-body-2 mt-1">When someone clocks in, they will appear here.</div>
                    </div>
                </template>
            </v-data-table>

            <!-- Vista MOBILE (sm-) -->
            <div v-else>
                <div v-if="activeStaff.length === 0" class="app-empty-state py-8">
                    <v-icon>mdi-account-clock-outline</v-icon>
                    <div class="text-subtitle-2 font-weight-medium">No active staff right now</div>
                </div>

                <div v-else class="staff-mobile-list">
                    <div
                        v-for="(item, idx) in activeStaff"
                        :key="item.employeeNumber"
                        class="staff-mobile-card"
                        :class="{ 'with-divider': idx !== activeStaff.length - 1 }"
                    >
                        <div class="d-flex align-center ga-3 mb-3">
                            <v-avatar size="40" color="primary" class="text-white text-caption font-weight-bold">
                                {{ getInitials(item.fullName) }}
                            </v-avatar>
                            <div class="flex-grow-1" style="min-width: 0;">
                                <div class="font-weight-medium text-truncate">{{ item.fullName }}</div>
                                <div class="text-caption text-medium-emphasis text-truncate">{{ item.employeeNumber }}</div>
                            </div>
                            <v-chip
                                :color="statusColor(item.status)"
                                variant="flat"
                                size="x-small"
                                class="font-weight-bold text-uppercase status-chip"
                            >
                                {{ item.status }}
                            </v-chip>
                        </div>

                        <div class="staff-mobile-meta mb-3">
                            <div class="staff-mobile-meta-row">
                                <span class="staff-mobile-meta-label">Clock In</span>
                                <span class="staff-mobile-meta-value font-feature-num">{{ item.clockIn }}</span>
                            </div>
                            <div class="staff-mobile-meta-row">
                                <span class="staff-mobile-meta-label">Last type</span>
                                <span class="staff-mobile-meta-value text-uppercase">{{ item.lastType }}</span>
                            </div>
                            <div class="staff-mobile-meta-row">
                                <span class="staff-mobile-meta-label">Window</span>
                                <span class="staff-mobile-meta-value font-feature-num">
                                    {{ item.windowStart }}
                                    <v-icon size="12" class="text-medium-emphasis">mdi-arrow-right</v-icon>
                                    <span :class="{ 'text-medium-emphasis': !item.windowEnd }">
                                        {{ item.windowEnd || '…' }}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <v-btn
                            color="error"
                            variant="flat"
                            size="small"
                            block
                            prepend-icon="mdi-logout-variant"
                            @click="forceClockOut(item)"
                        >
                            Force Clock Out
                        </v-btn>
                    </div>
                </div>
            </div>
        </v-card>

        <!-- ====== TABLA: Force Clock Out — Audit history ====== -->
        <v-card class="app-card" elevation="0">
            <div class="d-flex align-center justify-space-between pa-4 pa-sm-5 pb-3">
                <div class="d-flex align-center ga-2">
                    <v-icon color="primary" size="20">mdi-history</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">Force Clock Out — Audit history</span>
                </div>
                <v-chip variant="tonal" size="small" color="default">
                    {{ auditHistory.length }} {{ auditHistory.length === 1 ? 'record' : 'records' }}
                </v-chip>
            </div>

            <v-divider />

            <!-- Vista DESKTOP / TABLET -->
            <v-data-table
                v-if="!smAndDown"
                :headers="auditHeaders"
                :items="auditHistory"
                class="app-table"
                item-value="id"
                density="comfortable"
            >
                <template #item.staff="{ item }">
                    <div class="d-flex align-center ga-3">
                        <v-avatar size="32" color="secondary" class="text-white text-caption font-weight-bold">
                            {{ getInitials(item.staffName) }}
                        </v-avatar>
                        <div>
                            <div class="font-weight-medium">{{ item.staffName }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.employeeNumber }}</div>
                        </div>
                    </div>
                </template>

                <template #item.reason="{ item }">
                    <v-chip variant="tonal" color="error" size="small" class="font-weight-bold">
                        {{ item.reason }}
                    </v-chip>
                </template>

                <template #no-data>
                    <div class="app-empty-state py-8">
                        <v-icon>mdi-clipboard-text-outline</v-icon>
                        <div class="text-subtitle-2 font-weight-medium">No audit records yet</div>
                    </div>
                </template>
            </v-data-table>

            <!-- Vista MOBILE -->
            <div v-else>
                <div v-if="auditHistory.length === 0" class="app-empty-state py-8">
                    <v-icon>mdi-clipboard-text-outline</v-icon>
                    <div class="text-subtitle-2 font-weight-medium">No audit records yet</div>
                </div>

                <div v-else class="staff-mobile-list">
                    <div
                        v-for="(item, idx) in auditHistory"
                        :key="item.id"
                        class="staff-mobile-card"
                        :class="{ 'with-divider': idx !== auditHistory.length - 1 }"
                    >
                        <div class="d-flex align-center justify-space-between mb-2 ga-2">
                            <span class="text-caption text-medium-emphasis font-feature-num">{{ item.when }}</span>
                            <v-chip variant="tonal" color="error" size="x-small" class="font-weight-bold">
                                {{ item.reason }}
                            </v-chip>
                        </div>
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="32" color="secondary" class="text-white text-caption font-weight-bold">
                                {{ getInitials(item.staffName) }}
                            </v-avatar>
                            <div style="min-width: 0;">
                                <div class="font-weight-medium text-truncate">{{ item.staffName }}</div>
                                <div class="text-caption text-medium-emphasis text-truncate">{{ item.employeeNumber }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()

// ============================================================
// MOCK DATA — Mirror the screenshot exactly
// (Sin lógica real: cuando exista el endpoint, reemplazar
// estos arrays por la respuesta del backend)
// ============================================================
type StaffStatus = 'ACTIVITY IN' | 'ACTIVITY OUT' | 'LUNCH IN' | 'LUNCH OUT'

interface StaffRow {
    employeeNumber: string
    fullName: string
    status: StaffStatus
    clockIn: string
    lastType: StaffStatus
    windowStart: string
    windowEnd: string | null
}

interface AuditRow {
    id: number
    when: string
    staffName: string
    employeeNumber: string
    reason: string
}

const activeStaff = ref<StaffRow[]>([
    {
        employeeNumber: 'VOUTDAN092842',
        fullName: 'Daniela Alvarez',
        status: 'ACTIVITY IN',
        clockIn: '09:02:27',
        lastType: 'ACTIVITY IN',
        windowStart: '09:02:46',
        windowEnd: null,
    },
    {
        employeeNumber: 'VOUTDAV093612',
        fullName: 'David Diaz',
        status: 'LUNCH IN',
        clockIn: '09:04:50',
        lastType: 'LUNCH IN',
        windowStart: '13:11:39',
        windowEnd: null,
    },
    {
        employeeNumber: 'VOUTDIN104200',
        fullName: 'Dina Uchima',
        status: 'ACTIVITY OUT',
        clockIn: '10:11:38',
        lastType: 'ACTIVITY OUT',
        windowStart: '10:12:31',
        windowEnd: '12:17:01',
    },
    {
        employeeNumber: 'VOUTFAN143524',
        fullName: 'Fanny Moscoso',
        status: 'ACTIVITY IN',
        clockIn: '09:00:18',
        lastType: 'ACTIVITY IN',
        windowStart: '09:00:25',
        windowEnd: null,
    },
    {
        employeeNumber: 'VOUTKEL131957',
        fullName: 'Kelly Parra',
        status: 'ACTIVITY OUT',
        clockIn: '09:32:31',
        lastType: 'ACTIVITY OUT',
        windowStart: '09:32:44',
        windowEnd: '13:15:44',
    },
    {
        employeeNumber: 'VOUTMIS132119',
        fullName: 'Mishel Ruales',
        status: 'ACTIVITY IN',
        clockIn: '09:11:59',
        lastType: 'ACTIVITY IN',
        windowStart: '09:12:05',
        windowEnd: null,
    },
    {
        employeeNumber: 'VOUTSOF141002',
        fullName: 'Sofia Vazquez',
        status: 'ACTIVITY IN',
        clockIn: '09:01:44',
        lastType: 'ACTIVITY IN',
        windowStart: '09:02:28',
        windowEnd: null,
    },
])

const auditHistory = ref<AuditRow[]>([
    {
        id: 1,
        when: '2026-04-24 18:14:32',
        staffName: 'Dina Uchima',
        employeeNumber: 'VOUTDIN104200',
        reason: 'Other',
    },
])

// ============================================================
// Headers
// ============================================================
const staffHeaders = [
    { title: 'Staff', key: 'staff', sortable: false, minWidth: '220' },
    { title: 'Status', key: 'status', sortable: false, width: 140 },
    { title: 'Clock In', key: 'clockIn', sortable: false, width: 120 },
    { title: 'Last type', key: 'lastType', sortable: false, width: 140 },
    { title: 'Window', key: 'window', sortable: false, minWidth: '200' },
    { title: 'Action', key: 'actions', sortable: false, align: 'end' as const, width: 200 },
]

const auditHeaders = [
    { title: 'When', key: 'when', sortable: false, width: 200 },
    { title: 'Staff', key: 'staff', sortable: false },
    { title: 'Reason', key: 'reason', sortable: false, align: 'end' as const, width: 160 },
]

// ============================================================
// Helpers (UI-only)
// ============================================================
function getInitials(name: string): string {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase() || '?'
}

function statusColor(status: StaffStatus): string {
    switch (status) {
        case 'ACTIVITY IN': return 'primary'
        case 'ACTIVITY OUT': return 'blue-grey'
        case 'LUNCH IN': return 'warning'
        case 'LUNCH OUT': return 'amber'
        default: return 'default'
    }
}

// Acciones placeholder (mock — sin lógica real)
function refresh() {
    console.log('[Live Staff Activity] Refresh requested (mock)')
}

function forceClockOut(item: StaffRow) {
    console.log('[Live Staff Activity] Force clock out requested for', item.employeeNumber)
}
</script>

<style scoped>
.app-icon-badge {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(var(--v-theme-primary), 0.12);
    flex-shrink: 0;
}

.font-feature-num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
}

.status-chip {
    letter-spacing: 0.04em;
}

/* Mobile cards */
.staff-mobile-list {
    display: flex;
    flex-direction: column;
}

.staff-mobile-card {
    padding: 16px;
}

.staff-mobile-card.with-divider {
    border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.staff-mobile-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background: rgba(var(--v-theme-surface-variant), 0.5);
    border-radius: 10px;
}

.staff-mobile-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
}

.staff-mobile-meta-label {
    color: rgb(var(--v-theme-on-surface-variant));
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.7rem;
}

.staff-mobile-meta-value {
    font-weight: 600;
    text-align: right;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
</style>
