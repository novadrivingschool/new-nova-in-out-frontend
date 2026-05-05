<template>
  <!-- TOP NAVBAR -->
  <v-app-bar
    app
    flat
    color="surface"
    height="64"
    class="app-appbar"
  >
    <v-app-bar-nav-icon
      v-if="smAndDown"
      class="ms-1"
      @click="drawerOpen = !drawerOpen"
    />

    <div class="d-flex align-center ga-3 ms-2">
      <div class="app-brand-logo">
        <v-icon size="22" color="primary">mdi-car-cog</v-icon>
      </div>
      <div class="d-none d-sm-block">
        <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.1;">
          NOVA <span class="text-primary">IO</span>
        </div>
        <div class="text-caption text-medium-emphasis" style="letter-spacing: 0.04em;">
          CRM Dashboard
        </div>
      </div>
    </div>

    <v-spacer />

    <!-- BOTÓN DE TEMA -->
    <v-tooltip text="Toggle theme" location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="small"
          class="me-1"
          @click="isDarkTheme = !isDarkTheme"
        >
          <v-icon>{{
            isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
          }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- LOGOUT -->
    <v-tooltip text="Log out" location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="small"
          class="me-2"
          color="error"
          @click="handleLogout"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </v-app-bar>

  <!-- LEFT SIDEBAR -->
  <v-navigation-drawer
    v-if="!isLoginPage"
    v-model="drawerOpen"
    :temporary="smAndDown"
    :permanent="!smAndDown"
    app
    :width="280"
    color="surface"
    class="app-drawer"
  >
    <div class="app-drawer-content">
      <v-list nav density="comfortable" class="pa-2">
        <!-- SOCKET / TEST GROUP (manteniendo lógica existente) -->
        <v-list-subheader>Workspace</v-list-subheader>
        <v-list-item
          v-for="virtual in socket"
          :key="`socket-${virtual.route}`"
          :to="virtual.route"
          :title="virtual.title"
          :prepend-icon="virtual.icon"
          link
        />
      </v-list>
    </div>

    <!-- Footer con info del usuario -->
    <template #append>
      <div class="app-drawer-footer">
        <v-divider class="mb-3" />
        <div class="d-flex align-center ga-3 px-2 pb-2">
          <v-avatar size="36" color="primary" class="text-white font-weight-bold">
            {{ userInitial }}
          </v-avatar>
          <div class="flex-grow-1" style="min-width: 0;">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ userLabel }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ userEmail }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";
import { useAuth } from "@/stores/auth/useAuth";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const { smAndDown } = useDisplay();
const router = useRouter();
const route = useRoute();
const drawerOpen = ref<boolean>();

const isLoginPage = computed(() => route.path === "/");

const theme = useTheme();
const auth = useAuth();

resizeObserver: (null as ResizeObserver | null,
  // Cargar el tema guardado en localStorage
  onMounted(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    theme.global.name.value = savedTheme;
  }));

// Emite evento para forzar redibujo del calendario al cambiar el drawer
watch(drawerOpen, () => {
  window.dispatchEvent(new CustomEvent("drawer-toggled"));
});

watch(smAndDown, (newVal) => {
  console.log("New value smandwon--------", smAndDown.value);
});

const isDarkTheme = computed({
  get: () => theme.global.name.value === "dark",
  set: (val) => {
    const selected = val ? "dark" : "light";
    theme.global.name.value = selected;
    localStorage.setItem("app-theme", selected);
  },
});

// Datos de usuario para el footer del drawer
const userLabel = computed(() => {
  const u: any = (auth as any).user || {};
  return u.name || u.fullName || u.email || 'User';
});
const userEmail = computed(() => {
  const u: any = (auth as any).user || {};
  return u.email || '';
});
const userInitial = computed(() => {
  const label = userLabel.value || 'U';
  return label.charAt(0).toUpperCase();
});

// State for list group expansions
const groupStates = ref({
  crmCore: true,
  otherTables: true,
  dashboards: true,
  calendar: true,
  studentsInstructors: true,
  virtualOffice: true,
  dynamicForms: true,
  socket: true,
});

const navigationItems = [
  { title: "Payment", icon: "mdi-credit-card-outline", route: "/payment" },
];

const recordsSection = [
  { title: "Leads", icon: "mdi-account-multiple", route: "/leads" },
  { title: "Contacts", icon: "mdi-account-box-outline", route: "/contacts" },
  { title: "Deals", icon: "mdi-handshake-outline", route: "/deals" },
];

const studentsInstructors = [
  {
    title: "Students",
    icon: "mdi-account-multiple-outline",
    route: "/students",
  },
  {
    title: "Instructors",
    icon: "mdi-account-tie-outline",
    route: "/instructors",
  },
];

const otherTables = [
  { title: "Programs", icon: "mdi-school-outline", route: "/programs" },
  { title: "Sources", icon: "mdi-source-branch", route: "/sources" },
  { title: "Locations", icon: "mdi-map-marker-outline", route: "/locations" },
  {
    title: "Not Sold Reasons",
    icon: "mdi-comment-question-outline",
    route: "/notsoldreasons",
  },
];

const dashboards = [
  {
    title: "Admin dashboard",
    icon: "mdi-monitor-dashboard",
    route: "/admin-dashboard",
  },
];

const typeCalendar = [
  {
    title: "Instructor`s Calendar",
    icon: "mdi-calendar-star",
    route: "/calendar-instructor",
  },
];

const virtualOffice = [
  {
    title: "Virtual Office",
    icon: "mdi-monitor-account",
    route: "/virtual-office",
  },
];

const calendar = [
  { title: "Calendar", icon: "mdi-calendar-month", route: "/calendar" },
];

const socket = [
  { title: "Hand Shake", icon: "mdi-handshake-outline", route: "/test" },
  { title: "Screenshots", icon: "mdi-camera", route: "/screenshots" },
  { title: "Live Staff Activity", icon: "mdi-broadcast", route: "/live-staff-activity" },
];

const handleLogout = async () => {
  await auth.logout();
  router.push("/");
};
</script>

<style scoped>
.app-appbar {
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
}

.app-brand-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.12);
}

.app-drawer-content {
  height: 100%;
  overflow-y: auto;
}

.app-drawer-footer {
  padding: 8px 8px 12px 8px;
}
</style>
