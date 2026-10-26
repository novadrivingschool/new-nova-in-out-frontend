<template>
  <PageContainer variant="constrained" align="start">
    <PageHeader
      title="User information"
      subtitle="View and edit user details"
      back-to="/users"
    />

    <ActivityLoader v-if="loading" label="Loading user…" />

    <template v-else-if="user">
      <UserInformation
        :user="user"
        :auto-edit="autoEdit"
        @updated="handleUpdated"
      />
      <UserSchedules :user-id="user.id" />
    </template>

    <EmptyState
      v-else
      title="User not found"
      description="This user does not exist or has been deleted."
      icon="mdi-account-question-outline"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" @click="router.push('/users')">
          Back to users
        </v-btn>
      </template>
    </EmptyState>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router/auto'
import { usersService } from '@/services/users.service'
import type { UserResponse } from '@/types/auth'
import UserInformation from '@/components/Users/UserInformation.vue'
import UserSchedules from '@/components/Users/UserSchedules.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// Nombrar la ruta le da a `route.params` el tipo generado por unplugin-vue-router
const route = useRoute('/users/[id]')
const router = useRouter()

const user = ref<UserResponse | undefined>(undefined)
const loading = ref(true)
const autoEdit = computed(() => route.query.edit === 'true')

async function fetchUserData(): Promise<void> {
  loading.value = true
  try {
    user.value = await usersService.getOneUser(route.params.id)
  } catch (error) {
    console.error('Error fetching user:', error)
    user.value = undefined
  } finally {
    loading.value = false
  }
}

onMounted(fetchUserData)

/**
 * Tras guardar se recargan los datos y se permanece en la ficha. La versión
 * anterior redirigía a la lista pasados 800 ms, lo que impedía encadenar varios
 * cambios y resultaba desconcertante.
 */
async function handleUpdated(updated?: UserResponse): Promise<void> {
  if (updated) {
    user.value = updated
    return
  }
  await fetchUserData()
}
</script>
