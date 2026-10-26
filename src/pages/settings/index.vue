<!--
  src/pages/settings/index.vue

  Configuración global. Hoy solo el intervalo de captura: cada cuánto la app de
  escritorio registra actividad y toma la captura de pantalla de TODOS los
  empleados.
-->
<route lang="json">{
  "meta": {
    "roles": ["admin", "super_admin"]
  }
}</route>

<template>
  <PageContainer variant="narrow" align="start">
    <PageHeader title="Settings" subtitle="Global configuration for every employee" />

    <v-card>
      <div class="settings__head">
        <span class="app-eyebrow">Capture interval</span>
      </div>
      <v-divider />

      <div class="settings__body">
        <p class="settings__lead">
          How often the desktop app records activity and takes a screenshot. It applies to all
          employees.
        </p>

        <v-skeleton-loader v-if="loading" type="text, button" />

        <template v-else>
          <v-select
            v-model="selectedMinutes"
            :items="options"
            item-title="label"
            item-value="value"
            label="Interval"
            :density="density"
            :disabled="saving"
            hide-details="auto"
          />

          <p v-if="current" class="settings__meta">
            Current: <strong>{{ formatMinutes(current.seconds / 60) }}</strong>
            <template v-if="current.updatedAt"> · updated {{ updatedLabel }}</template>
            <template v-else> · default</template>
          </p>

          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            Devices that are online switch when their current interval ends. Devices that are
            offline pick it up the next time they connect or clock in. Records already saved keep
            the interval they were captured with, so past activity bars don't change.
          </v-alert>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
            {{ error }}
          </v-alert>

          <div class="settings__actions">
            <v-btn
              color="primary"
              variant="flat"
              :loading="saving"
              :disabled="!dirty"
              @click="save"
            >
              Save
            </v-btn>
          </div>
        </template>
      </div>
    </v-card>

    <v-snackbar v-model="saved" color="success" timeout="3500">
      Interval updated. Devices are being notified.
    </v-snackbar>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useResponsive } from '@/composables/useResponsive'
import { settingsService, type CaptureIntervalSetting } from '@/services/settings.service'

const { density } = useResponsive()

/** Minutos permitidos en la UI (el backend acepta cualquier múltiplo de 60 s entre 1 y 60 min; la UI ofrece solo estos). */
const MINUTE_OPTIONS = [5, 10, 15, 30, 60]

function formatMinutes(minutes: number): string {
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

const options = MINUTE_OPTIONS.map((value) => ({ value, label: formatMinutes(value) }))

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const current = ref<CaptureIntervalSetting | null>(null)
const selectedMinutes = ref<number | null>(null)

const dirty = computed(
  () => !!current.value && selectedMinutes.value !== null && selectedMinutes.value * 60 !== current.value.seconds,
)

const updatedLabel = computed(() =>
  current.value?.updatedAt ? new Date(current.value.updatedAt).toLocaleString() : '',
)

function apply(setting: CaptureIntervalSetting): void {
  current.value = setting
  selectedMinutes.value = setting.seconds / 60
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    apply(await settingsService.getCaptureInterval())
  } catch {
    error.value = 'Could not load the current setting. Try again later.'
  } finally {
    loading.value = false
  }
}

async function save(): Promise<void> {
  if (!dirty.value || selectedMinutes.value === null) return
  saving.value = true
  error.value = ''
  try {
    apply(await settingsService.updateCaptureInterval(selectedMinutes.value * 60))
    saved.value = true
  } catch (e: any) {
    const message = e?.message
    error.value = Array.isArray(message) ? message.join(', ') : message || 'Could not save the setting.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings__head {
  padding: 14px 20px;
}
.settings__body {
  padding: 20px;
}
.settings__lead {
  margin: 0 0 16px;
  color: rgb(var(--v-theme-on-surface-variant, var(--v-theme-on-surface)));
  font-size: 0.875rem;
}
.settings__meta {
  margin: 12px 0 0;
  font-size: 0.8125rem;
  opacity: 0.8;
}
.settings__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
