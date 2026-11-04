<!--
  src/pages/permissions/index.vue

  Permisos de vista por usuario. Solo super_admin (lo exige el catálogo en `config/views.ts` y
  el endpoint PUT /users/:id/view-permissions de la auth API). Aquí se decide qué vistas del NIO
  puede abrir cada usuario; super_admin siempre tiene todas y no se puede restringir.
-->
<template>
  <PageContainer variant="fluid">
    <PageHeader title="Permissions" subtitle="Choose which views each user can open" />

    <div class="perm">
      <!-- Lista de usuarios -->
      <v-card class="perm__list">
        <div class="perm__search">
          <v-text-field
            v-model="search"
            label="Search by name, email or employee number"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            :density="density"
          />
        </div>
        <v-divider />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
          {{ error }}
        </v-alert>

        <v-table v-else hover density="comfortable" class="perm__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th class="text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-6"><v-progress-circular indeterminate size="22" /></td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="3" class="text-center py-6 text-medium-emphasis">No users found</td>
            </tr>
            <tr
              v-for="u in items"
              v-else
              :key="u.id"
              :class="{ 'perm__row--active': u.id === selectedId }"
              tabindex="0"
              @click="select(u)"
              @keydown.enter="select(u)"
            >
              <td>
                <div class="perm__name">{{ fullName(u) }}</div>
                <div class="perm__sub">{{ u.profile?.employee_number || u.email || '—' }}</div>
              </td>
              <td>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip v-for="role in u.roles" :key="role" size="x-small" variant="tonal">
                    {{ role.replace(/_/g, ' ') }}
                  </v-chip>
                </div>
              </td>
              <td class="text-right">
                <v-chip size="x-small" variant="tonal">
                  {{ `${u.viewPermissions?.length ?? 0} / ${VIEW_CATALOG.length}` }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-divider />
        <div class="perm__pager">
          <v-pagination v-model="page" :length="totalPages" :total-visible="5" density="comfortable" />
        </div>
      </v-card>

      <!-- Editor -->
      <v-card class="perm__editor">
        <template v-if="selected">
          <div class="perm__editor-head">
            <div>
              <div class="perm__name">{{ fullName(selected) }}</div>
              <div class="perm__sub">{{ selected.profile?.employee_number || selected.email || '—' }}</div>
            </div>
          </div>
          <v-divider />

          <div class="perm__editor-body">
            <div class="perm__presets">
              <v-btn size="small" variant="text" :disabled="locked" @click="draft = allKeys()">All views</v-btn>
              <!-- Activity Report deshabilitado temporalmente
              <v-btn size="small" variant="text" :disabled="locked" @click="draft = ['activity-report']">
                Employee default
              </v-btn>
              -->
              <v-btn size="small" variant="text" :disabled="locked" @click="draft = []">None</v-btn>
            </div>

            <v-checkbox
              v-for="view in VIEW_CATALOG"
              :key="view.key"
              v-model="draft"
              :value="view.key"
              :disabled="locked"
              hide-details
              density="compact"
            >
              <template #label>
                <div class="perm__view">
                  <v-icon size="18" class="mr-2">{{ view.icon }}</v-icon>
                  <div>
                    <div>{{ view.title }}</div>
                    <div class="perm__sub">{{ view.description }}</div>
                  </div>
                </div>
              </template>
            </v-checkbox>

            <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
              {{ saveError }}
            </v-alert>

            <div class="perm__actions">
              <v-btn variant="text" :disabled="!dirty || saving" @click="reset">Reset</v-btn>
              <v-btn color="primary" variant="flat" :loading="saving" :disabled="!dirty || locked" @click="save">
                Save
              </v-btn>
            </div>
          </div>
        </template>

        <EmptyState
          v-else
          icon="mdi-shield-key-outline"
          title="Select a user"
          description="Pick someone from the list to manage the views they can open."
        />
      </v-card>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="3000">Permissions updated.</v-snackbar>

    <!-- Candado de contraseña deshabilitado (04-nov-2026): ya no se pide contraseña para gestionar permisos.
    <v-dialog v-model="lockOpen" persistent max-width="400">
      <v-card>
        <v-card-title class="pt-5 px-6">Permissions password</v-card-title>
        <v-card-text class="px-6">
          <p class="perm__sub mb-3">Enter the password to manage permissions.</p>
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            label="Password"
            name="permissions-unlock-code"
            autocomplete="new-password"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click:append-inner="showPassword = !showPassword"
            autofocus
            hide-details="auto"
            :error-messages="unlockError"
            :disabled="unlocking"
            @keydown.enter="unlock"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="unlocking" @click="cancelUnlock">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="unlocking" :disabled="!password" @click="unlock">
            Unlock
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    -->
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { HOME_ROUTE } from '@/router/home'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useResponsive } from '@/composables/useResponsive'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { VIEW_CATALOG } from '@/config/views'
import { usersService } from '@/services/users.service'
import { useAuth } from '@/stores/auth/useAuth'
import type { UserResponse } from '@/types/auth'

const PAGE_SIZE = 15

const { density } = useResponsive()
const auth = useAuth()
const router = useRouter()

// Token de desbloqueo: solo en memoria, así que al recargar la página se vuelve a pedir.
const unlockToken = ref('')
const unlockExpires = ref(0)
const lockOpen = ref(false) // candado deshabilitado: ya no se pide contraseña
const password = ref('')
const showPassword = ref(false)
const unlockError = ref('')
const unlocking = ref(false)

// Candado deshabilitado: el servidor ya no exige el token de desbloqueo.
const isUnlocked = (): boolean => true

async function unlock(): Promise<void> {
  if (!password.value || unlocking.value) return
  unlocking.value = true
  unlockError.value = ''
  try {
    const { token, expiresAt } = await usersService.unlockPermissions(password.value)
    unlockToken.value = token
    unlockExpires.value = new Date(expiresAt).getTime()
    password.value = ''
    showPassword.value = false
    lockOpen.value = false
    void load()
  } catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status
    unlockError.value =
      status === 429
        ? 'Too many attempts. Try again in a few minutes.'
        : status === 503
          ? 'The server has no permissions password configured.'
          : 'Invalid password.'
    password.value = ''
  } finally {
    unlocking.value = false
  }
}

function cancelUnlock(): void {
  // Home; si no tiene acceso a él, el guard lo lleva a la primera vista permitida.
  void router.replace(HOME_ROUTE)
}

function relock(): void {
  unlockToken.value = ''
  unlockExpires.value = 0
  lockOpen.value = true
}

const search = ref('')
const debouncedSearch = useDebouncedRef(search, 350)
const page = ref(1)
const totalPages = ref(1)
const items = ref<UserResponse[]>([])
const loading = ref(false)
const error = ref('')

const selectedId = ref<string | null>(null)
const draft = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)
const saveError = ref('')

const selected = computed(() => items.value.find((u) => u.id === selectedId.value) ?? null)

const allKeys = (): string[] => VIEW_CATALOG.map((v) => v.key)
const locked = computed(() => !selected.value)

function fullName(u: UserResponse): string {
  const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ')
  return name || u.email || u.profile?.employee_number || u.id
}

const dirty = computed(() => {
  const current = selected.value?.viewPermissions ?? []
  return draft.value.length !== current.length || draft.value.some((v) => !current.includes(v))
})

function select(u: UserResponse): void {
  selectedId.value = u.id
  saveError.value = ''
  draft.value = [...(u.viewPermissions ?? [])]
}

function reset(): void {
  if (selected.value) select(selected.value)
}

async function load(): Promise<void> {
  if (!isUnlocked()) return
  loading.value = true
  error.value = ''
  try {
    const { data, meta } = await usersService.getFilteredUsers({
      search: debouncedSearch.value?.trim() || undefined,
      isActive: true,
      sortBy: 'firstName',
      sortDir: 'asc',
      page: page.value,
      limit: PAGE_SIZE,
    })
    items.value = data
    totalPages.value = Math.max(1, meta?.totalPages ?? 1)
    // Si la selección ya no está en la página, se limpia el editor.
    if (selectedId.value && !data.some((u) => u.id === selectedId.value)) selectedId.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not load users. Try again later.'
  } finally {
    loading.value = false
  }
}

async function save(): Promise<void> {
  const target = selected.value
  if (!target || !dirty.value || locked.value) return
  if (!isUnlocked()) return relock()
  saving.value = true
  saveError.value = ''
  try {
    const result = await usersService.setViewPermissions(target.id, draft.value, unlockToken.value)
    target.viewPermissions = result.viewPermissions
    draft.value = [...result.viewPermissions]
    saved.value = true
    // Si cambió sus propias vistas (otro super_admin no lo notaría hasta su próximo refresh).
    if (target.id === auth.user?.id) await auth.refreshMe(true)
  } catch (e: any) {
    if (e?.code === 'PERMISSIONS_LOCKED') return relock()
    const message = e?.message
    saveError.value = Array.isArray(message) ? message.join(', ') : message || 'Could not save the permissions.'
  } finally {
    saving.value = false
  }
}

watch(debouncedSearch, () => {
  page.value = 1
  void load()
})
watch(page, () => void load())
onMounted(() => void load())
</script>

<style scoped>
.perm {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 960px) {
  .perm {
    grid-template-columns: minmax(0, 1fr);
  }
}
.perm__search {
  padding: 12px 16px;
}
.perm__table tbody tr {
  cursor: pointer;
}
.perm__row--active {
  background: rgba(var(--v-theme-primary), 0.08);
}
.perm__name {
  font-weight: 500;
}
.perm__sub {
  font-size: 0.75rem;
  opacity: 0.7;
}
.perm__pager {
  display: flex;
  justify-content: center;
  padding: 8px;
}
.perm__editor-head {
  padding: 14px 20px;
}
.perm__editor-body {
  padding: 16px 20px 20px;
}
.perm__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.perm__view {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
}
.perm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
