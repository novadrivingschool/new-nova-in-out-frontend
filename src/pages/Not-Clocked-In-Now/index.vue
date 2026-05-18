<template>
  <div class="pa-5">
    <v-card class="pa-5 mb-5">
      <div
        class="d-flex align-center justify-space-between"
        :class="xs ? 'flex-column ga-4' : ''"
      >
        <div class="d-flex align-center ga-4">
          <v-icon icon="mdi-arrow-left" @click="router.back()" />
          <h1>Not Clocked in now</h1>
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
        :fetch-fn="NovaInOutServices.getNotClockedInNow"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import NovaInOutServices from "@/services/NovaInOutServices";
import { getTodayString } from "@/utils/getTodayString";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const { xs } = useDisplay();

const tableRef = ref();

// 3. La función del botón ahora llama al hijo
const refreshTable = () => {
  if (tableRef.value) {
    tableRef.value.loadData();
  }
};

const router = useRouter();
</script>

<style scoped></style>
