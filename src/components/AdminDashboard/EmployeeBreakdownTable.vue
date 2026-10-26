<!--
  src/components/AdminDashboard/EmployeeBreakdownTable.vue

  Detalle por empleado del día elegido. Además de ser útil por sí misma, es la
  vista alternativa en tabla de las gráficas: toda cifra que se dibuja arriba
  se puede leer aquí sin depender del color.
-->
<template>
  <v-card>
    <div class="breakdown__toolbar">
      <div>
        <div class="breakdown__title-row">
          <h3 class="breakdown__title">Employees</h3>
          <InfoTip :text="chartHelp.employeeTable" label="Employees" />
        </div>
        <p class="breakdown__subtitle">
          {{ rows.length }} {{ rows.length === 1 ? 'employee' : 'employees' }}
        </p>
      </div>

      <v-spacer />

      <v-text-field
        v-model="search"
        placeholder="Search by name or number…"
        prepend-inner-icon="mdi-magnify"
        :density="density"
        clearable
        hide-details
        class="breakdown__search"
        aria-label="Search employees"
      />
    </div>

    <v-divider />

    <DataTableResponsive
      :headers="headers"
      :items="rows"
      :loading="loading"
      :search="search"
      item-value="employee_number"
      card-title-key="fullName"
      card-subtitle-key="employee_number"
      no-data-text="No employees"
      no-data-description="There are no employees to show for this date."
      no-data-icon="mdi-account-group-outline"
    >
      <template #item.status="{ item }">
        <div class="breakdown__status">
          <v-chip
            size="small"
            variant="tonal"
            :color="statusMeta[item.status as EmployeeStatus].color"
            :prepend-icon="statusMeta[item.status as EmployeeStatus].icon"
          >
            {{ statusMeta[item.status as EmployeeStatus].label }}
          </v-chip>
          <v-chip
            v-if="item.adminClockOut"
            size="small"
            variant="tonal"
            color="warning"
            prepend-icon="mdi-account-cog-outline"
          >
            Admin clock out
          </v-chip>
          <v-chip
            v-if="item.openShift && !isToday"
            size="small"
            variant="tonal"
            color="warning"
            prepend-icon="mdi-alert-circle-outline"
          >
            No clock out
          </v-chip>
        </div>
      </template>

      <template #item.firstIn="{ item }">
        <span class="breakdown__num">{{ item.firstIn ?? '—' }}</span>
      </template>

      <template #item.lastClock="{ item }">
        <span class="breakdown__num">{{ item.lastClock ?? '—' }}</span>
      </template>

      <template #item.workedHours="{ item }">
        <span class="breakdown__num">
          {{ item.workedHours > 0 ? `${item.workedHours.toFixed(2)} h` : '—' }}
        </span>
      </template>

      <template #item.activityRate="{ item }">
        <span class="breakdown__num">
          {{ item.activityRate === null ? '—' : `${item.activityRate.toFixed(1)}%` }}
        </span>
      </template>
    </DataTableResponsive>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InfoTip from '@/components/common/InfoTip.vue'
import { chartHelp } from './dashboardHelp'
import DataTableResponsive, {
  type ResponsiveHeader,
} from '@/components/common/DataTableResponsive.vue'
import { useResponsive } from '@/composables/useResponsive'
import { useSelectedDate } from '@/composables/useSelectedDate'
import type {
  DashboardEmployeeRow,
  EmployeeStatus,
} from '@/types/attendanceDashboard'

defineProps<{ rows: DashboardEmployeeRow[]; loading?: boolean }>()

const { density } = useResponsive()
const { isToday } = useSelectedDate()
const search = ref('')

// Estado = color + icono + texto: el color nunca lleva el significado solo.
const statusMeta: Record<
  EmployeeStatus,
  { label: string; color: string; icon: string }
> = {
  ON_CLOCK: { label: 'On the clock', color: 'success', icon: 'mdi-clock-check-outline' },
  LEFT: { label: 'Clocked out', color: 'primary', icon: 'mdi-logout' },
  ABSENT: { label: 'Not clocked in', color: 'secondary', icon: 'mdi-account-off-outline' },
}

const headers: ResponsiveHeader[] = [
  { title: 'Name', key: 'fullName', align: 'start' },
  { title: 'Employee #', key: 'employee_number' },
  { title: 'Status', key: 'status' },
  { title: 'First in', key: 'firstIn' },
  { title: 'Last clock', key: 'lastClock' },
  { title: 'Hours', key: 'workedHours', align: 'end' },
  { title: 'Activity', key: 'activityRate', align: 'end' },
]
</script>

<style scoped>
.breakdown__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

.breakdown__title-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
}

.breakdown__title {
  margin: 0;
  font-size: var(--app-text-md, 1rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.breakdown__subtitle {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.breakdown__search {
  flex: 1 1 16rem;
  max-width: 24rem;
  min-width: 12rem;
}

.breakdown__status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
}

.breakdown__num {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 600px) {
  .breakdown__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .breakdown__search {
    max-width: none;
  }
}
</style>
