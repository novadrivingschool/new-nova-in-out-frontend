<template>
  <PageContainer variant="fluid">
    <PageHeader title="Users" subtitle="Manage system users and permissions">
      <template #actions>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :size="btnSize"
          :loading="loading"
          @click="fetchUsers"
        >
          Refresh
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-account-plus"
          :size="btnSize"
          @click="router.push('/users/add')"
        >
          Add user
        </v-btn>
      </template>
    </PageHeader>

    <v-card>
      <!-- ── Barra de búsqueda y filtros ── -->
      <div class="users__toolbar">
        <v-text-field
          v-model="search"
          placeholder="Search by name, email or employee number…"
          prepend-inner-icon="mdi-magnify"
          :density="density"
          clearable
          hide-details
          class="users__search"
          aria-label="Search users"
        />

        <v-select
          v-model="filters.isActive"
          :items="statusOptions"
          label="Status"
          :density="density"
          hide-details
          class="users__filter"
        />

        <v-select
          v-model="filters.roles"
          :items="roleOptions"
          label="Roles"
          :density="density"
          multiple
          chips
          closable-chips
          hide-details
          class="users__filter"
        />

        <v-spacer class="d-none d-md-block" />

        <span class="users__count">
          {{ totalItems }} {{ totalItems === 1 ? 'user' : 'users' }}
        </span>
      </div>

      <v-divider />

      <!-- ── Tabla / tarjetas ── -->
      <DataTableResponsive
        server
        :headers="headers"
        :items="users"
        :items-length="totalItems"
        :loading="loading"
        :page="page"
        :items-per-page="limit"
        :sort-by="sortBy"
        card-title-key="profile.firstName"
        card-title-key2="profile.lastName"
        card-subtitle-key="profile.employee_number"
        clickable-rows
        :row-class="rowClass"
        no-data-text="No users found"
        :no-data-description="
          hasActiveFilters
            ? 'No user matches the current filters.'
            : 'Create the first user to get started.'
        "
        no-data-icon="mdi-account-search-outline"
        @update:page="page = $event"
        @update:items-per-page="limit = $event"
        @update:sort-by="sortBy = $event"
        @click:row="openUser"
      >
        <template #item.profile.employee_number="{ item }">
          <span class="users__employee-number">
            {{ item.profile?.employee_number ?? '—' }}
          </span>
        </template>

        <template #item.email="{ item }">
          <span class="text-truncate d-inline-block users__email">
            {{ item.email || '—' }}
          </span>
        </template>

        <template #item.roles="{ item }">
          <div class="d-flex flex-wrap ga-1 justify-end justify-md-start">
            <v-chip
              v-for="role in item.roles"
              :key="role"
              size="x-small"
              variant="tonal"
              :color="roleColor(role)"
            >
              {{ role.replace(/_/g, ' ') }}
            </v-chip>
          </div>
        </template>

        <template #header.profile.activity_linked="{ column }">
          <span class="d-inline-flex align-center ga-1">
            {{ column.title }}
            <v-tooltip location="top" max-width="320">
              <template #activator="{ props: tip }">
                <v-icon v-bind="tip" size="16" tabindex="0" aria-label="About clock mode">
                  mdi-information-outline
                </v-icon>
              </template>
              <!-- NIO + AR deshabilitado: el NIO ya no tiene Activity Report propio.
              <div class="mb-1">
                <strong>NIO + AR</strong>: the employee clocks only from the NIO Activity Report (AR) and the NIO desktop
                app must be open. The NIO app's clock button is disabled.
              </div>
              -->
              <div class="mb-1">
                <strong>NIO + AR VOUT</strong>: same, but with the external Activity Report (Vout), which commands the NIO app.
              </div>
              <div>
                <strong>NIO</strong>: not linked; the employee clocks from the NIO app.
              </div>
              <div class="mt-1">Changes apply immediately.</div>
            </v-tooltip>
          </span>
        </template>

        <template #item.profile.activity_linked="{ item }">
          <div class="d-flex justify-center" @click.stop>
            <v-menu location="bottom">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  :color="isLinkedMode(item) ? 'primary' : undefined"
                  :variant="isLinkedMode(item) ? 'flat' : 'outlined'"
                  :prepend-icon="isLinkedMode(item) ? 'mdi-link-variant' : 'mdi-link-variant-off'"
                  :loading="linkingId === item.id"
                  :disabled="linkingId !== null || !item.profile"
                  size="small"
                  rounded="pill"
                  class="users__link-btn text-capitalize"
                  :aria-label="`Clock mode for ${item.profile?.employee_number ?? 'user'}: ${arModeLabel(item.profile)}. Click to change`"
                >
                  {{ arModeLabel(item.profile) }}
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="opt in AR_MODE_OPTIONS"
                  :key="opt.mode"
                  :active="arModeOf(item.profile) === opt.mode"
                  :disabled="opt.mode === 'NIO_AR_VOUT' && !item.profile?.external_employee_number"
                  :title="opt.title"
                  :subtitle="opt.mode === 'NIO_AR_VOUT' && !item.profile?.external_employee_number ? 'Needs the external employee number' : opt.subtitle"
                  @click="setArMode(item, opt.mode)"
                />
              </v-list>
            </v-menu>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1" @click.stop>
            <v-tooltip text="Edit user" location="top">
              <template #activator="{ props: tip }">
                <v-btn
                  v-bind="tip"
                  icon="mdi-pencil-outline"
                  variant="text"
                  size="small"
                  color="primary"
                  aria-label="Edit user"
                  @click="router.push(`/users/${item.id}?edit=true`)"
                />
              </template>
            </v-tooltip>

            <v-tooltip
              :text="item.isActive ? 'Disable user' : 'Activate user'"
              location="top"
            >
              <template #activator="{ props: tip }">
                <v-btn
                  v-bind="tip"
                  :icon="item.isActive ? 'mdi-account-off-outline' : 'mdi-account-check-outline'"
                  :color="item.isActive ? 'error' : 'success'"
                  :aria-label="item.isActive ? 'Disable user' : 'Activate user'"
                  variant="text"
                  size="small"
                  @click="confirmStatusChange(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </DataTableResponsive>
    </v-card>

    <!-- ── Confirmación ── -->
    <BaseDialog
      :title="dialogConfig.title"
      :show="showDialog"
      :icon="dialogConfig.icon ?? undefined"
      :loading="dialogLoading"
      @close="showDialog = false"
    >
      <template #dialog-body>
        <p class="text-body-1">{{ dialogConfig.description }}</p>
      </template>
      <template #dialog-actions>
        <v-btn variant="text" :disabled="dialogLoading" @click="showDialog = false">
          Cancel
        </v-btn>
        <v-btn
          v-for="action in dialogConfig.actions"
          :key="action.label"
          :disabled="dialogLoading"
          :loading="dialogLoading"
          :color="action.btnColor"
          variant="flat"
          @click="action.onClick"
        >
          {{ action.label }}
        </v-btn>
      </template>
    </BaseDialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </PageContainer>
</template>

<script setup lang="ts">
import { AR_MODE_LABEL, arFlagsOf, arModeLabel, arModeOf, type ArMode } from '@/utils/arMode'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usersService } from '@/services/users.service'
import {
  Role,
  type UserResponse,
  type UserSortField,
  type UsersQueryFilterDto,
} from '@/types/auth'
import type { DialogConfig } from '@/types/ui/base-dialog'
import { useResponsive } from '@/composables/useResponsive'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import DataTableResponsive, {
  type ResponsiveHeader,
} from '@/components/common/DataTableResponsive.vue'

const router = useRouter()
const { density, btnSize, itemsPerPage } = useResponsive()

const users = ref<UserResponse[]>([])
const loading = ref(false)
const totalItems = ref(0)

const page = ref(1)
const limit = ref(itemsPerPage.value)

/**
 * El orden lo aplica el servidor. `v-data-table` emite un array; sólo se usa el
 * primer criterio porque el backend ordena por un único campo.
 */
const sortBy = ref<Array<{ key: string; order?: 'asc' | 'desc' }>>([
  { key: 'profile.employee_number', order: 'asc' },
])

/** Traduce la clave de columna de la tabla al campo que espera la API. */
const SORT_FIELD_BY_COLUMN: Record<string, UserSortField> = {
  'profile.employee_number': 'employee_number',
  'profile.firstName': 'firstName',
  'profile.lastName': 'lastName',
  email: 'email',
  isActive: 'isActive',
}

// El input escribe en `search`; la consulta la dispara la copia retardada, de
// modo que escribir "gonzalez" lanza una petición y no ocho.
// `clearable` emite `null` al pulsar la X, de ahí el `?? ''`.
const search = ref<string | null>('')
const debouncedSearch = useDebouncedRef(search, 350)

// `isActive` admite `null` porque la opción "All" del select lo usa como
// "sin filtro"; se traduce a `undefined` al construir la petición.
const filters = reactive<{
  isActive: boolean | null
  roles: UsersQueryFilterDto['roles']
}>({
  isActive: true,
  roles: [],
})

/**
 * "All" usa `null` y no `undefined`: `v-select` sustituye un `value` indefinido
 * por el `title`, con lo que el filtro acabaría enviando la cadena "All".
 * La conversión a `undefined` se hace al construir la petición.
 */
const statusOptions = [
  { title: 'Active', value: true },
  { title: 'Inactive', value: false },
  { title: 'All', value: null },
]

const roleOptions = Object.values(Role).map((role) => ({
  title: role.replace(/_/g, ' '),
  value: role,
}))

const headers: ResponsiveHeader[] = [
  { title: 'Employee #', key: 'profile.employee_number' },
  { title: 'First name', key: 'profile.firstName' },
  { title: 'Last name', key: 'profile.lastName' },
  { title: 'Email', key: 'email' },
  { title: 'Roles', key: 'roles', sortable: false },
  { title: 'NIO / AR clock', key: 'profile.activity_linked', sortable: false, align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

/**
 * "Hay filtros activos" significa que el usuario se ha desviado del estado por
 * defecto (activos, sin búsqueda ni roles). Sirve para distinguir "no hay
 * resultados con estos filtros" de "todavía no hay usuarios".
 */
const hasActiveFilters = computed(
  () =>
    !!search.value?.trim() ||
    filters.isActive !== true ||
    !!filters.roles?.length,
)

function roleColor(role: string): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'error'
    case Role.ADMIN:
      return 'accent'
    case Role.EMPLOYEE:
      return 'primary'
    default:
      return 'secondary'
  }
}

async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const activeSort = sortBy.value[0]
    const response = await usersService.getFilteredUsers({
      page: page.value,
      limit: limit.value,
      // `null` (opción "All") se traduce a "sin filtro" para la API.
      isActive: filters.isActive ?? undefined,
      roles: filters.roles?.length ? filters.roles : undefined,
      search: debouncedSearch.value?.trim() || undefined,
      sortBy: activeSort ? SORT_FIELD_BY_COLUMN[activeSort.key] : undefined,
      sortDir: activeSort?.order ?? 'asc',
    })
    users.value = response.data
    totalItems.value = response.meta.totalItems
    console.log('[USERS][vista] pintando', users.value.length, 'filas | totalItems:', totalItems.value, '| page:', page.value, '| limit:', limit.value)
  } catch (error) {
    console.error('[USERS][vista] error al cargar la lista:', error)
    console.error('Error fetching users:', error)
    notify('Could not load users. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}

// Cambiar filtros o el tamaño de página debe devolvernos a la primera página:
// quedarse en la página 7 de un resultado de 2 páginas muestra una lista vacía.
// Cambiar filtros, orden o tamaño de página vuelve a la primera: quedarse en la
// página 7 de un resultado de 2 páginas muestra una lista vacía.
// Poner `page = 1` ya dispara el watcher de `page`, de ahí el `else`.
watch(
  () => [
    filters.isActive,
    filters.roles,
    limit.value,
    debouncedSearch.value,
    sortBy.value,
  ],
  () => {
    if (page.value !== 1) page.value = 1
    else fetchUsers()
  },
  { deep: true },
)

watch(page, fetchUsers)

fetchUsers()

/** El estado se comunica con el color de la fila: verde suave activo, rojo suave inactivo. */
function rowClass(item: UserResponse): string {
  return item.isActive ? 'users__row--active' : 'users__row--inactive'
}

function openUser(item: UserResponse): void {
  router.push(`/users/${item.id}`)
}

// ── Confirmación de activar/desactivar ─────────────────────────
const showDialog = ref(false)
const dialogLoading = ref(false)
const dialogConfig = reactive<DialogConfig>({
  title: '',
  description: '',
  icon: '',
  actions: [],
})

const snackbar = reactive({ show: false, text: '', color: 'success' })

function notify(text: string, color: 'success' | 'error' = 'success'): void {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function confirmStatusChange(item: UserResponse): void {
  const activate = !item.isActive
  const name =
    [item.profile?.firstName, item.profile?.lastName].filter(Boolean).join(' ') ||
    item.profile?.employee_number ||
    'This user'

  dialogConfig.title = activate ? 'Activate user?' : 'Disable user?'
  dialogConfig.description = activate
    ? `${name} will be re-activated and able to log in again.`
    : `${name} will be disabled and won't be able to log in.`
  dialogConfig.icon = activate
    ? 'mdi-account-check-outline'
    : 'mdi-account-off-outline'
  dialogConfig.actions = [
    {
      label: activate ? 'Activate' : 'Disable',
      btnColor: activate ? 'success' : 'error',
      onClick: () => switchStatus(item.id, activate),
    },
  ]
  showDialog.value = true
}

// ── Modo vinculado NIO + Activity ──────────────────────────────
const linkingId = ref<string | null>(null)

const AR_MODE_OPTIONS: { mode: ArMode; title: string; subtitle: string }[] = [
  { mode: 'NIO_INDEPENDENT', title: AR_MODE_LABEL.NIO_INDEPENDENT, subtitle: 'Not linked: clocks from the NIO app' },
  // Deshabilitado (04-nov-2026): el NIO ya no tiene Activity Report propio.
  // { mode: 'NIO_AR', title: AR_MODE_LABEL.NIO_AR, subtitle: 'Linked to the NIO Activity Report' },
  { mode: 'NIO_AR_VOUT', title: AR_MODE_LABEL.NIO_AR_VOUT, subtitle: 'Linked to the Vout Activity Report' },
]

const isLinkedMode = (item: UserResponse): boolean =>
  !!item.profile?.activity_linked || !!item.profile?.use_external_ar

/** NIO + AR y NIO + AR VOUT son excluyentes y ambos vinculan al NIO; "NIO | AR" los apaga. */
async function setArMode(item: UserResponse, mode: ArMode): Promise<void> {
  if (!item.profile || linkingId.value || arModeOf(item.profile) === mode) return
  const previous = {
    activity_linked: !!item.profile.activity_linked,
    use_external_ar: !!item.profile.use_external_ar,
  }
  const next = arFlagsOf(mode)
  linkingId.value = item.id
  Object.assign(item.profile, next) // optimista; se revierte si falla
  try {
    await usersService.updateUser(item.id, { profile: next })
    notify(`Mode set to ${AR_MODE_LABEL[mode]}`)
  } catch (error) {
    console.error(error)
    Object.assign(item.profile, previous)
    notify('Could not update the clock mode.', 'error')
  } finally {
    linkingId.value = null
  }
}

async function switchStatus(id: string, activate: boolean): Promise<void> {
  dialogLoading.value = true
  try {
    await usersService.switchStatus(id, activate)
    showDialog.value = false
    notify(activate ? 'User activated' : 'User disabled')
    await fetchUsers()
  } catch (error) {
    console.error(error)
    notify('Could not update the user status.', 'error')
  } finally {
    dialogLoading.value = false
  }
}
</script>

<style scoped>
.users__link-btn { min-width: 8.5rem; letter-spacing: 0; }
.users__link-btn:not(.v-btn--variant-flat) {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  border-color: rgba(var(--v-theme-on-surface), 0.4);
}
.users__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
}

/* Crece para llenar el espacio libre, pero no baja de un ancho usable */
.users__search {
  flex: 1 1 16rem;
  min-width: 12rem;
}

.users__filter {
  flex: 0 1 11rem;
  min-width: 9rem;
}

.users__count {
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.users__employee-number {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.users__email {
  max-width: 16rem;
  vertical-align: middle;
}

/* Color de fila por estado (sustituye la columna Status). Tonos suaves sobre el
   tema, así funcionan igual en claro y oscuro. */
:deep(tr.users__row--active > td),
:deep(.data-card.users__row--active) {
  background-color: rgba(var(--v-theme-success), 0.07);
}

:deep(tr.users__row--inactive > td),
:deep(.data-card.users__row--inactive) {
  background-color: rgba(var(--v-theme-error), 0.09);
}

@media (max-width: 600px) {
  .users__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .users__count {
    text-align: center;
  }
}
</style>
