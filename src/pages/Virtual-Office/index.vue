<template>
  <v-container class="d-flex flex-column align-center" style="min-height: 100vh;">
    <h1 class="text-h4 mb-6">Welcome to your Virtual Office</h1>
    
    <v-row dense justify="center" class="w-100">
      <!-- Card: Posts Pending Approval -->
      <v-col cols="12" md="4">
        <v-card class="pa-4" outlined>
          <v-card-title class="text-h5">Posts Pending Approval</v-card-title>
          <v-card-text class="text-center">
            <div class="text-h3">{{ pendingCount }}</div>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn color="primary" @click="redirectPending">
              Go to Pending Posts
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Card: Approved Content -->
      <v-col cols="12" md="4">
        <v-card class="pa-4" outlined>
          <v-card-title class="text-h5">Approved Content</v-card-title>
          <v-card-text class="text-center">
            <div class="text-h3">{{ approvedCount }}</div>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn color="success" @click="redirectApproved">
              Go to Approved Posts
            </v-btn>
          </v-card-actions>
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

// Compute counts based on store
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
