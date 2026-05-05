<script setup lang="ts">
import FullCalendar from './FullCalender.vue';
</script>

<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Calendar</h1>
        <div class="app-page-subtitle">Schedule and visualize events</div>
      </div>
    </div>

    <v-card class="app-card pa-3 pa-sm-4" elevation="0">
      <FullCalendar />
    </v-card>
  </v-container>
</template>

<style lang="scss"></style>
