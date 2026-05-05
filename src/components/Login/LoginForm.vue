<!-- src/pages/auth/Login.vue -->
<route lang="json">{
    "name": "login",
    "meta": {
        "public": true
    }
}</route>

<template>
    <v-container fluid class="login-screen pa-0">
        <!-- Decoración de fondo -->
        <div class="login-blob login-blob--one" aria-hidden="true" />
        <div class="login-blob login-blob--two" aria-hidden="true" />

        <v-row class="ma-0 fill-height" no-gutters>
            <!-- Panel izquierdo: branding (oculto en mobile) -->
            <v-col
                cols="12"
                md="6"
                class="d-none d-md-flex login-hero pa-10 flex-column justify-space-between"
            >
                <div class="d-flex align-center ga-3">
                    <v-img
                        :src="logoUrl"
                        alt="Nova IO logo"
                        width="56"
                        height="56"
                        class="login-hero-logo"
                        contain
                        eager
                    />
                    <div>
                        <div class="text-h6 font-weight-bold" style="line-height: 1;">NOVA IO</div>
                        <div class="text-caption text-medium-emphasis">Nova in out</div>
                    </div>
                </div>

                <div class="login-hero-pitch">
                    <h1 class="text-h3 font-weight-bold mb-4" style="letter-spacing: -0.02em;">
                        Empowering<br />your workflow.
                    </h1>
                    <p class="text-body-1 text-medium-emphasis" style="max-width: 440px;">
                        Manage your driving school operations — leads, contacts, deals,
                        instructors and calendars — from a single place.
                    </p>
                </div>

                <div class="text-caption text-medium-emphasis">
                    © {{ new Date().getFullYear() }} Nova Driving School
                </div>
            </v-col>

            <!-- Panel derecho: formulario -->
            <v-col
                cols="12"
                md="6"
                class="d-flex align-center justify-center pa-4 pa-sm-8"
            >
                <v-card
                    class="login-card pa-6 pa-sm-8"
                    :max-width="460"
                    width="100%"
                    elevation="0"
                >
                    <!-- Header móvil -->
                    <div class="d-flex d-md-none align-center justify-center ga-3 mb-6">
                        <v-img
                            :src="logoUrl"
                            alt="Nova IO logo"
                            width="48"
                            height="48"
                            contain
                            eager
                        />
                        <div class="text-h6 font-weight-bold">NOVA IO</div>
                    </div>

                    <div class="mb-6">
                        <h2 class="text-h5 font-weight-bold mb-1" style="letter-spacing: -0.01em;">
                            Welcome back
                        </h2>
                        <p class="text-body-2 text-medium-emphasis ma-0">
                            Sign in to continue to your dashboard.
                        </p>
                    </div>

                    <v-form @submit.prevent="handleLogin">
                        <v-text-field
                            v-model="email"
                            label="Email"
                            type="email"
                            autocomplete="email"
                            prepend-inner-icon="mdi-email-outline"
                            class="mb-4"
                            density="comfortable"
                            variant="outlined"
                            hide-details="auto"
                        />

                        <v-text-field
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            label="Password"
                            autocomplete="current-password"
                            prepend-inner-icon="mdi-lock-outline"
                            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                            class="mb-2"
                            density="comfortable"
                            variant="outlined"
                            hide-details="auto"
                            @click:append-inner="showPassword = !showPassword"
                            @keyup.enter="handleLogin"
                        />

                        <div class="d-flex align-center justify-end mb-4">
                            <a class="text-caption text-primary" href="#" @click.prevent>
                                Forgot password?
                            </a>
                        </div>

                        <v-btn
                            type="submit"
                            :loading="auth.loading"
                            :disabled="!canSubmit"
                            color="primary"
                            size="large"
                            block
                            rounded="lg"
                            class="font-weight-bold"
                        >
                            Sign In
                            <template #append>
                                <v-icon size="20">mdi-arrow-right</v-icon>
                            </template>
                        </v-btn>

                        <v-alert
                            v-if="auth.error"
                            type="error"
                            variant="tonal"
                            class="mt-4"
                            density="compact"
                            rounded="lg"
                        >
                            {{ auth.error }}
                        </v-alert>
                    </v-form>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'

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
.login-screen {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background-color: rgb(var(--v-theme-background));
}

/* Decoración: gradientes circulares suaves */
.login-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.45;
    pointer-events: none;
    z-index: 0;
}
.login-blob--one {
    width: 480px;
    height: 480px;
    top: -160px;
    left: -160px;
    background: radial-gradient(circle, rgb(var(--v-theme-primary)) 0%, transparent 70%);
}
.login-blob--two {
    width: 520px;
    height: 520px;
    bottom: -200px;
    right: -180px;
    background: radial-gradient(circle, rgb(var(--v-theme-accent)) 0%, transparent 70%);
}
.v-theme--dark .login-blob {
    opacity: 0.25;
}

.login-hero {
    position: relative;
    z-index: 1;
}

.login-hero-logo {
    border-radius: 12px;
}

.login-hero-pitch h1 {
    color: rgb(var(--v-theme-on-surface));
}

.login-card {
    position: relative;
    z-index: 1;
    border-radius: 20px !important;
    border: 1px solid rgb(var(--v-theme-surface-variant)) !important;
    background-color: rgb(var(--v-theme-surface)) !important;
    box-shadow: 0 20px 50px -20px rgba(15, 23, 42, 0.25) !important;
}

.v-theme--dark .login-card {
    box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.6) !important;
}

a {
    text-decoration: none;
}
</style>
