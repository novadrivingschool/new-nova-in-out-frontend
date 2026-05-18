<template>
  <v-card class="app-card mb-5 pa-4 pa-sm-5" elevation="0">
    <div class="d-flex align-center ga-2 mb-5">
      <div class="bg-primary-lighten-5 rounded-sm pa-1 d-flex align-center">
        <v-icon color="primary" size="18">mdi-account-group-outline</v-icon>
      </div>
      <span class="font-weight-bold text-medium-emphasis">
        DASHBOARD SUMMARY
      </span>
    </div>

    <div class="d-flex ga-4 flex-wrap">
      <v-chip
        size="large"
        variant="tonal"
        color="primary"
        class="stat-chip px-4"
        @click="router.push('/Clocked-In-Now')"
      >
        <template v-slot:prepend>
          <v-progress-circular
            v-if="loading"
            indeterminate
            size="16"
            width="2"
            class="mr-2"
          />
          <!-- <v-icon v-else start icon="mdi-check-circle-outline" /> -->
        </template>
        <span class="text-h7 font-weight-bold mr-2">{{
          stats.clockedInNowCount
        }}</span>
        <span class="text-caption font-weight-medium">Clocked In Now</span>
      </v-chip>

      <v-chip
        size="large"
        variant="tonal"
        color="primary"
        class="stat-chip px-4"
        @click="router.push('/Clocked-In-Today')"
      >
        <template v-slot:prepend>
          <v-progress-circular
            v-if="loading"
            indeterminate
            size="16"
            width="2"
            class="mr-2"
          />
          <!-- <v-icon v-else start icon="mdi-calendar-check" /> -->
        </template>
        <span class="text-h7 font-weight-bold mr-2">{{
          stats.clockedInTodayCount
        }}</span>
        <span class="text-caption font-weight-medium">Clocked In Today</span>
      </v-chip>

      <v-chip
        size="large"
        variant="tonal"
        color="primary"
        class="stat-chip px-4"
        @click="router.push('/Not-Clocked-In-Now')"
      >
        <template v-slot:prepend>
          <v-progress-circular
            v-if="loading"
            indeterminate
            size="16"
            width="2"
            class="mr-2"
          />
          <!-- <v-icon v-else start icon="mdi-account-off-outline" /> -->
        </template>
        <span class="text-h7 font-weight-bold mr-2">{{
          stats.notClockedInNowCount
        }}</span>
        <span class="text-caption font-weight-medium">Not Clocked In Now</span>
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import NovaInOutServices from "@/services/NovaInOutServices";
import { getTodayString } from "@/utils/getTodayString";

const router = useRouter();

// const getClockedInNow = async () => {
//   await NovaInOutServices.getClockedInNow(getTodayString());
// };

let refreshInterval: any = null;

const loading = ref(false);

const stats = ref({
  clockedInNowCount: 0,
  clockedInTodayCount: 0,
  notClockedInNowCount: 0,
});

const loadStats = async () => {
  loading.value = true;
  try {
    const data = await NovaInOutServices.getSummary(getTodayString());
    stats.value = data;
    console.log("STATS.VALUE", stats.value);
  } catch (error) {
    console.error("Error updating summary stats", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  //carga inicial
  await loadStats();
  refreshInterval = setInterval(() => loadStats(), 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped></style>
