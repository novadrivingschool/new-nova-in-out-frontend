<template>
  <v-card variant="flat" class="pa-4">
    <div
      class="d-flex align-center ga-8 mb-8 justify-space-between"
      :class="smAndDown ? 'flex-column' : ''"
    >
      <div class="d-flex align-center ga-5">
        <div>
          <div class="d-flex ga-2" :class="xs ? 'flex-column' : ''">
            <h2 class="text-h6 font-weight-bold">
              {{
                isEditing
                  ? "Edit Profile"
                  : `${props.user.profile?.firstName || ""} ${props.user.profile?.lastName || ""}`
              }}
            </h2>
            <v-chip
              v-if="!xs"
              :color="props.user.isActive ? 'success' : 'error'"
            >
              {{ props.user.isActive ? "Active" : "Inactive" }}
            </v-chip>
          </div>

          <p class="text-subtitle-2 text-medium-emphasis mb-2">
            {{ props.user.email }}
          </p>

          <v-chip v-if="xs" :color="props.user.isActive ? 'success' : 'error'">
            {{ props.user.isActive ? "Active" : "Inactive" }}
          </v-chip>
        </div>
      </div>

      <v-btn
        :icon="isEditing ? 'mdi-close' : 'mdi-pencil'"
        :color="isEditing ? 'grey' : 'primary'"
        variant="tonal"
        @click="toggleEdit"
      />
    </div>

    <v-form ref="formRef" v-model="isFormValid">
      <p class="font-weight-medium text-h6">Basic Information</p>
      <v-divider color="grey my-4"></v-divider>

      <div class="d-flex ga-2 mb-8">
        <!-- <v-label class="mb-1 font-weight-medium">Employee Number</v-label> -->
        <p
          v-if="props.user.profile?.employee_number"
          class="font-weight-bold text-grey"
        >
          {{ props.user.profile?.employee_number }}
        </p>
        <template v-for="role in props.user.roles" :key="props.user.id">
          <v-chip class="text-capitalize" color="primary" variant="tonal">
            {{ role }}
          </v-chip>
        </template>
      </div>
      <v-row>
        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">First Name</v-label>
          <v-text-field
            v-if="isEditing"
            v-model="formData.profile.firstName"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
          />
          <p v-else class="text-body-1 py-2">
            {{ props.user.profile?.firstName }}
          </p>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Last Name</v-label>
          <v-text-field
            v-if="isEditing"
            v-model="formData.profile.lastName"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
          />
          <p v-else class="text-body-1 py-2">
            {{ props.user.profile?.lastName }}
          </p>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Phone Number</v-label>
          <v-text-field
            v-if="isEditing"
            v-model="formData.profile.phone"
            variant="outlined"
            density="compact"
            :rules="[rules.phoneMax, rules.phonePattern]"
          />
          <p v-else class="text-body-1 py-2">{{ props.user.profile?.phone }}</p>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Birthdate</v-label>
          <template v-if="isEditing">
            <v-menu
              v-model="menuDate"
              :close-on-content-click="false"
              transition="scale-transition"
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="formData.profile.birthdate"
                  variant="outlined"
                  density="compact"
                  append-inner-icon="mdi-calendar"
                  readonly
                />
              </template>
              <v-date-picker
                v-model="datePickerValue"
                @update:model-value="onDateSelected"
                color="primary"
              />
            </v-menu>
          </template>
          <p v-else class="text-body-1 py-2">
            {{ props.user.profile?.birthdate }}
          </p>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Gender</v-label>
          <v-select
            v-if="isEditing"
            :items="Object.values(Gender)"
            v-model="formData.profile.gender as Gender"
            variant="outlined"
            density="compact"
            hide-details
          />
          <p v-else class="text-body-1 py-2">
            {{ props.user.profile?.gender }}
          </p>
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between align-center mt-4">
        <p class="font-weight-medium text-h6">Authentication</p>
        <v-btn
          v-if="!isEditing"
          icon
          variant="tonal"
          color="primary"
          @click="handleResetPassword"
        >
          <v-icon>mdi-lock-reset</v-icon>

          <v-tooltip activator="parent" location="top" color="primary">
            Reset Password
          </v-tooltip>
        </v-btn>
      </div>
      <v-divider color="grey my-4"></v-divider>

      <v-row>
        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Email Address</v-label>
          <v-text-field
            v-if="isEditing"
            v-model="formData.email"
            variant="outlined"
            density="compact"
            :rules="[rules.email]"
          />
          <p v-else class="text-body-1 py-2">{{ props.user.email }}</p>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">User Name</v-label>
          <v-text-field
            v-if="isEditing"
            v-model="formData.profile.userName"
            variant="outlined"
            density="compact"
          />
          <p v-else class="text-body-1 py-2">
            {{ props.user.profile.userName }}
          </p>
        </v-col>
      </v-row>
    </v-form>

    <v-expand-transition>
      <div v-if="isEditing" class="d-flex justify-end ga-2 mt-6">
        <v-btn variant="text" @click="cancelEdit">Cancel</v-btn>
        <v-btn
          color="primary"
          @click="saveChanges"
          :loading="loading"
          :disabled="!isFormValid"
        >
          Save Changes
        </v-btn>
      </div>
    </v-expand-transition>
  </v-card>

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

  <base-dialog
    :title="dialogConfig.title"
    :show="showDialog"
    :icon="dialogConfig.icon"
    :loading="dialogLoading"
    @close="showDialog = !showDialog"
  >
    <template #dialog-body>
      <v-form ref="resetPasswordForm" v-model="isResetPasswordFormValid">
        <div class="mb-5">
          <v-label class="mb-1 font-weight-medium">New Password</v-label>
          <v-text-field
            v-model="password"
            :rules="[rules.required, rules.passwordMin]"
            variant="outlined"
            density="compact"
            type="password"
            placeholder="********"
          />
        </div>

        <v-label class="mb-1 font-weight-medium">Confirm Password</v-label>
        <v-text-field
          v-model="confirmPassword"
          :rules="[rules.required, rules.passwordMatch, rules.passwordMin]"
          variant="outlined"
          density="compact"
          type="password"
          placeholder="********"
        />
      </v-form>
    </template>
    <template #dialog-actions>
      <v-btn
        v-for="action in dialogConfig.actions"
        :key="action.label"
        variant="elevated"
        :color="action.btnColor"
        @click="action.onClick"
        :disabled="!isResetPasswordFormValid"
        >{{ action.label }}</v-btn
      >
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { Gender, type UserResponse } from "@/types/auth";
import { useDisplay } from "vuetify/lib/composables/display.mjs";
import { usersService } from "@/services/users.service";
import { formatRange } from "@fullcalendar/core/index.js";
import BaseDialog from "../common/BaseDialog.vue";
import type { DialogConfig } from "@/types/ui/base-dialog";

const { smAndDown, mobile, xs } = useDisplay();

const props = defineProps<{ user: UserResponse }>();
const emit = defineEmits(["updated"]);

const menuDate = ref(false);
const datePickerValue = ref(null);
const isFormValid = ref(false);
const showDialog = ref(false);
const password = ref<string>();
const confirmPassword = ref<string>();
const isResetPasswordFormValid = ref(false);

const dialogConfig = reactive<DialogConfig>({
  title: "",
  description: "",
  icon: "",
  actions: [],
});

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

const rules = {
  required: (v: any) => !!v || "This field is required",
  phoneMax: (v: string) => v?.length <= 16 || "Max 16 characters",
  phonePattern: (v: string) =>
    /^[+0-9]*$/.test(v) || "Only numbers and + allowed",
  email: (v: string) => !v || /.+@.+\..+/.test(v) || "E-mail must be valid",
  passwordMatch: (v: string) =>
    v === password.value || "Passwords do not match",
  passwordMin: (v: string) => (v && v.length >= 8) || "Min 8 characters",
};

const isEditing = ref(false);
const formRef = ref<any>(null);
const loading = ref(false);
const dialogLoading = ref(false);

const onDateSelected = (val: Date | null) => {
  if (val) {
    // Formateamos la fecha a YYYY-MM-DD para el input
    formData.profile.birthdate = new Date(val).toISOString().split("T")[0];
    menuDate.value = false; // Cerramos el menú
  }
};

const formData: UserResponse = reactive(JSON.parse(JSON.stringify(props.user)));

watch(
  () => props.user,
  (newVal) => {
    if (newVal) {
      Object.assign(formData, JSON.parse(JSON.stringify(newVal)));
    }
  },
  { deep: true },
);

const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

const cancelEdit = () => {
  // Resetear los cambios si cancela
  Object.assign(formData, JSON.parse(JSON.stringify(props.user)));
  isEditing.value = false;
};

const resetPassword = async () => {
  dialogLoading.value = true;
  try {
    const updatedUser = await usersService.updateUser(props.user.id, {
      password: password.value,
    });

    snackbar.text = "Password Updated successfully!";
    snackbar.color = "success";
    snackbar.show = true;

    showDialog.value = false;

    password.value = "";
    confirmPassword.value = "";
  } catch (error: any) {
    const errorMsg = Array.isArray(error.message)
      ? error.message[0]
      : error.message;

    snackbar.text = errorMsg || "An unexpected error occurred";
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    dialogLoading.value = false;
  }
};

const handleResetPassword = () => {
  showDialog.value = true;
  dialogConfig.title = "Reset Password";
  dialogConfig.icon = "mdi-lock-reset";
  dialogConfig.actions = [
    {
      btnColor: "primary",
      label: "Confirm",
      onClick: () => resetPassword(),
    },
  ];
};

const saveChanges = async () => {
  loading.value = true;
  try {
    console.log("Guardando:", formData);

    const payload: Partial<UserResponse> = {};

    // Comprobar campos del primer nivel (ej. email)
    if (formData.email !== props.user.email) {
      payload.email = formData.email;
    }

    // Comprobar campos dentro del profile
    const profileChanges: any = {};
    const originalProfile = props.user.profile || {};
    const currentProfile = formData.profile || {};

    // Iteramos sobre las llaves del perfil actual para ver qué cambió
    Object.keys(currentProfile).forEach((key) => {
      const k = key as keyof typeof currentProfile;
      if (currentProfile[k] !== originalProfile[k]) {
        profileChanges[k] = currentProfile[k];
      }
    });

    // Si hubo cambios en el perfil, lo agregamos al payload
    if (Object.keys(profileChanges).length > 0) {
      payload.profile = profileChanges;
    }

    // 3. Si no hay cambios, simplemente cerramos la edición
    if (Object.keys(payload).length === 0) {
      isEditing.value = false;
      return;
    }

    console.log("PAYLOAD TO UPDATE", payload);

    const updatedUser = await usersService.updateUser(props.user.id, payload);

    snackbar.text = "Profile updated successfully!";
    snackbar.color = "success";
    snackbar.show = true;
    isEditing.value = false;
    setTimeout(() => {
      isEditing.value = false;
      emit("updated", updatedUser);
    }, 500);
  } catch (error: any) {
    const errorMsg = Array.isArray(error.message)
      ? error.message[0]
      : error.message;
    snackbar.text = errorMsg || "Error updating profile";
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>
