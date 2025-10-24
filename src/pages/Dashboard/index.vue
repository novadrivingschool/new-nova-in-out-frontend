<template>
    <v-layout class="h-screen">
      <!-- TOP NAVBAR -->
      <v-app-bar color="primary" dark app>
        <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen" />
        <v-toolbar-title>CRM Dashboard</v-toolbar-title>
  
        <v-spacer />
  
        <!-- LOG OUT BUTTON -->
        <v-btn icon @click="handleLogout" title="Log out">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-app-bar>
  
      <!-- LEFT SIDEBAR -->
      <v-navigation-drawer v-model="drawerOpen" app permanent>
        <v-list nav dense>
          <v-list-item
            v-for="item in navigationItems"
            :key="item.title"
            :to="item.route"
            :title="item.title"
            :prepend-icon="item.icon"
            link
          />
        </v-list>
      </v-navigation-drawer>
  
      <!-- MAIN CONTENT -->
      <v-main class="pa-6">
        <v-container fluid>
          <h2 class="text-h5">Welcome to your CRM dashboard</h2>
          <p>This is your main content area.</p>
        </v-container>
      </v-main>
    </v-layout>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const drawerOpen = ref(false)
  
  const navigationItems = [
    { title: 'Leads', icon: 'mdi-account-multiple', route: '/leads' },
    { title: 'Clients', icon: 'mdi-account-group', route: '/clients' },
    { title: 'Payment', icon: 'mdi-account-group', route: '/payment' },
  ]
  
  // Example logout handler
  const handleLogout = () => {
    // Clear any auth info here (e.g., localStorage, Pinia, etc.)
    // localStorage.removeItem('token')
  
    router.push('/')
  }
  </script>
  