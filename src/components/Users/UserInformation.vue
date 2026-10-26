<!--
  src/components/Users/UserInformation.vue

  Ficha de usuario con modo lectura y modo edición.

  En lectura los datos se pintan como una rejilla etiqueta/valor que colapsa a
  una columna en móvil; en edición los mismos campos se convierten en inputs
  sin cambiar la estructura, para que no haya salto visual al alternar.
-->
<template>
  <div class="user-info">
    <!-- ═══ Cabecera ═══ -->
    <!--
      Sin avatar grande de color ni chips de rol repetidos: el nombre, el
      identificador y el estado bastan. El estado se marca con un punto, no con
      un bloque de color que compita con el resto de la ficha.
    -->
    <div class="user-info__header">
      <div class="user-info__identity">
        <h2 class="user-info__name">{{ isEditing ? 'Edit profile' : fullName }}</h2>

        <div class="user-info__meta">
          <span v-if="user.profile?.employee_number" class="app-mono">
            {{ user.profile.employee_number }}
          </span>
          <span v-if="user.email" class="user-info__email">{{ user.email }}</span>
          <span class="user-info__status">
            <span
              class="user-info__dot"
              :class="user.isActive ? 'user-info__dot--on' : 'user-info__dot--off'"
            />
            {{ user.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <v-btn
        variant="outlined"
        size="small"
        class="user-info__edit-btn"
        @click="toggleEdit"
      >
        {{ isEditing ? 'Cancel' : 'Edit' }}
      </v-btn>
    </div>

    <v-form ref="formRef" v-model="isFormValid" @submit.prevent="saveChanges">
      <!-- ═══ Información básica ═══ -->
      <v-card class="mb-4">
        <div class="user-info__section-head">
          <span class="app-eyebrow">Basic information</span>
        </div>
        <v-divider />

        <div class="user-info__section-body">
          <v-row>
            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">First name</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.profile.firstName"
                :rules="[rules.required]"
                :density="density"
                autocomplete="given-name"
                @update:model-value="recalcUsername"
              />
              <p v-else class="user-info__value">
                {{ display(user.profile?.firstName) }}
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Last name</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.profile.lastName"
                :rules="[rules.required]"
                :density="density"
                autocomplete="family-name"
                @update:model-value="recalcUsername"
              />
              <p v-else class="user-info__value">
                {{ display(user.profile?.lastName) }}
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Phone number</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.profile.phone"
                :rules="[rules.phoneMax, rules.phonePattern]"
                :density="density"
                maxlength="16"
                inputmode="tel"
              />
              <p v-else class="user-info__value">
                {{ display(user.profile?.phone) }}
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Birthdate</v-label>
              <v-menu
                v-if="isEditing"
                v-model="menuDate"
                :close-on-content-click="false"
                transition="scale-transition"
              >
                <template #activator="{ props: menuProps }">
                  <v-text-field
                    v-bind="menuProps"
                    v-model="formData.profile.birthdate"
                    :density="density"
                    append-inner-icon="mdi-calendar"
                    placeholder="YYYY-MM-DD"
                    readonly
                  />
                </template>
                <v-date-picker
                  v-model="datePickerValue"
                  color="primary"
                  @update:model-value="onDateSelected"
                />
              </v-menu>
              <p v-else class="user-info__value">
                {{ display(user.profile?.birthdate) }}
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Gender</v-label>
              <!--
                Sin `v-model`: al limpiarlo, `v-select` emite `null`, y el DTO
                del perfil usa `undefined` para "sin valor". Se normaliza aquí.
              -->
              <v-select
                v-if="isEditing"
                :model-value="formData.profile.gender ?? null"
                :items="genderOptions"
                :density="density"
                clearable
                @update:model-value="formData.profile.gender = $event ?? undefined"
              />
              <p v-else class="user-info__value">
                {{ display(user.profile?.gender) }}
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Employee number</v-label>
              <p class="user-info__value user-info__value--mono">
                {{ display(user.profile?.employee_number) }}
                <v-tooltip
                  v-if="isEditing"
                  text="Generated by the server and used to sign in. Not editable."
                  location="top"
                >
                  <template #activator="{ props: tip }">
                    <v-icon v-bind="tip" size="16" class="ms-1 text-medium-emphasis">
                      mdi-lock-outline
                    </v-icon>
                  </template>
                </v-tooltip>
              </p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">External employee number</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.profile.external_employee_number"
                :rules="[rules.externalEmployeeNumber]"
                :density="density"
                maxlength="50"
                autocomplete="off"
                spellcheck="false"
                hint="From the external HR app. Optional."
                persistent-hint
              />
              <p v-else class="user-info__value user-info__value--mono">
                {{ display(user.profile?.external_employee_number) }}
              </p>
            </v-col>
          </v-row>
        </div>
      </v-card>

      <!-- ═══ NIO + Activity Report ═══ -->
      <v-card class="mb-4">
        <div class="user-info__section-head">
          <span class="app-eyebrow">NIO / Activity Report clock</span>
        </div>
        <v-divider />
        <div class="user-info__section-body">
          <v-switch
            v-if="isEditing"
            v-model="formData.profile.activity_linked"
            label="Link NIO + Activity Report (AR): clock only from the AR, with the NIO app open"
            color="primary"
            inset
            hide-details="auto"
          />
          <p v-else class="user-info__value">
            <v-chip size="small" variant="tonal" :color="user.profile?.activity_linked ? 'primary' : undefined">
              {{ user.profile?.activity_linked ? 'NIO + AR (linked)' : 'NIO | AR (independent)' }}
            </v-chip>
          </p>
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            When linked, the clock button of the NIO desktop app is disabled, and the Activity Report (AR) can only
            Clock In / Clock Out while the user's NIO app is active.
          </p>
        </div>
      </v-card>

      <!-- ═══ Acceso ═══ -->
      <v-card class="mb-4">
        <div class="user-info__section-head">
          <span class="app-eyebrow">Access</span>
        </div>
        <v-divider />

        <div class="user-info__section-body">
          <v-row>
            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Email address</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.email"
                :rules="[rules.email]"
                :density="density"
                type="email"
                autocomplete="email"
              />
              <p v-else class="user-info__value">{{ display(user.email) }}</p>
            </v-col>

            <v-col v-bind="fieldCols">
              <v-label class="user-info__label">Username</v-label>
              <v-text-field
                v-if="isEditing"
                v-model="formData.profile.userName"
                :rules="[rules.userNameMax]"
                :density="density"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                @update:model-value="usernameTouched = true"
              />
              <p v-else class="user-info__value">
                {{ display(user.profile?.userName) }}
              </p>
            </v-col>

            <v-col v-bind="fieldColsWide">
              <v-label class="user-info__label">Roles</v-label>
              <v-select
                v-if="isEditing"
                v-model="formData.roles"
                :items="roleOptions"
                :rules="[rules.rolesRequired]"
                :density="density"
                multiple
                chips
                closable-chips
              />
              <div v-else class="user-info__value d-flex flex-wrap ga-1">
                <v-chip
                  v-for="role in user.roles"
                  :key="role"
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="text-capitalize"
                >
                  {{ role.replace(/_/g, ' ') }}
                </v-chip>
                <span v-if="!user.roles?.length">—</span>
              </div>
            </v-col>

            <v-col v-if="isEditing" cols="12">
              <v-switch
                v-model="formData.isActive"
                color="primary"
                :label="formData.isActive
                  ? 'Active — the user can sign in'
                  : 'Inactive — the user cannot sign in'"
              />
            </v-col>

            <!-- Cambio de contraseña, sólo en edición -->
            <template v-if="isEditing">
              <v-col cols="12">
                <v-divider class="mb-4" />
                <v-label class="user-info__label">
                  New password
                  <span class="text-caption ms-1 text-medium-emphasis">
                    (leave blank to keep the current one)
                  </span>
                </v-label>
              </v-col>

              <v-col v-bind="fieldCols">
                <v-text-field
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  :rules="newPassword ? [rules.passwordMin] : []"
                  :density="density"
                  placeholder="Min 8 characters"
                  autocomplete="new-password"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showNewPassword = !showNewPassword"
                />
              </v-col>

              <v-col v-bind="fieldCols">
                <v-text-field
                  v-model="confirmNewPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :rules="newPassword ? [rules.newPasswordMatch] : []"
                  :density="density"
                  placeholder="Repeat new password"
                  autocomplete="new-password"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                />
              </v-col>
            </template>
          </v-row>
        </div>
      </v-card>

      <v-expand-transition>
        <div v-if="isEditing" class="user-info__actions">
          <v-btn variant="text" :size="btnSize" :disabled="loading" @click="cancelEdit">
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            :size="btnSize"
            :loading="loading"
            :disabled="!isFormValid"
          >
            Save changes
          </v-btn>
        </div>
      </v-expand-transition>
    </v-form>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  Gender,
  Role,
  type UpdateUserDto,
  type UpdateUserProfileDto,
  type UserResponse,
} from '@/types/auth'
import { usersService } from '@/services/users.service'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps<{ user: UserResponse; autoEdit?: boolean }>()
const emit = defineEmits<{ (e: 'updated', user: UserResponse): void }>()

const { density, btnSize, fieldCols, fieldColsWide } = useResponsive()

const formRef = ref<any>(null)
const isFormValid = ref(false)
const isEditing = ref(false)
const loading = ref(false)
const menuDate = ref(false)
const datePickerValue = ref(null)

const newPassword = ref('')
const confirmNewPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

/**
 * Marca si el usuario ha tocado el campo de username. La versión anterior lo
 * regeneraba en cada pulsación sobre el nombre, pisando cualquier valor manual.
 */
const usernameTouched = ref(false)

const snackbar = reactive({ show: false, text: '', color: 'success' })

const genderOptions: string[] = Object.values(Gender)
const roleOptions = Object.values(Role).map((role) => ({
  title: role.replace(/_/g, ' '),
  value: role,
}))

/** Copia editable e independiente del usuario recibido. */
function snapshot(user: UserResponse) {
  return {
    email: user.email ?? '',
    roles: [...(user.roles ?? [])],
    isActive: user.isActive,
    profile: {
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      phone: user.profile?.phone ?? '',
      birthdate: user.profile?.birthdate ?? '',
      gender: user.profile?.gender ?? undefined,
      userName: user.profile?.userName ?? '',
      avatarUrl: user.profile?.avatarUrl ?? '',
      external_employee_number: user.profile?.external_employee_number ?? '',
      activity_linked: user.profile?.activity_linked ?? false,
    } as UpdateUserProfileDto,
  }
}

const formData = reactive(snapshot(props.user))

watch(
  () => props.user,
  (value) => {
    if (!value || isEditing.value) return
    Object.assign(formData, snapshot(value))
  },
  { deep: true },
)

onMounted(async () => {
  if (!props.autoEdit) return
  isEditing.value = true
  await nextTick()
  formRef.value?.validate()
})

const fullName = computed(() => {
  const name = [props.user.profile?.firstName, props.user.profile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name || props.user.profile?.employee_number || props.user.email || 'User'
})

const initials = computed(() => {
  const first = props.user.profile?.firstName?.trim()?.[0]
  const last = props.user.profile?.lastName?.trim()?.[0]
  if (first || last) return `${first ?? ''}${last ?? ''}`.toUpperCase()
  return fullName.value[0]?.toUpperCase() ?? 'U'
})

/** Evita que la ficha muestre huecos en blanco para campos sin valor. */
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

const rules = {
  required: (v: unknown) => !!v || 'This field is required',
  phoneMax: (v: string) => !v || v.length <= 16 || 'Max 16 characters',
  phonePattern: (v: string) =>
    !v || /^[+0-9]*$/.test(v) || 'Only numbers and + allowed',
  email: (v: string) => !v || /.+@.+\..+/.test(v) || 'E-mail must be valid',
  userNameMax: (v: string) => !v || v.length <= 200 || 'Max 200 characters',
  passwordMin: (v: string) => (!!v && v.length >= 8) || 'Min 8 characters',
  newPasswordMatch: (v: string) =>
    v === newPassword.value || 'Passwords do not match',
  rolesRequired: (v: Role[]) => (!!v && v.length > 0) || 'Pick at least one role',
  externalEmployeeNumber: (v?: string | null) =>
    !v || v.trim().length <= 50 || 'Max 50 characters',
}

watch(newPassword, () => {
  if (confirmNewPassword.value) formRef.value?.validate()
})

function buildUsername(firstName: string, lastName: string): string {
  const first = firstName.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const initial = lastName.trim()[0]?.toUpperCase() ?? ''
  return `${first}${initial}`
}

function recalcUsername(): void {
  if (usernameTouched.value) return
  const first = formData.profile.firstName ?? ''
  const last = formData.profile.lastName ?? ''
  if (first || last) formData.profile.userName = buildUsername(first, last)
}

function onDateSelected(value: unknown): void {
  if (!value) return
  const date = new Date(value as string)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  formData.profile.birthdate = `${year}-${month}-${day}`
  menuDate.value = false
}

async function toggleEdit(): Promise<void> {
  if (isEditing.value) {
    cancelEdit()
    return
  }
  isEditing.value = true
  await nextTick()
  formRef.value?.validate()
}

function cancelEdit(): void {
  Object.assign(formData, snapshot(props.user))
  newPassword.value = ''
  confirmNewPassword.value = ''
  usernameTouched.value = false
  isEditing.value = false
}

function notify(text: string, color: 'success' | 'error' = 'success'): void {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

/** Compone un PATCH sólo con lo que realmente cambió. */
function buildPayload(): UpdateUserDto {
  const payload: UpdateUserDto = {}
  const original = props.user

  if (formData.email !== (original.email ?? '')) {
    payload.email = formData.email || undefined
  }

  if (formData.isActive !== original.isActive) {
    payload.isActive = formData.isActive
  }

  const rolesChanged =
    formData.roles.length !== (original.roles?.length ?? 0) ||
    formData.roles.some((role) => !original.roles?.includes(role))
  if (rolesChanged) payload.roles = [...formData.roles]

  const profileChanges: UpdateUserProfileDto = {}
  const originalProfile = original.profile ?? ({} as UserResponse['profile'])

  for (const key of Object.keys(formData.profile) as Array<
    keyof UpdateUserProfileDto
  >) {
    const next = formData.profile[key] ?? ''
    const prev = (originalProfile as any)?.[key] ?? ''
    if (next !== prev) (profileChanges as any)[key] = formData.profile[key]
  }

  if (Object.keys(profileChanges).length > 0) payload.profile = profileChanges

  if (newPassword.value && newPassword.value === confirmNewPassword.value) {
    payload.password = newPassword.value
  }

  // Sin employee_number, un PATCH vacío basta para que el backend lo genere.
  if (!original.profile?.employee_number && Object.keys(payload).length === 0) {
    payload.profile = {}
  }

  return payload
}

async function saveChanges(): Promise<void> {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const payload = buildPayload()

  if (Object.keys(payload).length === 0) {
    isEditing.value = false
    notify('No changes to save.')
    return
  }

  loading.value = true
  try {
    const updated = await usersService.updateUser(props.user.id, payload)
    newPassword.value = ''
    confirmNewPassword.value = ''
    usernameTouched.value = false
    isEditing.value = false
    notify('Profile updated successfully.')
    emit('updated', updated)
  } catch (error: any) {
    const message = Array.isArray(error?.message)
      ? error.message[0]
      : error?.message
    notify(message || 'Error updating profile', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.user-info__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-4);
  padding-bottom: var(--app-space-4);
  margin-bottom: var(--app-space-4);
  border-bottom: 1px solid rgba(var(--v-border-color), 1);
}

.user-info__identity {
  min-width: 0;
}

.user-info__name {
  font-size: var(--app-text-lg);
  font-weight: 600;
  letter-spacing: var(--app-tracking-tighter);
  line-height: 1.25;
  margin: 0;
  overflow-wrap: anywhere;
}

.user-info__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-1) var(--app-space-4);
  margin-top: var(--app-space-2);
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.user-info__email {
  overflow-wrap: anywhere;
}

.user-info__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-info__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.user-info__dot--on {
  background: rgb(var(--v-theme-success));
}

.user-info__dot--off {
  background: rgb(var(--v-theme-error));
}

.user-info__edit-btn {
  flex-shrink: 0;
}

.user-info__section-head {
  padding: var(--app-space-3) var(--app-space-4);
}

.user-info__section-body {
  padding: var(--app-space-4);
}

.user-info__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--app-text-xs);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 1;
}

/**
 * La altura mínima iguala la de un input `comfortable`, de forma que alternar
 * entre lectura y edición no desplaza el resto del formulario.
 */
.user-info__value {
  display: flex;
  align-items: center;
  min-height: 2.25rem;
  margin: 0;
  font-size: var(--app-text-md);
  overflow-wrap: anywhere;
}

.user-info__value--mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgb(var(--v-theme-on-surface-variant));
}

.user-info__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

@media (max-width: 600px) {
  .user-info__header {
    flex-direction: column;
    align-items: stretch;
  }

  .user-info__identity {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-info__edit-btn {
    align-self: flex-end;
  }

  .user-info__section-body {
    padding: var(--app-space-4);
  }

  .user-info__actions > * {
    flex: 1 1 auto;
  }
}
</style>
