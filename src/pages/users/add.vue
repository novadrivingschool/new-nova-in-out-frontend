<template>
  <div class="d-flex ga-3 align-center mb-5">
    <v-btn
      icon="mdi-arrow-left"
      variant="text"
      density="compact"
      @click="router.push('/users')"
    />
    <p class="text-h6 font-weight-bold mb-0">Add New User</p>
  </div>

  <v-card variant="flat" class="pa-4">
    <v-form ref="formRef" v-model="isFormValid">
      <!-- <div class="d-flex justify-center mb-4">
        <v-avatar :size="xs ? '80' : '100'" color="grey-lighten-2">
          <v-icon
            color="primary"
            :size="xs ? '20' : '30'"
            style="cursor: pointer"
          >
            mdi-pencil
          </v-icon>
        </v-avatar> -->
      <!-- </div> -->

      <p class="font-weight-medium text-h6">Basic Information</p>
      <v-divider color="grey my-4"></v-divider>

      <v-row>
        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">First Name</v-label>
          <v-text-field
            v-model="formData.profile.firstName"
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            placeholder="John"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Last Name</v-label>
          <v-text-field
            v-model="formData.profile.lastName"
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            placeholder="Doe"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Phone Number</v-label>
          <v-text-field
            v-model="formData.profile.phone"
            :rules="[rules.phoneMax, rules.phonePattern]"
            variant="outlined"
            density="compact"
            maxlength="16"
            placeholder="+1..."
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Birthdate</v-label>
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
                placeholder="YYYY-MM-DD"
              />
            </template>
            <v-date-picker
              v-model="datePickerValue"
              @update:model-value="onDateSelected"
              color="primary"
            />
          </v-menu>
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Gender</v-label>
          <v-select
            v-model="formData.profile.gender as Gender"
            :items="Object.values(Gender)"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
          />
        </v-col>
      </v-row>

      <p class="font-weight-medium mt-4 text-h6">Authentication</p>
      <v-divider color="grey my-4"></v-divider>
      <v-row>
        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Email Address</v-label>
          <v-text-field
            v-model="formData.email"
            :rules="[rules.email]"
            variant="outlined"
            density="compact"
            placeholder="john.doe@example.com"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">User Name</v-label>
          <v-text-field
            v-model="formData.profile.userName"
            :rules="[rules.userNameMax]"
            variant="outlined"
            density="compact"
            placeholder="john.doe@example.com"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Password</v-label>
          <v-text-field
            v-model="formData.password"
            :rules="[rules.required, rules.passwordMin]"
            variant="outlined"
            density="compact"
            type="password"
            placeholder="********"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-label class="mb-1 font-weight-medium">Confirm Password</v-label>
          <v-text-field
            v-model="confirmPassword"
            :rules="[rules.required, rules.passwordMatch]"
            variant="outlined"
            density="compact"
            type="password"
            placeholder="********"
          />
        </v-col>
      </v-row>
    </v-form>

    <div class="d-flex justify-end ga-2 mt-6">
      <v-btn variant="text" @click="router.push('/users')">Cancel</v-btn>
      <v-btn
        color="primary"
        @click="handleCreate"
        :loading="loading"
        :disabled="!isFormValid"
      >
        Create User
      </v-btn>
    </div>
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
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { Gender, type CreateUserDto } from "@/types/auth";
import { useDisplay } from "vuetify";
import { usersService } from "@/services/users.service";

const router = useRouter();
const { smAndDown, xs } = useDisplay();

interface FormState extends CreateUserDto {
  profile: NonNullable<CreateUserDto["profile"]>; // Esto obliga a que profile exista
}

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

// Refs para el form y UI
const formRef = ref<any>(null);
const isFormValid = ref(false);
const loading = ref(false);
const menuDate = ref(false);
const datePickerValue = ref(null);
const confirmPassword = ref("");

// Objeto inicial vacío para creación
const formData = reactive<FormState>({
  email: "",
  password: "",
  isActive: false,
  roles: [],
  profile: {
    firstName: "",
    lastName: "",
    phone: "",
    birthdate: "",
    gender: undefined,
    avatarUrl: "",
  },
});

// Reglas de validación
const rules = {
  required: (v: any) => !!v || "Required",
  email: (v: string) => !v || /.+@.+\..+/.test(v) || "E-mail must be valid",
  passwordMin: (v: string) => (v && v.length >= 8) || "Min 8 characters",
  userNameMax: (v: string) => v.length <= 200 || "Max 200 characters",
  phoneMax: (v: string) => v?.length <= 16 || "Max 16 characters",
  phonePattern: (v: string) =>
    /^[+0-9]*$/.test(v) || "Only numbers and + allowed",
  passwordMatch: (v: string) =>
    v === formData.password || "Passwords do not match",
};

const onDateSelected = (val: any) => {
  if (val) {
    const d = new Date(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    formData.profile.birthdate = `${year}-${month}-${day}`;
    menuDate.value = false;
  }
};

const handleCreate = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    console.log("PAYLOAD", formData);

    const finalPayload = {
      ...formData,
      email: formData.email?.length === 0 ? undefined : formData.email,
      isActive: true,
    };

    await usersService.createUser(finalPayload);

    snackbar.text = "User created successfully!";
    snackbar.color = "success";
    snackbar.show = true;

    setTimeout(() => {
      router.push("/users");
    }, 1500);
  } catch (error: any) {
    const errorMsg = Array.isArray(error.message)
      ? error.message[0]
      : error.message;

    snackbar.text = errorMsg || "An unexpected error occurred";
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>
