<template>
  <v-container class="d-flex justify-center align-center" style="height: 100vh;">
    <v-card class="pa-6 rounded-xl elevation-3" width="1000">
      <div class="d-flex align-center mb-4">
        <div class="text-h6">Online / Active Sessions (auth_sessions)</div>
        <v-spacer></v-spacer>

        <!-- Toggle: ver todos vs solo míos -->
        <v-switch
          v-model="showAll"
          inset
          hide-details
          class="mr-4"
          :label="showAll ? 'All users' : 'Only me'"
          @change="loadDevices"
        />

        <v-btn :loading="loading.devices" variant="outlined" @click="loadDevices">
          Refresh
        </v-btn>
      </div>

      <!-- Tabla -->
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading.devices"
        item-key="deviceId"
        density="comfortable"
        class="elevation-1 rounded-lg"
        :no-data-text="loading.devices ? 'Loading…' : 'No hay sesiones activas'"
      >
        <!-- Columna: Nombre completo -->
        <template #item.fullName="{ item }">
          <div class="font-weight-medium">{{ item.fullName }}</div>
          <div v-if="item.email" class="text-caption text-medium-emphasis">{{ item.email }}</div>
        </template>

        <!-- Columna: Last used -->
        <template #item.lastUsedAt="{ item }">
          <div>{{ item.lastUsedAtFormatted }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.lastUsedAgo }}</div>
        </template>

        <!-- Columna: Acción (saludar) -->
        <template #item.actions="{ item }">
          <v-btn
            icon
            :loading="loading.helloId === item.deviceId"
            :disabled="loading.helloId === item.deviceId"
            @click="hello(item.deviceId)"
            :title="`Saludar a ${item.fullName || item.deviceId}`"
          >
            <v-icon>mdi-hand-back-right-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <!-- Acciones extra -->
      <div class="mt-6 d-flex gap-2">
        <v-btn color="primary" :loading="loading.clockOut" @click="onClockOut">
          Clock Out
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="red" :loading="loading.logOut" @click="onLogOut">
          Log Out
        </v-btn>
      </div>

      <!-- Mensajes -->
      <div v-if="lastError" class="mt-3 text-caption" style="color:#e53935;">
        {{ lastError }}
      </div>
      <div v-if="lastInfo" class="mt-3 text-caption" style="color:#1e88e5;">
        {{ lastInfo }}
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { http, ensureFreshAccessToken } from '@/lib/http'

const loading = ref({
  devices: false,
  helloId: null,
  clockOut: false,
  logOut: false,
})
const lastError = ref('')
const lastInfo = ref('')

const showAll = ref(false)     // /devices/online?all=true
const user = ref(null)         // user con profile cuando showAll = false
const devices = ref([])        // items crudos del backend

const headers = computed(() => ([
  { title: 'Full name', key: 'fullName', align: 'start' },
  { title: 'Client', key: 'client', align: 'start' },
  { title: 'Label', key: 'label', align: 'start' },
  { title: 'Device ID', key: 'deviceId', align: 'start' },
  { title: 'Last used', key: 'lastUsedAt', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]))

const rows = computed(() => {
  return devices.value.map(d => {
    // cuando all=true: cada device trae d.user;
    // cuando all=false: el controller también manda user arriba; usamos fallback
    const u = d.user ?? user.value ?? null
    const fullName = fullNameFromUser(u)
    const email = u?.email ?? null

    // backend: lastUsedAt | connectedAt | updatedAt | createdAt
    const last =
      d.lastUsedAt || d.connectedAt || d.updatedAt || d.createdAt || null
    const date = last ? new Date(last) : null

    return {
      deviceId: d.deviceId,
      client: d.client ?? '—',
      label: d.label ?? '—',
      fullName,
      email,
      lastUsedAtFormatted: date ? date.toLocaleString() : '—',
      lastUsedAgo: date ? timeAgo(date) : '',
    }
  })
})

/** Reintenta una vez si hay 401: refresca y repite la operación */
async function withAuthRetry(fn, label = '') {
  try {
    return await fn()
  } catch (e) {
    const status = e?.response?.status
    console.warn(`[retry] ${label} first try failed`, status, e?.message || e?.code)
    if (status === 401) {
      await ensureFreshAccessToken()
      return await fn()
    }
    throw e
  }
}

function messageForError(err) {
  const code = err?.code
  const status = err?.response?.status ?? err?.status
  const serverMsg = err?.response?.data?.message ?? err?.serverMessage

  if (code === 'NO_REFRESH_TOKEN') return 'No hay refresh token en esta web. Inicia sesión en la WEB para poder refrescar.'
  if (code === 'REFRESH_401' || status === 401) {
    const tail = serverMsg ? ` Detalle: ${serverMsg}` : ''
    return 'El servidor rechazó el refresh (401). Probable colisión WEB/ELECTRON. Inicia sesión nuevamente en la WEB.' + tail
  }
  if (code === 'BAD_REFRESH_RESPONSE') return 'El backend no devolvió tokens en el refresh.'
  if (code === 'NO_ACCESS_TOKEN_AFTER_PREFLIGHT') return 'No se pudo preparar un access token antes de la llamada.'
  return err?.response?.data?.message || err?.message || String(err)
}

function fullNameFromUser(u) {
  const fn = u?.profile?.firstName || ''
  const ln = u?.profile?.lastName || ''
  const name = `${fn} ${ln}`.trim()
  return name || (u?.email ?? 'Unknown')
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function loadDevices() {
  loading.value.devices = true
  lastError.value = ''
  lastInfo.value = ''
  try {
    const url = showAll.value ? '/devices/online?all=true' : '/devices/online'
    const res = await withAuthRetry(() => http.get(url), `GET ${url}`)

    // Back-end: { user, devices }
    user.value = res.data?.user ?? null
    devices.value = Array.isArray(res.data?.devices) ? res.data.devices : []

    lastInfo.value = `Sesiones activas: ${devices.value.length}`
  } catch (e) {
    console.error('[devices] load error:', e)
    lastError.value = messageForError(e)
  } finally {
    loading.value.devices = false
  }
}

async function hello(deviceId) {
  if (!deviceId) return
  loading.value.helloId = deviceId
  lastError.value = ''
  lastInfo.value = ''
  try {
    await withAuthRetry(
      () => http.post('/devices/hello', { deviceId, message: 'Hello from Web!' }),
      'POST /devices/hello'
    )
    lastInfo.value = `Hello enviado a ${deviceId}`
  } catch (e) {
    console.error('[hello] error:', e)
    lastError.value = messageForError(e)
  } finally {
    loading.value.helloId = null
  }
}

async function onClockOut() {
  loading.value.clockOut = true
  try {
    console.log('Clock Out clicked')
    // await withAuthRetry(() => http.post('/nova-in-out/clock-out', {...}), 'POST /nova-in-out/clock-out')
  } catch (e) {
    lastError.value = messageForError(e)
  } finally {
    loading.value.clockOut = false
  }
}

async function onLogOut() {
  loading.value.logOut = true
  try {
    console.log('Log Out clicked')
    // await withAuthRetry(() => http.post('/auth/logout'), 'POST /auth/logout')
  } catch (e) {
    lastError.value = messageForError(e)
  } finally {
    loading.value.logOut = false
  }
}

onMounted(loadDevices)
</script>
