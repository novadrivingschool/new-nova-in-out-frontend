<template>
  <v-container fluid>
    <v-card variant="outlined" class="rounded-lg">
      <v-data-table :headers="headers" :items="items" :loading="loading" hover>
        <template v-slot:item.fullName="{ item }">
          {{ item.fullName ? item.fullName : "Unknown User" }}
        </template>

        <template v-slot:item.type_of_clock="{ item }">
          <v-chip
            size="small"
            :color="item.type_of_clock === 'CLOCK_IN' ? 'success' : 'error'"
            variant="flat"
          >
            {{ item.type_of_clock }}
          </v-chip>
        </template>

        <template v-slot:item.clock_time="{ item }">
          <span class="font-weight-medium">{{ item.clock_time }}</span>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTodayString } from "@/utils/getTodayString";
import { useAuth } from "@/stores/auth/useAuth";

// 1. Definimos la "forma" de tu objeto de asistencia
interface AttendanceLog {
  employee_number: string;
  type_of_clock: string;
  clock_time: string;
  clock_date?: string; // El ? significa que es opcional
  fullName?: string;
}

const props = defineProps<{
  // 2. Le decimos a la función que debe devolver un array de ese tipo
  fetchFn: (date: string) => Promise<AttendanceLog[]>;
}>();

// 3. ¡AQUÍ ESTÁ EL TRUCO! Le pasamos el tipo al ref
const items = ref<AttendanceLog[]>([]);
const loading = ref(false);

const headers = [
  { title: "Name", key: "fullName", align: "start" as const },
  { title: "Employee #", key: "employee_number" },
  { title: "Status", key: "type_of_clock" },
  { title: "Time", key: "clock_time" },
];

const loadData = async () => {
  loading.value = true;
  try {
    const today = getTodayString();
    // Ahora TS sabe que lo que llega aquí es un AttendanceLog[]

    items.value = await props.fetchFn(today);
  } catch (error) {
    console.error("Error loading table data", error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

defineExpose({
  loadData,
});
</script>
