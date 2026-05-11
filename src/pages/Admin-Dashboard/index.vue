<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Admin Dashboard</h1>
        <div class="app-page-subtitle">Administrative panel and metrics</div>
      </div>
    </div>

    <admin-dashboard-filter />

    <v-card class="app-card pa-6" elevation="0">
      <total-hours-dashboard />
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import AdminDashboardFilter from "@/components/AdminDashboard/AdminDashboardFilter.vue";
</script>
