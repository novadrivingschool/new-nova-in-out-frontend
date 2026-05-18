<template>
  <div class="d-flex ga-3 align-center mb-5">
    <v-btn
      icon="mdi-arrow-left"
      variant="text"
      density="compact"
      @click="router.push('/users')"
    />
    <p class="text-h6 font-weight-bold">User Information</p>
  </div>

  <div v-if="loading" class="d-flex justify-center pa-10">
    <ActivityLoader :size="32" />
  </div>

  <user-information v-else-if="user" :user="user" @updated="handleRefresh" />

  <v-alert
    v-else
    type="error"
    title="User not found"
    text="The user you are looking for does not exist or has been deleted."
    variant="tonal"
    class="mt-4"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usersService } from "@/services/users.service";
import type { UserResponse } from "@/types/auth";
import UserInformation from "@/components/Users/UserInformation.vue";
const route = useRoute();
const router = useRouter();

const user = ref<UserResponse | undefined>(undefined);
const loading = ref(true);

const fetchUserData = async () => {
  loading.value = true;
  try {
    // 🎯 IMPORTANTE: params no es una función, es un objeto.
    console.log("Fetching user...");
    // El nombre 'id' debe ser igual al nombre del archivo [id].vue
    const id = route.params.id as string;
    console.log("PARAMS", route.params);
    user.value = await usersService.getOneUser(id);
    console.log(user.value);
  } catch (error) {
    console.error("Error fetching user:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUserData);

// Si el componente hijo emite que se actualizó, refrescamos los datos del servidor
const handleRefresh = () => {
  fetchUserData();
};
</script>
