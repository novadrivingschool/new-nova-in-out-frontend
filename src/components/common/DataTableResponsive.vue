<!--
  src/components/common/DataTableResponsive.vue

  Tabla que deja de ser tabla en móvil.

  Una tabla de 6 columnas en 375px de ancho es ilegible: o se corta o obliga a
  arrastrar horizontalmente buscando la columna. Por debajo de `md` cada fila
  se pinta como una tarjeta etiqueta/valor.

  Los slots `#item.<key>` sirven en ambas vistas: se declaran una vez y se
  reutilizan dentro de la tarjeta, así que los chips, avatares y formatos de
  fecha no se duplican.

  ── Modelo controlado / no controlado ──────────────────────────────────────
  `page`, `itemsPerPage` y `sortBy` son opcionales. Si el padre NO los pasa, la
  tabla los gestiona internamente y este componente NO registra el manejador
  `onUpdate:*` correspondiente. Esto es deliberado: Vuetify considera un modelo
  "controlado" en cuanto existen la prop y su `onUpdate:`, y en ese caso ignora
  su estado interno. Registrarlos siempre dejaba el ordenado y el selector de
  filas por página sin efecto.

  ── Paginación ─────────────────────────────────────────────────────────────
    - Cliente (por defecto): recibe todos los items y pagina/ordena/busca solo.
    - Servidor (`server`):   recibe sólo la página actual; requiere
                             `v-model:page`, `items-per-page` e `items-length`.
-->
<template>
  <!-- ═══════════ TABLET Y DESKTOP ═══════════ -->
  <component
    :is="server ? VDataTableServer : VDataTable"
    v-if="!isMobile"
    v-bind="tableBindings"
    class="data-table-responsive__table"
  >
    <!-- Reexpone los slots recibidos, salvo los que este componente define -->
    <template v-for="name in passthroughSlots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>

    <template #loading>
      <v-skeleton-loader :type="`table-row@${skeletonRows}`" />
    </template>

    <template #no-data>
      <slot name="empty">
        <EmptyState
          :title="noDataText"
          :description="noDataDescription"
          :icon="noDataIcon"
        />
      </slot>
    </template>
  </component>

  <!-- ═══════════ MÓVIL ═══════════ -->
  <div v-else class="data-table-responsive__mobile">
    <!-- Carga -->
    <div v-if="loading" class="data-table-responsive__cards">
      <v-skeleton-loader
        v-for="n in 3"
        :key="n"
        type="list-item-two-line"
        class="rounded-lg"
      />
    </div>

    <!-- Vacío -->
    <slot v-else-if="!visibleItems.length" name="empty">
      <EmptyState
        :title="noDataText"
        :description="noDataDescription"
        :icon="noDataIcon"
      />
    </slot>

    <!-- Tarjetas -->
    <template v-else>
      <div class="data-table-responsive__cards">
        <v-card
          v-for="(item, index) in visibleItems"
          :key="itemKey(item, index)"
          class="data-card"
          :class="[{ 'app-card--interactive': clickableRows }, rowClass?.(item)]"
          @click="onRowClick(item)"
        >
          <!-- Permite sustituir la tarjeta entera cuando el caso lo pide -->
          <slot name="card" :item="item" :index="index">
            <div class="data-card__head">
              <div class="data-card__heading">
                <div v-if="cardTitleKey" class="data-card__title">
                  {{ resolveTitle(item) }}
                </div>
                <div v-if="cardSubtitleKey" class="data-card__subtitle">
                  {{ formatFallback(getValue(item, cardSubtitleKey)) }}
                </div>
              </div>

              <div v-if="actionsHeader" class="data-card__actions">
                <slot :name="`item.${actionsHeader.key}`" :item="item" />
              </div>
            </div>

            <dl v-if="cardHeaders.length" class="data-card__fields">
              <template v-for="header in cardHeaders" :key="String(header.key)">
                <dt class="data-card__label">{{ header.title }}</dt>
                <dd class="data-card__value">
                  <slot
                    :name="`item.${header.key}`"
                    :item="item"
                    :value="getValue(item, String(header.key))"
                  >
                    {{ formatFallback(getValue(item, String(header.key))) }}
                  </slot>
                </dd>
              </template>
            </dl>
          </slot>
        </v-card>
      </div>

      <!-- Paginación propia: v-data-iterator no cubre el modo servidor -->
      <div v-if="pageCount > 1" class="data-table-responsive__footer">
        <v-btn
          :disabled="currentPage <= 1"
          icon="mdi-chevron-left"
          variant="tonal"
          density="comfortable"
          aria-label="Previous page"
          @click="goToPage(currentPage - 1)"
        />
        <span class="data-table-responsive__page">
          Page {{ currentPage }} of {{ pageCount }}
        </span>
        <v-btn
          :disabled="currentPage >= pageCount"
          icon="mdi-chevron-right"
          variant="tonal"
          density="comfortable"
          aria-label="Next page"
          @click="goToPage(currentPage + 1)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { VDataTable, VDataTableServer } from 'vuetify/components'
import { useResponsive } from '@/composables/useResponsive'
import EmptyState from '@/components/common/EmptyState.vue'

/** Subconjunto de la cabecera de `v-data-table` que este componente necesita. */
export interface ResponsiveHeader {
  title: string
  key: string
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  width?: number | string
  /** Oculta la columna en la vista de tarjetas (p. ej. si ya está en el título). */
  hideOnCard?: boolean
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    headers: ResponsiveHeader[]
    items: readonly any[]
    loading?: boolean
    search?: string
    /** Paginación gestionada por el servidor. */
    server?: boolean
    /** Total de registros en el servidor. Obligatorio si `server`. */
    itemsLength?: number
    /** Página actual. Omitir para que la gestione la tabla. */
    page?: number
    /** Filas por página. Omitir para que la gestione la tabla. */
    itemsPerPage?: number
    itemsPerPageOptions?: Array<{ value: number; title: string }>
    /** Criterio de orden. Omitir para que lo gestione la tabla (orden en cliente). */
    sortBy?: any[]
    /** Campo usado como identificador estable de fila. */
    itemValue?: string
    /** Campo mostrado como título de la tarjeta en móvil. */
    cardTitleKey?: string
    /** Segundo campo del título; se concatena con `cardTitleKey`. */
    cardTitleKey2?: string
    cardSubtitleKey?: string
    /** Clave de la columna de acciones; se coloca en la cabecera de la tarjeta. */
    actionsKey?: string
    clickableRows?: boolean
    /** Filas expandibles (solo tabla; en móvil no aplica). El slot `expanded-row` pinta el contenido. */
    showExpand?: boolean
    /** Valores (`itemValue`) de las filas expandidas. Requiere `showExpand`. */
    expanded?: string[]
    /** Clase(s) CSS por fila (tabla) o por tarjeta (móvil), calculadas desde el item. */
    rowClass?: (item: any) => string | string[] | Record<string, boolean> | undefined
    noDataText?: string
    noDataDescription?: string
    noDataIcon?: string
  }>(),
  {
    loading: false,
    search: '',
    server: false,
    itemsLength: 0,
    itemValue: 'id',
    actionsKey: 'actions',
    clickableRows: false,
    noDataText: 'No data available',
    noDataIcon: 'mdi-database-off-outline',
    itemsPerPageOptions: () => [
      { value: 10, title: '10' },
      { value: 25, title: '25' },
      { value: 50, title: '50' },
      { value: 100, title: '100' },
    ],
  },
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:itemsPerPage', value: number): void
  (e: 'update:sortBy', value: any[]): void
  (e: 'click:row', item: any): void
  (e: 'update:expanded', value: string[]): void
}>()

const slots = useSlots()
const {
  mobile,
  tableDensity,
  itemsPerPage: responsiveItemsPerPage,
} = useResponsive()

const isMobile = computed(() => mobile.value)

/**
 * Valor inicial de filas por página cuando el padre no lo controla. Se captura
 * una sola vez a propósito: si fuese reactivo, cruzar un breakpoint al
 * redimensionar descartaría la elección del usuario.
 */
const initialItemsPerPage = props.itemsPerPage ?? responsiveItemsPerPage.value

const resolvedItemsPerPage = computed(
  () => props.itemsPerPage ?? initialItemsPerPage,
)

const skeletonRows = computed(() => Math.min(resolvedItemsPerPage.value, 6))

/**
 * Slots que se reenvían tal cual a la tabla. Se excluyen los que este
 * componente define por su cuenta, para no sobrescribirlos.
 */
const passthroughSlots = computed(() =>
  Object.keys(slots).filter(
    (name) => !['loading', 'no-data', 'empty', 'card'].includes(name),
  ),
)

const tableBindings = computed(() => {
  const bindings: Record<string, unknown> = {
    headers: props.headers,
    items: props.items,
    loading: props.loading,
    density: tableDensity.value,
    itemsPerPageOptions: props.itemsPerPageOptions,
    itemValue: props.itemValue,
    noDataText: props.noDataText,
    search: props.search,
    hover: true,
  }

  if (props.showExpand) {
    bindings.showExpand = true
    bindings.expanded = props.expanded ?? []
    bindings['onUpdate:expanded'] = (value: string[]) => emit('update:expanded', value)
  }

  if (props.clickableRows) {
    bindings['onClick:row'] = (_event: Event, payload: { item: any }) =>
      emit('click:row', payload.item)
  }

  if (props.rowClass) {
    const resolveRowClass = props.rowClass
    bindings.rowProps = ({ item }: { item: any }) => ({
      class: resolveRowClass(item),
    })
  }

  // Sólo se declara `onUpdate:*` cuando el padre controla el valor; si no,
  // Vuetify daría el modelo por controlado y su estado interno no tendría
  // efecto (el ordenado y el selector de filas quedarían muertos).
  if (props.itemsPerPage !== undefined) {
    bindings.itemsPerPage = props.itemsPerPage
    bindings['onUpdate:itemsPerPage'] = (value: number) =>
      emit('update:itemsPerPage', value)
  } else {
    bindings.itemsPerPage = initialItemsPerPage
  }

  if (props.sortBy !== undefined) {
    bindings.sortBy = props.sortBy
    bindings['onUpdate:sortBy'] = (value: any[]) => emit('update:sortBy', value)
  }

  if (props.server) {
    // En modo servidor la página siempre la manda el padre: la tabla no puede
    // paginar por su cuenta sobre un array que sólo contiene una página.
    bindings.page = props.page ?? 1
    bindings['onUpdate:page'] = (value: number) => emit('update:page', value)
    bindings.itemsLength = props.itemsLength
  }

  return bindings
})

// ── Vista móvil ────────────────────────────────────────────────

/** Página de la vista de tarjetas cuando la paginación es de cliente. */
const internalPage = ref(1)

/**
 * En modo servidor los items ya vienen paginados, así que se muestran todos.
 * En modo cliente se recorta aquí, con un tope bajo porque una lista larga de
 * tarjetas se hace incómoda de recorrer en un teléfono.
 */
const mobilePerPage = computed(() =>
  props.server ? resolvedItemsPerPage.value : Math.min(resolvedItemsPerPage.value, 10),
)

const currentPage = computed(() =>
  props.server ? (props.page ?? 1) : internalPage.value,
)

/** Filtro de búsqueda en cliente. En modo servidor los items ya vienen filtrados. */
const filteredItems = computed(() => {
  if (props.server || !props.search) return props.items
  const needle = props.search.toLowerCase()
  return props.items.filter((item) =>
    props.headers.some((header) => {
      const value = getValue(item, String(header.key))
      return value != null && String(value).toLowerCase().includes(needle)
    }),
  )
})

const totalCount = computed(() =>
  props.server ? props.itemsLength : filteredItems.value.length,
)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / mobilePerPage.value)),
)

const visibleItems = computed(() => {
  if (props.server) return props.items
  const start = (currentPage.value - 1) * mobilePerPage.value
  return filteredItems.value.slice(start, start + mobilePerPage.value)
})

// Al cambiar la búsqueda se vuelve a la primera página: quedarse en la 4 de un
// resultado de 2 páginas mostraría una lista vacía.
watch(
  () => props.search,
  () => {
    internalPage.value = 1
  },
)

/**
 * Con los datos no se reinicia la página, sólo se acota.
 *
 * Un `watch` sobre `props.items` reiniciaría por identidad del array, y hay
 * vistas que se auto-refrescan (Live staff activity recalcula su lista cada
 * 30s): el usuario acabaría devuelto a la página 1 constantemente. Acotar
 * cubre el único caso problemático —que el conjunto encoja por debajo de la
 * página actual— sin castigar el refresco.
 */
watch(pageCount, (count) => {
  if (internalPage.value > count) internalPage.value = count
})

function goToPage(value: number): void {
  const next = Math.min(Math.max(1, value), pageCount.value)
  if (next === currentPage.value) return
  if (props.server) emit('update:page', next)
  else internalPage.value = next
}

const actionsHeader = computed(() =>
  props.headers.find((header) => header.key === props.actionsKey),
)

/** Columnas del cuerpo de la tarjeta: sin acciones ni las ya usadas en la cabecera. */
const cardHeaders = computed(() =>
  props.headers.filter(
    (header) =>
      header.key !== props.actionsKey &&
      header.hideOnCard !== true &&
      header.key !== props.cardTitleKey &&
      header.key !== props.cardTitleKey2 &&
      header.key !== props.cardSubtitleKey,
  ),
)

/** Lee una ruta anidada del tipo `profile.employee_number`. */
function getValue(item: any, path: string): unknown {
  if (!path) return undefined
  return path
    .split('.')
    .reduce((acc: any, key) => (acc == null ? undefined : acc[key]), item)
}

function resolveTitle(item: any): string {
  const first = props.cardTitleKey ? getValue(item, props.cardTitleKey) : ''
  const second = props.cardTitleKey2 ? getValue(item, props.cardTitleKey2) : ''
  const title = [first, second].filter(Boolean).join(' ').trim()
  return title || '—'
}

/** Evita pintar "null"/"undefined" en la interfaz. */
function formatFallback(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return String(value)
}

function itemKey(item: any, index: number): string | number {
  const value = getValue(item, props.itemValue)
  return (value as string | number) ?? index
}

function onRowClick(item: any): void {
  if (props.clickableRows) emit('click:row', item)
}
</script>

<style scoped>
.data-table-responsive__table :deep(.v-data-table__td) {
  white-space: nowrap;
}

/* ─── Vista de tarjetas (móvil) ─────────────────────────────── */
.data-table-responsive__cards {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
}

.data-card {
  padding: var(--app-space-4);
}

.data-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.data-card__heading {
  min-width: 0;
}

.data-card__title {
  font-size: var(--app-text-md);
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.data-card__subtitle {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.data-card__actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
  flex-shrink: 0;
}

/**
 * Rejilla etiqueta/valor: la etiqueta ocupa lo que necesita y el valor se
 * lleva el resto, así una etiqueta larga no rompe la alineación del resto.
 */
.data-card__fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--app-space-2) var(--app-space-4);
  margin: 0;
  margin-top: var(--app-space-3);
  padding-top: var(--app-space-3);
  border-top: 1px solid rgba(var(--v-border-color), 1);
}

.data-card__label {
  font-size: var(--app-text-2xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  align-self: center;
}

.data-card__value {
  margin: 0;
  font-size: var(--app-text-base);
  text-align: end;
  overflow-wrap: anywhere;
  align-self: center;
}

/* ─── Paginación de la vista de tarjetas ────────────────────── */
.data-table-responsive__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  margin-top: var(--app-space-4);
}

.data-table-responsive__page {
  font-size: var(--app-text-sm);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
}
</style>
