<!--
  src/components/AdminDashboard/AdminDashboardFilter.vue

  Barra superior del dashboard: selector de UNA fecha (date picker), botón
  "Today", hora de la última actualización y refresco manual.

  La fecha vive en el query param `?date=` (ver `useSelectedDate`); este
  componente solo la modifica, no carga datos. La carga la hace
  `useAttendanceDashboard` en la página.
-->
<template>
  <header class="dashboard-bar">
    <v-menu v-model="menuOpen" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-text-field
          v-bind="menuProps"
          :model-value="label"
          label="Date"
          readonly
          prepend-inner-icon="mdi-calendar"
          density="compact"
          hide-details
          class="dashboard-bar__date"
          aria-label="Select a date"
        />
      </template>
      <v-date-picker
        :model-value="pickerValue"
        :max="today"
        color="primary"
        hide-header
        @update:model-value="onPick"
      />
    </v-menu>

    <v-btn
      v-if="!isToday"
      variant="tonal"
      size="small"
      prepend-icon="mdi-calendar-today"
      @click="goToToday"
    >
      Today
    </v-btn>

    <v-chip v-else size="small" variant="tonal" color="success" prepend-icon="mdi-circle-medium">
      Live
    </v-chip>

    <v-spacer />

    <span class="dashboard-bar__updated">{{ lastUpdatedLabel }}</span>

    <v-btn
      icon="mdi-refresh"
      size="small"
      density="comfortable"
      aria-label="Refresh dashboard"
      :loading="loading"
      @click="emit('refresh')"
    />
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { formatDateString, parseDateString } from '@/utils/dateString'

const props = defineProps<{
  loading?: boolean
  lastUpdated: Date | null
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()

const router = useRouter()
const { date, isToday, label, today, syncToday } = useSelectedDate()

const menuOpen = ref(false)

/** El date picker de Vuetify trabaja con `Date`; el resto con `YYYY-MM-DD`. */
const pickerValue = computed(() => parseDateString(date.value) ?? new Date())

const lastUpdatedLabel = computed(() => {
  if (!props.lastUpdated) return 'Never updated'
  return `Updated ${props.lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
})

// Al abrir el calendario se refresca "hoy" (la pestaña pudo cruzar medianoche).
watch(menuOpen, (open) => {
  if (open) syncToday()
})

function setDate(value: string | null): void {
  router.replace({ query: value ? { date: value } : {} })
}

function onPick(value: unknown): void {
  menuOpen.value = false
  const picked = Array.isArray(value) ? value[0] : value
  if (!(picked instanceof Date)) return

  const iso = formatDateString(picked)
  setDate(iso === today.value ? null : iso)
}

function goToToday(): void {
  setDate(null)
}
</script>

<style scoped>
.dashboard-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-4);
}

.dashboard-bar__date {
  min-width: 10rem;
  max-width: 12rem;
}

.dashboard-bar__updated {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
}

@media (max-width: 600px) {
  .dashboard-bar__updated {
    display: none;
  }
}
</style>
