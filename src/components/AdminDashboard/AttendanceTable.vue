<!--
  src/components/AdminDashboard/AttendanceTable.vue

  Tabla de registros de fichaje. Se apoya en `DataTableResponsive`, de modo que
  en móvil cada registro se muestra como tarjeta en lugar de forzar scroll
  horizontal sobre cuatro columnas.
-->
<template>
  <v-card>
    <div class="attendance__toolbar">
      <v-text-field
        v-model="search"
        placeholder="Search by name or employee number…"
        prepend-inner-icon="mdi-magnify"
        :density="density"
        clearable
        hide-details
        class="attendance__search"
        aria-label="Search attendance records"
      />

      <v-spacer class="d-none d-md-block" />

      <span class="attendance__count">
        {{ items.length }} {{ items.length === 1 ? 'record' : 'records' }}
      </span>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        density="comfortable"
        aria-label="Refresh"
        :loading="loading"
        @click="loadData"
      />
    </div>

    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
      {{ error }}
    </v-alert>

    <DataTableResponsive
      :headers="headers"
      :items="items"
      :loading="loading"
      :search="search"
      item-value="employee_number"
      card-title-key="fullName"
      card-subtitle-key="employee_number"
      :no-data-text="emptyTitle"
      :no-data-description="emptyDescription"
      no-data-icon="mdi-clock-outline"
    >
      <template #item.fullName="{ item }">
        {{ item.fullName || 'Unknown user' }}
      </template>

      <template #item.employee_number="{ item }">
        <span class="attendance__employee">{{ item.employee_number }}</span>
      </template>

      <template #item.type_of_clock="{ item }">
        <v-chip
          size="small"
          variant="tonal"
          :color="item.type_of_clock === 'CLOCK_IN' ? 'success' : 'error'"
        >
          {{ item.type_of_clock === 'CLOCK_IN' ? 'Clock in' : 'Clock out' }}
        </v-chip>
      </template>

      <template #item.clock_time="{ item }">
        <span class="attendance__time">{{ item.clock_time || '—' }}</span>
      </template>
    </DataTableResponsive>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { useResponsive } from '@/composables/useResponsive'
import DataTableResponsive, {
  type ResponsiveHeader,
} from '@/components/common/DataTableResponsive.vue'

export interface AttendanceLog {
  employee_number: string
  type_of_clock?: string
  clock_time?: string | null
  clock_date?: string
  fullName?: string
}

const props = withDefaults(
  defineProps<{
    fetchFn: (date: string) => Promise<AttendanceLog[]>
    emptyTitle?: string
    emptyDescription?: string
    /** Oculta la columna de estado en listas de un único tipo de registro. */
    hideStatus?: boolean
  }>(),
  {
    emptyTitle: 'No records',
    emptyDescription: 'There are no attendance records for this date.',
    hideStatus: false,
  },
)

const { density } = useResponsive()
const { date } = useSelectedDate()

const items = ref<AttendanceLog[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

const headers: ResponsiveHeader[] = [
  { title: 'Name', key: 'fullName', align: 'start' },
  { title: 'Employee #', key: 'employee_number' },
  ...(props.hideStatus
    ? []
    : [{ title: 'Status', key: 'type_of_clock' } as ResponsiveHeader]),
  { title: 'Time', key: 'clock_time' },
]

async function loadData(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const result = await props.fetchFn(date.value)
    items.value = Array.isArray(result) ? result : []
  } catch (err) {
    console.error('Error loading attendance data', err)
    error.value = 'Could not load the records. Please try again.'
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(date, loadData)

defineExpose({ loadData })
</script>

<style scoped>
.attendance__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

.attendance__search {
  flex: 1 1 16rem;
  min-width: 12rem;
}

.attendance__count {
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.attendance__employee,
.attendance__time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 600px) {
  .attendance__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
