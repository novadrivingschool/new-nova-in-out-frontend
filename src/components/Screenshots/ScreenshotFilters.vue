<!--
  src/components/Screenshots/ScreenshotFilters.vue

  Filtros de la galería: empleado, rango de fechas y atajos.

  Los atajos ("Today", "Yesterday", "Last 7 days") cubren el 90 % de los casos
  sin abrir un calendario, que en móvil es una operación incómoda.
-->
<template>
  <v-card class="filters">
    <div class="filters__head">
      <span class="app-eyebrow">Filters</span>

      <v-spacer />

      <div class="filters__presets">
        <v-btn
          v-for="preset in presets"
          :key="preset.value"
          size="small"
          variant="text"
          density="comfortable"
          @click="applyPreset(preset.value)"
        >
          {{ preset.title }}
        </v-btn>
      </div>
    </div>

    <v-divider />

    <div class="filters__body">
      <v-row dense>
        <v-col cols="12" md="5" xl="4">
          <v-autocomplete
            :model-value="employee"
            :items="employees"
            :item-title="employeeTitle"
            :loading="loadingEmployees"
            :density="density"
            label="Employee"
            placeholder="Search by name or employee number"
            clearable
            return-object
            no-data-text="No employees found"
            @update:model-value="$emit('update:employee', $event)"
          />
        </v-col>

        <v-col cols="12" sm="6" md="3" xl="2">
          <v-menu v-model="startMenu" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="formatDisplayDate(startDate)"
                :density="density"
                label="Start date"
                prepend-inner-icon="mdi-calendar-start"
                readonly
              />
            </template>
            <v-date-picker
              :model-value="toDate(startDate)"
              :max="endDate || today"
              color="primary"
              @update:model-value="onStartChange"
            />
          </v-menu>
        </v-col>

        <v-col cols="12" sm="6" md="3" xl="2">
          <v-menu v-model="endMenu" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="formatDisplayDate(endDate)"
                :density="density"
                label="End date"
                prepend-inner-icon="mdi-calendar-end"
                readonly
              />
            </template>
            <v-date-picker
              :model-value="toDate(endDate)"
              :min="startDate"
              :max="today"
              color="primary"
              @update:model-value="onEndChange"
            />
          </v-menu>
        </v-col>

        <v-col cols="12" md="1" xl="2" class="d-flex align-center">
          <v-btn
            color="primary"
            variant="flat"
            block
            :size="btnSize"
            :disabled="!canSearch"
            :loading="loading"
            prepend-icon="mdi-magnify"
            @click="$emit('search')"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Employee } from '@/types/screenshots'
import { useResponsive } from '@/composables/useResponsive'
import { dateToString, employeeTitle, formatDisplayDate } from './screenshotFormat'

const props = defineProps<{
  employees: Employee[]
  employee: Employee | null
  startDate: string
  endDate: string
  today: string
  loading?: boolean
  loadingEmployees?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:employee', value: Employee | null): void
  (e: 'update:startDate', value: string): void
  (e: 'update:endDate', value: string): void
  (e: 'search'): void
}>()

const { density, btnSize } = useResponsive()

const startMenu = ref(false)
const endMenu = ref(false)

const canSearch = computed(
  () =>
    !!props.employee?.profile?.employee_number &&
    !!props.startDate &&
    !!props.endDate,
)

const presets = [
  { title: 'Today', value: 'today' },
  { title: 'Yesterday', value: 'yesterday' },
  { title: 'Last 7 days', value: '7d' },
] as const

/** El date picker trabaja con `Date`; el estado del padre, con `YYYY-MM-DD`. */
function toDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

function shiftDays(days: number): string {
  const date = new Date(`${props.today}T00:00:00`)
  date.setDate(date.getDate() + days)
  return dateToString(date)
}

function applyPreset(preset: (typeof presets)[number]['value']): void {
  if (preset === 'today') {
    emit('update:startDate', props.today)
    emit('update:endDate', props.today)
    return
  }
  if (preset === 'yesterday') {
    const yesterday = shiftDays(-1)
    emit('update:startDate', yesterday)
    emit('update:endDate', yesterday)
    return
  }
  emit('update:startDate', shiftDays(-6))
  emit('update:endDate', props.today)
}

// El rango se mantiene coherente: mover un extremo arrastra al otro si lo cruza.
function onStartChange(value: unknown): void {
  const next = dateToString(value)
  emit('update:startDate', next)
  if (props.endDate && next > props.endDate) emit('update:endDate', next)
  startMenu.value = false
}

function onEndChange(value: unknown): void {
  const next = dateToString(value)
  emit('update:endDate', next)
  if (props.startDate && next < props.startDate) emit('update:startDate', next)
  endMenu.value = false
}
</script>

<style scoped>
.filters__head {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-3) var(--app-space-4);
}

.filters__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
}

.filters__body {
  padding: var(--app-space-4);
}

@media (max-width: 600px) {
  .filters__head {
    flex-wrap: wrap;
  }

  .filters__presets {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
