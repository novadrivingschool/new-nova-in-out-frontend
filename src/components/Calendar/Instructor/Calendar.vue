<script setup lang="ts">
import FullCalendar from './FullCalender.vue';
</script>

<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Instructor's Calendar</h1>
        <div class="app-page-subtitle">View and manage instructor schedules</div>
      </div>
    </div>

    <v-card class="app-card pa-3 pa-sm-4" elevation="0">
      <FullCalendar />
    </v-card>
  </v-container>
</template>

<style lang="scss"></style>
