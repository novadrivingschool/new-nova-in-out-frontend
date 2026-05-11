<template>
  <div class="d-flex align-center justify-space-between flex-wrap">
    <div class="mb-4">
      <h1 class="app-page-title">Total Hours</h1>
      <p class="app-page-subtitle">
        {{ dateRangeLabel }}
      </p>
    </div>

    <div class="app-toolbar mb-4" :class="xs ? 'w-100 d-flex flex-column' : ''">
      <v-menu v-model="startMenu" :close-on-content-click="false">
        <template v-slot:activator="{ props }">
          <v-text-field
            v-bind="props"
            :model-value="formatDisplayDate(rawStartDate)"
            label="Start Date"
            readonly
            prepend-inner-icon="mdi-calendar-start"
            density="compact"
            variant="outlined"
            hide-details
            :style="xs ? 'width: 100%' : 'width: 160px'"
          ></v-text-field>
        </template>
        <v-date-picker
          v-model="rawStartDate"
          color="primary"
          @update:model-value="startMenu = false"
        ></v-date-picker>
      </v-menu>

      <v-menu v-model="endMenu" :close-on-content-click="false">
        <template v-slot:activator="{ props }">
          <v-text-field
            v-bind="props"
            :model-value="formatDisplayDate(rawEndDate)"
            label="End Date"
            readonly
            prepend-inner-icon="mdi-calendar-end"
            density="compact"
            variant="outlined"
            hide-details
            :style="xs ? 'width: 100%' : 'width: 160px'"
          ></v-text-field>
        </template>
        <v-date-picker
          v-model="rawEndDate"
          color="primary"
          @update:model-value="endMenu = false"
        ></v-date-picker>
      </v-menu>

      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-filter"
        :loading="loading"
        @click="applyFilters"
      >
        Filter
      </v-btn>
    </div>
  </div>

  <v-card variant="outlined" class="pa-0 rounded-lg">
    <div
      v-if="loading"
      class="d-flex align-center justify-center"
      style="min-height: 400px"
    >
      <activity-loader label="Loading data..." />
    </div>
    <div v-else>
      <v-card-text class="pa-4">
        <apexchart
          type="line"
          height="350"
          :options="chartOptions"
          :series="chartSeries"
        ></apexchart>
      </v-card-text>

      <v-card-text class="text-caption text-medium-emphasis pt-0 pb-4 px-4">
        Note: Graph data does not include overtime and absences.
      </v-card-text>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ApexOptions } from "apexcharts";
import apexchart from "vue3-apexcharts"; // Alias necesario para el template
import NovaInOutServices from "@/services/NovaInOutServices";
import { useAttendanceChart } from "@/composables/useAttendanceChart";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const { chartOptions, chartSeries, fetchChartData, loading } =
  useAttendanceChart();

const { xs } = useDisplay();

const filters = ref({
  start: "",
  end: "",
});

const startMenu = ref(false);
const endMenu = ref(false);

const rawStartDate = ref(new Date());
const rawEndDate = ref(new Date());

// 2. Fechas que REALMENTE se cargaron en la gráfica (Estado aplicado)
const appliedStartDate = ref(new Date());
const appliedEndDate = ref(new Date());

// 3. El subtítulo ahora mira a las fechas APLICADAS
const dateRangeLabel = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const start = appliedStartDate.value.toLocaleDateString("en-US", options);
  const end = appliedEndDate.value.toLocaleDateString("en-US", options);
  return `${start} — ${end}`;
});

const applyFilters = async () => {
  // Solo cuando damos clic en Filter, igualamos las fechas
  appliedStartDate.value = new Date(rawStartDate.value);
  appliedEndDate.value = new Date(rawEndDate.value);

  const start = formatDateForAPI(appliedStartDate.value);
  const end = formatDateForAPI(appliedEndDate.value);

  await fetchChartData(start, end);
};

// 2. Formateador para los inputs (MM/DD/YYYY)
const formatDisplayDate = (date: Date) => {
  return date ? date.toLocaleDateString("en-US") : "";
};

// 3. Formateador para la API (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

onMounted(async () => {
  // Inicialización por defecto
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 30);

  rawStartDate.value = new Date(past);
  rawEndDate.value = new Date(today);

  // Al cargar por primera vez, aplicamos de una vez
  appliedStartDate.value = new Date(past);
  appliedEndDate.value = new Date(today);

  await applyFilters();
});
</script>
