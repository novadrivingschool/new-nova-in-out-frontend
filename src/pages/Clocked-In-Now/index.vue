<template>
  <div class="pa-5">
    <div class="d-flex align-center ga-4 mb-4">
      <v-icon icon="mdi-arrow-left" @click="router.back()" />
      <h1>Clocked in now</h1>
    </div>
    <AttendanceTable :fetch-fn="NovaInOutServices.getClockedInNow" />
  </div>
</template>

<script setup lang="ts">
import NovaInOutServices from "@/services/NovaInOutServices";

const router = useRouter();
</script>

<style scoped></style>
