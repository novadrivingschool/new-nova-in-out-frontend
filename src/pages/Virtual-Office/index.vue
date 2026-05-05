<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Virtual Office</h1>
        <div class="app-page-subtitle">Manage posts and approvals at a glance</div>
      </div>
    </div>

    <v-row dense>
      <!-- Card: Posts Pending Approval -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="app-card pa-5 fill-height" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase" style="letter-spacing: 0.06em;">
              Pending Approval
            </span>
            <div class="metric-icon" style="background: rgba(var(--v-theme-warning), 0.12);">
              <v-icon color="warning" size="20">mdi-clock-alert-outline</v-icon>
            </div>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ pendingCount }}</div>
          <div class="text-caption text-medium-emphasis mb-4">posts waiting for review</div>
          <v-btn color="primary" variant="tonal" block @click="redirectPending">
            Go to pending posts
            <template #append>
              <v-icon size="18">mdi-arrow-right</v-icon>
            </template>
          </v-btn>
        </v-card>
      </v-col>

      <!-- Card: Approved Content -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="app-card pa-5 fill-height" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase" style="letter-spacing: 0.06em;">
              Approved
            </span>
            <div class="metric-icon" style="background: rgba(var(--v-theme-success), 0.12);">
              <v-icon color="success" size="20">mdi-check-decagram-outline</v-icon>
            </div>
          </div>
          <div class="text-h3 font-weight-bold mb-1">{{ approvedCount }}</div>
          <div class="text-caption text-medium-emphasis mb-4">posts already approved</div>
          <v-btn color="success" variant="tonal" block @click="redirectApproved">
            Go to approved posts
            <template #append>
              <v-icon size="18">mdi-arrow-right</v-icon>
            </template>
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePostStore } from '@/stores/post/post';

const router = useRouter();
const postStore = usePostStore();

const pendingCount = computed(() =>
    postStore.posts.filter(post => post.status === 'not approved').length
);
const approvedCount = computed(() =>
    postStore.posts.filter(post => post.status === 'approved').length
);

function redirectPending() {
    postStore.filter = 'not approved';
    router.push('/post');
}

function redirectApproved() {
    postStore.filter = 'approved';
    router.push('/post');
}
</script>

<style scoped>
.metric-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
</style>
