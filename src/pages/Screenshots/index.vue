<template>
  <PageContainer variant="fluid">
    <PageHeader
      title="Screenshots"
      subtitle="Browse employee screenshots by date range"
    />

    <ScreenshotFilters
      v-model:employee="selectedEmployee"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      :employees="employees"
      :today="today"
      :loading="loading"
      :loading-employees="loadingEmployees"
      class="mb-4"
      @search="runSearch"
    />

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Resumen de resultados -->
    <div v-if="totalRecords" ref="resultsTop" class="results">
      <span class="results__count">
        <strong>{{ totalRecords }}</strong>
        {{ totalRecords === 1 ? 'record' : 'records' }} found
      </span>
      <span v-if="totalPages > 1" class="results__loaded">
        page {{ page }} of {{ totalPages }}
      </span>
      <v-pagination
        v-if="totalPages > 1"
        v-bind="paginationProps"
        class="results__pagination"
        @update:model-value="changePage"
      />
    </div>

    <!-- Carga inicial -->
    <div v-if="loading" class="app-autogrid" style="--app-autogrid-min: 11rem">
      <v-skeleton-loader
        v-for="n in 12"
        :key="n"
        type="image, list-item-two-line"
        class="rounded-lg"
      />
    </div>

    <!-- Rejilla -->
    <template v-else-if="images.length">
      <!--
        `.app-autogrid` reparte las columnas por ancho disponible: 2 en móvil,
        6 en un portátil y 10 o más en 4K, sin declarar breakpoints.
      -->
      <div
        class="app-autogrid"
        :class="{ 'grid--busy': loadingPage }"
        :aria-busy="loadingPage"
        style="--app-autogrid-min: 11rem"
      >
        <ScreenshotCard
          v-for="(image, index) in images"
          :key="image.id"
          :image="image"
          :eager="index < 12"
          :deletable="SCREENSHOT_DELETE_ENABLED"
          @open="openViewer(index)"
          @delete="askDelete"
        />
      </div>

      <v-pagination
        v-if="totalPages > 1"
        v-bind="paginationProps"
        class="pagination"
        @update:model-value="changePage"
      />

      <p class="end-of-list">
        Showing {{ rangeStart }}–{{ rangeEnd }} of {{ totalRecords }}
      </p>

      <ScreenshotStats
        :stats="stats"
        :loading="loadingStats"
        :error="statsError"
        :multi-day="isMultiDay"
        :employee="selectedEmployee"
        :range="searchedRange"
      />
    </template>

    <!-- Sin resultados -->
    <v-card v-else-if="hasSearched">
      <EmptyState
        title="No screenshots found"
        description="There are no records for the selected employee and date range."
        icon="mdi-image-search-outline"
      />
    </v-card>

    <!-- Estado inicial -->
    <v-card v-else>
      <EmptyState
        title="Select an employee to start"
        description="Pick an employee and a date range, then press Search to browse their screenshots."
        icon="mdi-account-search-outline"
      />
    </v-card>

    <ScreenshotViewer
      v-model="viewerOpen"
      :image="currentImage"
      :has-prev="viewerIndex > 0"
      :has-next="viewerIndex < images.length - 1 || page < totalPages"
      @prev="goPrev"
      @next="goNext"
    />

    <!-- DEV ONLY: confirmación de borrado (BD + S3) -->
    <BaseDialog
      v-if="SCREENSHOT_DELETE_ENABLED"
      title="Delete record"
      :show="!!deleteTarget"
      :persistent="deleting"
      :loading="deleting"
      width="460"
      @close="cancelDelete"
    >
      <template #dialog-body>
        <p class="mb-2">
          This permanently deletes the database record and its screenshot and
          thumbnail from S3. It cannot be undone.
        </p>
        <p v-if="deleteTarget" class="font-weight-medium">
          {{ deleteTarget.fullName }} · {{ deleteTarget.clock_date }}
          {{ deleteTarget.clock_time }}
        </p>
        <v-alert v-if="deleteError" type="error" variant="tonal" class="mt-3">
          {{ deleteError }}
        </v-alert>
      </template>
      <template #dialog-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="deleting" @click="cancelDelete">
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="deleting"
          @click="confirmDelete"
        >
          Delete
        </v-btn>
      </template>
    </BaseDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { Employee, ScreenshotImage } from '@/types/screenshots'
import {
  PAGE_SIZE,
  SCREENSHOT_DELETE_ENABLED,
  useScreenshots,
} from '@/composables/useScreenshots'
import BaseDialog from '@/components/common/BaseDialog.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ScreenshotFilters from '@/components/Screenshots/ScreenshotFilters.vue'
import ScreenshotCard from '@/components/Screenshots/ScreenshotCard.vue'
import ScreenshotStats from '@/components/Screenshots/ScreenshotStats.vue'
import ScreenshotViewer from '@/components/Screenshots/ScreenshotViewer.vue'

const {
  employees,
  loadingEmployees,
  images,
  totalRecords,
  stats,
  loadingStats,
  statsError,
  isMultiDay,
  searchedRange,
  page,
  totalPages,
  loading,
  loadingPage,
  hasSearched,
  error,
  getChicagoDate,
  loadEmployees,
  goToPage,
  search,
  deleteRecord,
  reset,
} = useScreenshots()

const selectedEmployee = ref<Employee | null>(null)
const today = getChicagoDate()
const startDate = ref(today)
const endDate = ref(today)

// ── Visor ──────────────────────────────────────────────────────
const viewerOpen = ref(false)
const viewerIndex = ref(0)

const currentImage = computed(() => images.value[viewerIndex.value] ?? null)

function openViewer(index: number): void {
  viewerIndex.value = index
  viewerOpen.value = true
}

/** Las páginas se recorren también desde el visor: al llegar al borde cambia de página. */
async function goPrev(): Promise<void> {
  if (viewerIndex.value > 0) {
    viewerIndex.value -= 1
    return
  }
  if (page.value > 1) {
    await goToPage(page.value - 1, selectedEmployee.value)
    viewerIndex.value = Math.max(0, images.value.length - 1)
  }
}

async function goNext(): Promise<void> {
  if (viewerIndex.value < images.value.length - 1) {
    viewerIndex.value += 1
    return
  }
  if (page.value < totalPages.value) {
    await goToPage(page.value + 1, selectedEmployee.value)
    viewerIndex.value = 0
  }
}

// ── Borrado (DEV ONLY) ─────────────────────────────────────────
const deleteTarget = ref<ScreenshotImage | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function askDelete(image: ScreenshotImage): void {
  deleteError.value = null
  deleteTarget.value = image
}

function cancelDelete(): void {
  if (deleting.value) return
  deleteTarget.value = null
  deleteError.value = null
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target || deleting.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await deleteRecord(target.id, selectedEmployee.value)
    deleteTarget.value = null
  } catch (err) {
    deleteError.value =
      err instanceof Error ? `Could not delete the record (${err.message}).` : 'Could not delete the record.'
  } finally {
    deleting.value = false
  }
}

// ── Paginación ─────────────────────────────────────────────────
const resultsTop = ref<HTMLElement | null>(null)

const rangeStart = computed(() =>
  totalRecords.value ? (page.value - 1) * PAGE_SIZE + 1 : 0,
)
const rangeEnd = computed(() =>
  Math.min(page.value * PAGE_SIZE, totalRecords.value),
)

const paginationProps = computed(() => ({
  modelValue: page.value,
  length: totalPages.value,
  totalVisible: 7,
  disabled: loadingPage.value,
  variant: 'outlined' as const,
  density: 'comfortable' as const,
  rounded: 'lg',
}))

async function changePage(target: number): Promise<void> {
  await goToPage(target, selectedEmployee.value)
  await nextTick()
  resultsTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Búsqueda ───────────────────────────────────────────────────
function runSearch(): void {
  search(selectedEmployee.value, startDate.value, endDate.value)
}

// Cambiar de empleado invalida los resultados en pantalla: mostrarlos bajo un
// nombre distinto sería engañoso.
watch(selectedEmployee, reset)

onMounted(loadEmployees)
</script>

<style scoped>
.results {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-4);
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.results__count strong {
  color: rgb(var(--v-theme-on-surface));
  font-variant-numeric: tabular-nums;
}

/* Página activa: VPagination no le pone clase, sólo `aria-current`. Con
   `variant="outlined"` el botón activo quedaba transparente y su texto en
   color primario; se rellena y se pone el texto en `on-primary`. */
.results__pagination :deep(.v-btn[aria-current='true']),
.pagination :deep(.v-btn[aria-current='true']) {
  background-color: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  font-weight: 700;
}

.results__pagination :deep(.v-btn[aria-current='true'] .v-btn__overlay),
.pagination :deep(.v-btn[aria-current='true'] .v-btn__overlay) {
  opacity: 0 !important;
}

.results__pagination {
  margin-left: auto;
  width: auto;
}

.results__loaded {
  padding: 2px var(--app-space-2);
  border-radius: var(--app-radius-full);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: var(--app-text-xs);
  font-weight: 600;
}

.grid--busy {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity var(--app-transition);
}

.pagination {
  margin-top: var(--app-space-6);
}

.end-of-list {
  margin: 0;
  padding: var(--app-space-3) 0 var(--app-space-6);
  text-align: center;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
