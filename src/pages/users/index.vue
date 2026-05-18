<template>
  <div class="d-flex align-center justify-space-between mb-5" :class="xs ? 'flex-column ga-3' : ''"">
    <p class="text-h6 font-weight-bold">User List</p>
    <div class="d-flex ga-2" ">
      <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="handleRefresh"> Refresh </v-btn>
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="handleCreate">
        Add
      </v-btn>
      <v-btn color="primary" variant="elevated" append-icon="mdi-chevron-down" @click="handleFilter">
        Filter
      </v-btn>
    </div>
  </div>
  <v-expand-transition>
    <div v-if="isFiltering" class="mb-5 d-flex align-center ga-2">
      <div>
      <v-select
        :items="[
          { title: 'Active', value: true },
          { title: 'Inactive', value: false }
        ]"
        v-model="isActiveFilter"
        label="Status"
      />
      </div>
      
      <v-btn color="primary" variant="elevated" @click="applyFilters">
        Apply
      </v-btn>

    </div>
  </v-expand-transition>
  

  <base-table 
    :headers="userHeaders" 
    :items="users as any" 
    :loading="loading" 
    :total-items="totalItems" 
    v-model:page="page" 
    v-model:items-per-page="limit"
  >
    <template #item.isActive="{ item }">
      <v-chip :color="item.isActive ? 'success' : 'error'">
        {{ item.isActive ? "Active" : "Inactive" }}
      </v-chip>
    </template>
    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-eye"
        variant="text"
        size="small"
        color="primary"
        @click="handlePreview(item)"
      />
      <template v-if="item.isActive">
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="handleDelete(item)" />
      </template>
      <template v-else>
        <v-btn icon="mdi-check-bold" variant="text" size="small" color="primary" @click="handleActivate(item)" />

      </template>
    </template>
  </base-table>

  <base-dialog
    :title="dialogConfig.title"
    :show="showDialog"
    @close="showDialog = !showDialog"
    :icon="dialogConfig.icon ?? undefined"
    :loading="dialogLoading"
  >
    <template #dialog-body>
      <p>{{ dialogConfig.description }}</p>
    </template>

    <template #dialog-actions>
      <v-btn 
        v-for="action in dialogConfig.actions"
        :key="action.label"
        :disabled="dialogLoading"
      variant="elevated" :color="action.btnColor" @click="action.onClick"
      >{{ action.label }}</v-btn>
    </template>
  </base-dialog>

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="3000"
    location="top right"
  >
    {{ snackbar.text }}

    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar.show = false"> Close </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import BaseTable from "@/components/common/BaseTable.vue";
import { usersService } from "@/services/users.service";
import type { UserResponse, UsersQueryFilterDto } from "@/types/auth";
import type { DialogConfig } from "@/types/ui/base-dialog";
import { TrashFilledIcon } from "vue-tabler-icons";
import { useDisplay } from "vuetify/lib/composables/display.mjs";

const users = ref<UserResponse[] | undefined>();
const loading = ref<boolean>(false)
const showDialog = ref<boolean>(false)
const userToDisable = ref()
const dialogLoading = ref<boolean>(false)
const isFiltering = ref<boolean>(false)
const isActiveFilter = ref<boolean>(true)

const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const filters = reactive<UsersQueryFilterDto>({
  isActive: true,
  roles: []
})

const isPreview = ref<boolean>(false);
const selectedUser = ref();
const router = useRouter();
const { xs } = useDisplay();

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});


const dialogConfig = reactive<DialogConfig>({
  title: "",
  description: "",
  icon: "",
  actions: []
})


const fetchUsers = async () => {
  loading.value = true;
  
  const response = await usersService.getFilteredUsers({
    page: page.value,
    limit: limit.value,
    isActive: filters.isActive
  });

  if (response) {
    users.value = response.data;         
    totalItems.value = response.meta.totalItems;
  }
  
  loading.value = false;
};


watch([page, limit, filters], () => {
  fetchUsers();
}, { immediate: true });

onMounted(async () => {
  await fetchUsers()
});

const handleRefresh = async()=>{
  await fetchUsers()
}

const handleCreate  = ()=>{
  router.push("/users/add")
}

const handleFilter = ()=>{
  isFiltering.value = !isFiltering.value
}

const userHeaders = [
  { title: "Employee #", key: "profile.employee_number" },
  { title: "Email", key: "email" },
  { title: "First Name", key: "profile.firstName" },
  { title: "Last Name", key: "profile.lastName" },
  { title: "Status", key: "isActive" },
  { title: "actions", key: "actions", sortable: false },
];

const handlePreview = (item: UserResponse) => {
  console.log("ITEM CLICKED", { item });
  console.log("editing...");
  isPreview.value = true;
  selectedUser.value = item;
  router.push(`/users/${item.id}`);
  // showDialog.value = true;
  // console.log("show dialog", showDialog.value);
};

const handleDelete = (item:UserResponse)=>{
  showDialog.value = true
  userToDisable.value = item

  dialogConfig.title = 'Are you sure?'
    dialogConfig.description = 'The user will be disabled'
    dialogConfig.icon = 'mdi-delete-empty'

    dialogConfig.actions = [
      {
        label: 'Confirm',
        btnColor: 'error',
        onClick: async()=>{

          await switchStatus(userToDisable.value.id, false)

        }
      }
    ]
}

const handleActivate = (item:UserResponse)=>{
  showDialog.value = true
  userToDisable.value = item

  dialogConfig.title = 'Are you sure?'
    dialogConfig.description = 'The user will be activated'
    dialogConfig.icon = 'mdi-account-check'

    dialogConfig.actions = [
      {
        label: 'Confirm',
        btnColor: 'success',
        onClick: async()=>{

          await switchStatus(userToDisable.value.id, true)

        }
      }
    ]
}

const switchStatus = async(id:string, activate:boolean )=>{

  dialogLoading.value = true

  try{

    await usersService.switchStatus(id, activate)

    snackbar.color = 'success'
    snackbar.show =true
    snackbar.text= activate ? 'User activated succesfully' : 'User disabled succesfully'
    userToDisable.value = null
    showDialog.value = false
    await fetchUsers()

  }catch(error){
    console.error(error)
  } finally{
    dialogLoading.value = false
  }

}

const applyFilters = ()=>{
  filters.isActive = isActiveFilter.value
}



</script>

<style scoped></style>
