<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Active Sessions</h1>
        <div class="app-page-subtitle">
          Online / active sessions from auth_sessions
        </div>
      </div>

      <div class="app-toolbar">
        <v-switch
          v-model="showAll"
          hide-details
          density="compact"
          color="primary"
          :label="showAll ? 'All users' : 'Only me'"
          @change="loadDevices"
        />

        <v-btn
          :loading="loading.devices"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="loadDevices"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <v-card class="app-card" elevation="0">
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading.devices"
        item-key="deviceId"
        density="comfortable"
        class="app-table"
        :no-data-text="loading.devices ? 'Loading…' : 'No active sessions'"
      >
        <template #item.fullName="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar
              size="32"
              color="primary"
              class="text-white text-caption font-weight-bold"
            >
              {{ (item.fullName?.[0] || "?").toUpperCase() }}
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.fullName }}</div>
              <div v-if="item.email" class="text-caption text-medium-emphasis">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <template #item.client="{ item }">
          <v-chip size="x-small" variant="tonal" color="info">{{
            item.client
          }}</v-chip>
        </template>

        <template #item.lastUsedAt="{ item }">
          <div class="text-body-2">{{ item.lastUsedAtFormatted }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ item.lastUsedAgo }}
          </div>
        </template>

        <template #item.actions="{ item }">
          <v-tooltip
            :text="`Greet ${item.fullName || item.deviceId}`"
            location="top"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-hand-back-right-outline"
                size="small"
                variant="text"
                color="primary"
                :loading="loading.helloId === item.deviceId"
                :disabled="loading.helloId === item.deviceId"
                @click="hello(item.deviceId)"
              />
            </template>
          </v-tooltip>
        </template>
      </v-data-table>

      <v-divider />

      <div class="d-flex align-center pa-4 ga-2 flex-wrap">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-clock-out"
          :loading="loading.clockOut"
          @click="onClockOut"
        >
          Clock Out
        </v-btn>
        <v-spacer />
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-logout"
          :loading="loading.logOut"
          @click="onLogOut"
        >
          Log Out
        </v-btn>
      </div>

      <div class="px-4 pb-4">
        <v-alert
          v-if="lastError"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
        >
          {{ lastError }}
        </v-alert>
        <v-alert
          v-if="lastInfo"
          type="info"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-2"
        >
          {{ lastInfo }}
        </v-alert>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { http, ensureFreshAccessToken } from "@/lib/http";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const { smAndDown } = useDisplay();

const loading = ref({
  devices: false,
  helloId: null,
  clockOut: false,
  logOut: false,
});
const lastError = ref("");
const lastInfo = ref("");

const showAll = ref(false); // /devices/online?all=true
const user = ref(null); // user con profile cuando showAll = false
const devices = ref([]); // items crudos del backend

const headers = computed(() => [
  { title: "Full name", key: "fullName", align: "start" },
  { title: "Client", key: "client", align: "start" },
  { title: "Label", key: "label", align: "start" },
  { title: "Device ID", key: "deviceId", align: "start" },
  { title: "Last used", key: "lastUsedAt", align: "start" },
  { title: "", key: "actions", sortable: false, align: "end" },
]);

const rows = computed(() => {
  return devices.value.map((d) => {
    // cuando all=true: cada device trae d.user;
    // cuando all=false: el controller también manda user arriba; usamos fallback
    const u = d.user ?? user.value ?? null;
    const fullName = fullNameFromUser(u);
    const email = u?.email ?? null;

    // backend: lastUsedAt | connectedAt | updatedAt | createdAt
    const last =
      d.lastUsedAt || d.connectedAt || d.updatedAt || d.createdAt || null;
    const date = last ? new Date(last) : null;

    return {
      deviceId: d.deviceId,
      client: d.client ?? "—",
      label: d.label ?? "—",
      fullName,
      email,
      lastUsedAtFormatted: date ? date.toLocaleString() : "—",
      lastUsedAgo: date ? timeAgo(date) : "",
    };
  });
});

/** Reintenta una vez si hay 401: refresca y repite la operación */
async function withAuthRetry(fn, label = "") {
  try {
    return await fn();
  } catch (e) {
    const status = e?.response?.status;
    console.warn(
      `[retry] ${label} first try failed`,
      status,
      e?.message || e?.code,
    );
    if (status === 401) {
      await ensureFreshAccessToken();
      return await fn();
    }
    throw e;
  }
}

function messageForError(err) {
  const code = err?.code;
  const status = err?.response?.status ?? err?.status;
  const serverMsg = err?.response?.data?.message ?? err?.serverMessage;

  if (code === "NO_REFRESH_TOKEN")
    return "No hay refresh token en esta web. Inicia sesión en la WEB para poder refrescar.";
  if (code === "REFRESH_401" || status === 401) {
    const tail = serverMsg ? ` Detalle: ${serverMsg}` : "";
    return (
      "El servidor rechazó el refresh (401). Probable colisión WEB/ELECTRON. Inicia sesión nuevamente en la WEB." +
      tail
    );
  }
  if (code === "BAD_REFRESH_RESPONSE")
    return "El backend no devolvió tokens en el refresh.";
  if (code === "NO_ACCESS_TOKEN_AFTER_PREFLIGHT")
    return "No se pudo preparar un access token antes de la llamada.";
  return err?.response?.data?.message || err?.message || String(err);
}

function fullNameFromUser(u) {
  const fn = u?.profile?.firstName || "";
  const ln = u?.profile?.lastName || "";
  const name = `${fn} ${ln}`.trim();
  return name || (u?.email ?? "Unknown");
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function loadDevices() {
  loading.value.devices = true;
  lastError.value = "";
  lastInfo.value = "";
  try {
    const url = showAll.value ? "/devices/online?all=true" : "/devices/online";
    const res = await withAuthRetry(() => http.get(url), `GET ${url}`);

    // Back-end: { user, devices }
    user.value = res.data?.user ?? null;
    devices.value = Array.isArray(res.data?.devices) ? res.data.devices : [];

    lastInfo.value = `Sesiones activas: ${devices.value.length}`;
  } catch (e) {
    console.error("[devices] load error:", e);
    lastError.value = messageForError(e);
  } finally {
    loading.value.devices = false;
  }
}

async function hello(deviceId) {
  if (!deviceId) return;
  loading.value.helloId = deviceId;
  lastError.value = "";
  lastInfo.value = "";
  try {
    await withAuthRetry(
      () =>
        http.post("/devices/hello", { deviceId, message: "Hello from Web!" }),
      "POST /devices/hello",
    );
    lastInfo.value = `Hello enviado a ${deviceId}`;
  } catch (e) {
    console.error("[hello] error:", e);
    lastError.value = messageForError(e);
  } finally {
    loading.value.helloId = null;
  }
}

async function onClockOut() {
  loading.value.clockOut = true;
  try {
    console.log("Clock Out clicked");
    // await withAuthRetry(() => http.post('/nova-in-out/clock-out', {...}), 'POST /nova-in-out/clock-out')
  } catch (e) {
    lastError.value = messageForError(e);
  } finally {
    loading.value.clockOut = false;
  }
}

async function onLogOut() {
  loading.value.logOut = true;
  try {
    console.log("Log Out clicked");
    // await withAuthRetry(() => http.post('/auth/logout'), 'POST /auth/logout')
  } catch (e) {
    lastError.value = messageForError(e);
  } finally {
    loading.value.logOut = false;
  }
}

onMounted(loadDevices);
</script>
