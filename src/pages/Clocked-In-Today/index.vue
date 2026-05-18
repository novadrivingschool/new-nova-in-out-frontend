<template>
  <div class="pa-5">
    <v-card class="pa-5 mb-5">
      <div
        class="d-flex align-center justify-space-between"
        :class="xs ? 'flex-column ga-4' : ''"
      >
        <div class="d-flex align-center ga-4">
          <v-icon icon="mdi-arrow-left" @click="router.back()" />
          <h1>Clocked in today</h1>
        </div>
        <div>
          <v-btn
            prepend-icon="mdi-refresh"
            variant="outlined"
            @click="refreshTable"
            >Refresh</v-btn
          >
        </div>
      </div>
    </v-card>
    <v-card>
      <AttendanceTable
        ref="tableRef"
        :fetch-fn="NovaInOutServices.getClockedInToday"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import NovaInOutServices from "@/services/NovaInOutServices";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const router = useRouter();

const tableRef = ref();

const { xs } = useDisplay();

// 3. La función del botón ahora llama al hijo
const refreshTable = () => {
  if (tableRef.value) {
    tableRef.value.loadData();
  }
};
</script>

<style scoped></style>
