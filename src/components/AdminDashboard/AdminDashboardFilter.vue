<template>
  <v-card class="app-card mb-5 pa-4 pa-sm-5" elevation="0">
    <div class="d-flex align-center ga-2 mb-4">
      <v-icon color="primary" size="20">mdi-filter-variant</v-icon>
      <span class="text-subtitle-2 font-weight-bold">Employee Information</span>
    </div>

    <div class="d-flex ga-4 flex-wrap">
      <v-chip variant="outlined" @click="router.push('/Clocked-In-Now')">
        <span class="mr-2">40</span> Clocked In Now
      </v-chip>

      <v-chip variant="outlined" @click="router.push('/Clocked-In-Today')">
        <span class="mr-2">40</span> Employees Clocked In Today
      </v-chip>

      <v-chip variant="outlined" @click="router.push('/Not-Clocked-In-Now')">
        <span class="mr-2">40</span> Not Clocked In Now
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import NovaInOutServices from "@/services/NovaInOutServices";
import { getTodayString } from "@/utils/getTodayString";

// const getClockedInNow = async () => {
//   await NovaInOutServices.getClockedInNow(getTodayString());
// };

const router = useRouter();
</script>

<style scoped></style>
