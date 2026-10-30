<!--
  src/components/AdminDashboard/TotalHoursDashboard.vue

  Gráfico de horas trabajadas con selector de rango.

  Los atajos ("Last 7 days", "This month"…) evitan que el caso común exija
  abrir dos calendarios. El rango manual sigue disponible.
-->
<template>
  <v-card>
    <div class="hours__head">
      <div>
        <h2 class="hours__title">Total hours</h2>
        <p class="hours__subtitle">{{ dateRangeLabel }}</p>
      </div>

      <div class="hours__controls">
        <v-select
          v-model="preset"
          :items="presetOptions"
          :density="density"
          hide-details
          class="hours__preset"
          aria-label="Date range preset"
        />

        <template v-if="preset === 'custom'">
          <v-menu v-model="startMenu" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="formatDisplayDate(rawStartDate)"
                label="Start"
                readonly
                prepend-inner-icon="mdi-calendar-start"
                :density="density"
                hide-details
                class="hours__date"
              />
            </template>
            <v-date-picker
              v-model="rawStartDate"
              :max="rawEndDate"
              color="primary"
              @update:model-value="startMenu = false"
            />
          </v-menu>

          <v-menu v-model="endMenu" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="formatDisplayDate(rawEndDate)"
                label="End"
                readonly
                prepend-inner-icon="mdi-calendar-end"
                :density="density"
                hide-details
                class="hours__date"
              />
            </template>
            <v-date-picker
              v-model="rawEndDate"
              :min="rawStartDate"
              :max="today"
              color="primary"
              @update:model-value="endMenu = false"
            />
          </v-menu>

          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-filter-outline"
            :size="btnSize"
            :loading="loading"
            @click="applyFilters"
          >
            Apply
          </v-btn>
        </template>
      </div>
    </div>

    <v-divider />

    <div class="hours__body">
      <ActivityLoader v-if="loading" label="Loading chart data…" />

      <v-alert v-else-if="error" type="error" variant="tonal">
        {{ error }}
        <template #append>
          <v-btn variant="text" size="small" @click="applyFilters">Retry</v-btn>
        </template>
      </v-alert>

      <EmptyState
        v-else-if="isEmpty"
        title="No hours recorded"
        description="There is no attendance data in the selected date range."
        icon="mdi-chart-line-variant"
      />

      <template v-else>
        <apexchart
          type="line"
          :height="chartHeight"
          :options="chartOptions"
          :series="chartSeries"
        />
        <p class="hours__note">
          Graph data does not include overtime and absences.
        </p>
      </template>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import apexchart from '@/components/common/ApexChart.vue'
import { useAttendanceChart } from '@/composables/useAttendanceChart'
import { useResponsive } from '@/composables/useResponsive'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

type Preset = '7d' | '30d' | 'month' | 'custom'

const { chartOptions, chartSeries, fetchChartData, loading, error, isEmpty } =
  useAttendanceChart()
const { density, btnSize, smAndDown, isUltraWide } = useResponsive()

const today = new Date()

const preset = ref<Preset>('30d')
const presetOptions = [
  { title: 'Last 7 days', value: '7d' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'This month', value: 'month' },
  { title: 'Custom range', value: 'custom' },
]

const startMenu = ref(false)
const endMenu = ref(false)

const rawStartDate = ref(new Date())
const rawEndDate = ref(new Date())

// Fechas efectivamente cargadas en el gráfico; el subtítulo mira a estas y no a
// las del selector, para no anunciar un rango que aún no se ha consultado.
const appliedStartDate = ref(new Date())
const appliedEndDate = ref(new Date())

/** El gráfico necesita más alto en pantallas grandes y menos en móvil. */
const chartHeight = computed(() => {
  if (smAndDown.value) return 260
  if (isUltraWide.value) return 460
  return 350
})

const dateRangeLabel = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  const start = appliedStartDate.value.toLocaleDateString('en-US', options)
  const end = appliedEndDate.value.toLocaleDateString('en-US', options)
  return `${start} — ${end}`
})

function formatDisplayDate(date: Date): string {
  return date ? date.toLocaleDateString('en-US') : ''
}

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Traduce el atajo elegido a un par de fechas concretas. */
function resolvePreset(value: Preset): { start: Date; end: Date } | null {
  const end = new Date()
  const start = new Date()

  switch (value) {
    case '7d':
      start.setDate(end.getDate() - 7)
      return { start, end }
    case '30d':
      start.setDate(end.getDate() - 30)
      return { start, end }
    case 'month':
      return { start: new Date(end.getFullYear(), end.getMonth(), 1), end }
    default:
      return null
  }
}

async function applyFilters(): Promise<void> {
  appliedStartDate.value = new Date(rawStartDate.value)
  appliedEndDate.value = new Date(rawEndDate.value)

  await fetchChartData(
    formatDateForAPI(appliedStartDate.value),
    formatDateForAPI(appliedEndDate.value),
  )
}

watch(preset, async (value) => {
  const range = resolvePreset(value)
  if (!range) return // 'custom': espera a que el usuario pulse Apply
  rawStartDate.value = range.start
  rawEndDate.value = range.end
  await applyFilters()
})

onMounted(async () => {
  const range = resolvePreset('30d')!
  rawStartDate.value = range.start
  rawEndDate.value = range.end
  await applyFilters()
})
</script>

<style scoped>
.hours__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-4);
  padding: var(--app-space-5);
}

.hours__title {
  font-size: var(--app-text-xl);
  font-weight: 700;
  letter-spacing: -0.015em;
  margin: 0;
}

.hours__subtitle {
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  margin: var(--app-space-1) 0 0;
  font-variant-numeric: tabular-nums;
}

.hours__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

.hours__preset {
  min-width: 10rem;
}

.hours__date {
  min-width: 9rem;
  max-width: 11rem;
}

.hours__body {
  padding: var(--app-space-4);
}

.hours__note {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (max-width: 600px) {
  .hours__head {
    padding: var(--app-space-4);
  }

  .hours__controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .hours__date,
  .hours__preset {
    max-width: none;
  }
}
</style>
