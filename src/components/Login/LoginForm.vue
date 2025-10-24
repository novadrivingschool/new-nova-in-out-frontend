<!-- src/pages/auth/Login.vue -->
<route lang="json">{
    "name": "login",
    "meta": {
        "public": true
    }
}</route>

<template>
    <v-container fluid class="login-screen d-flex align-center justify-center">
        <v-card class="pa-8 login-card" width="580" elevation="4">
            <!-- Logo + título -->
            <!-- Header horizontal -->
            <!-- Header con 2 líneas -->
            <!-- Header con 2 líneas alineadas a la izquierda -->
            <div class="logo-header mb-6">
                <div class="logo-title-row">
                    <v-img :src="logoUrl" alt="Nova IO logo" width="148" height="148" class="logo-img" contain eager />
                    <h2 class="nova-title">NOVA IO</h2>
                </div>
                <p class="nova-subtitle">
                    <strong class="highlight">Nova in out</strong> Empowering your workflow
                </p>
            </div>



            <!-- Formulario -->
            <v-form @submit.prevent="handleLogin" class="mt-6">
                <div class="form-fields">
                    <v-text-field v-model="email" label="Email" variant="underlined" density="comfortable"
                        class="mb-4 minimal-input" hide-details type="email" autocomplete="email" />
                    <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" label="Password"
                        variant="underlined" density="comfortable" class="mb-6 minimal-input" hide-details
                        autocomplete="current-password" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showPassword = !showPassword" @keyup.enter="handleLogin" />
                </div>

                <v-btn type="submit" :loading="auth.loading" :disabled="!canSubmit" color="#2d2d2d" class="custom-btn"
                    block rounded>
                    Sign In
                </v-btn>

                <v-alert v-if="auth.error" type="error" variant="tonal" class="mt-3" density="compact">
                    {{ auth.error }}
                </v-alert>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'

// ✅ Importa el logo para que siempre se resuelva bien la ruta
import logoUrl from '@/assets/Logos/Logocarro.png'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const canSubmit = computed(() => !!email.value && !!password.value && !auth.loading)

const handleLogin = async () => {
    if (!canSubmit.value) return
    const ok = await auth.login(email.value, password.value)
    if (ok) {
        const redirect = (route.query.redirect as string) || '/test'
        router.replace(redirect)
    }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

.login-screen {
    min-height: 100vh;
    background-color: #121212;
    padding: 0;
}

.login-card {
    background-color: #1f1f1f;
    border-radius: 16px;
}

.minimal-input .v-field {
    background-color: transparent !important;
    border-bottom: 1px solid #555;
    border-radius: 0;
}

.minimal-input .v-label {
    color: white !important;
}

.minimal-input input {
    color: white !important;
}

.minimal-input :deep(.v-field__input) {
    color: #fff !important;
    caret-color: #fff !important;
}

.minimal-input :deep(.v-field-label),
.minimal-input :deep(.v-icon) {
    color: #fff !important;
}

.minimal-input :deep(.v-field__outline),
.minimal-input :deep(.v-field__overlay) {
    border-color: rgba(255, 255, 255, 0.7) !important;
    background: transparent !important;
}

.v-input__control {
    color: white !important;
}

.custom-btn {
    color: white;
    background-color: #2d2d2d;
    transition: background-color 0.3s ease;
}

.custom-btn:hover {
    background-color: #3a3a3a;
}

/* Header */
.logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* .nova-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    color: #fff;
} */

/* .nova-subtitle {
    font-size: 0.95rem;
    color: #b0b0b0;
    margin-top: 4px;
} */

.logo-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    /* 👈 alinea todo a la izquierda */
    text-align: left;
}

.logo-title-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    /* 👈 alinea logo + título a la izquierda */
    gap: 10px;
}

.logo-img {
    border-radius: 8px;
}

.nova-title {
    font-size: 6rem;
    font-weight: 700;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    color: #fff;
}

.nova-subtitle {
    font-size: 1rem;
    color: #b0b0b0;
    margin-top: 6px;
}

.highlight {
    color: #fff;
    font-weight: 600;
}

.form-fields {
  max-width: 280px;   /* 👈 ancho controlado */
  margin-left: 0;     /* 👈 alinea a la izquierda */
}


</style>
