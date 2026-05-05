<!-- src/components/Login/LoginForm.vue -->
<template>
    <div class="login-root">

        <!-- ═══════════════════ PANEL IZQUIERDO (branding) ═══════════════════ -->
        <div class="login-hero d-none d-md-flex">
            <!-- Patrón de fondo sutil -->
            <div class="hero-grid" aria-hidden="true" />

            <!-- Círculos decorativos -->
            <div class="hero-circle hero-circle--lg" aria-hidden="true" />
            <div class="hero-circle hero-circle--sm" aria-hidden="true" />

            <div class="hero-content">
                <!-- Logo + nombre -->
                <div class="hero-brand">
                    <div class="hero-logo-wrap">
                        <img :src="logoUrl" alt="Nova IO" class="hero-logo-img" />
                    </div>
                    <div class="hero-brand-text">
                        <span class="hero-brand-name">Nova In Out</span>
                        <span class="hero-brand-sub">Nova Driving School</span>
                    </div>
                </div>

                <!-- Pitch principal -->
                <div class="hero-pitch">
                    <h1 class="hero-headline">
                        Track time.<br />
                        Stay productive.
                    </h1>
                    <p class="hero-subline">
                        Clock in, monitor activity and manage your team — all in one place.
                    </p>
                </div>

                <!-- Feature chips -->
                <div class="hero-chips">
                    <span class="hero-chip">
                        <span class="hero-chip-dot" />
                        Activity tracking
                    </span>
                    <span class="hero-chip">
                        <span class="hero-chip-dot" />
                        Screenshot capture
                    </span>
                    <span class="hero-chip">
                        <span class="hero-chip-dot" />
                        Real-time reporting
                    </span>
                </div>

                <!-- Footer del panel -->
                <p class="hero-footer">© {{ new Date().getFullYear() }} Nova Driving School</p>
            </div>
        </div>

        <!-- ═══════════════════ PANEL DERECHO (formulario) ═══════════════════ -->
        <div class="login-form-panel">

            <!-- Mobile: logo compacto -->
            <div class="mobile-brand d-flex d-md-none">
                <img :src="logoUrl" alt="Nova IO" class="mobile-logo" />
                <span class="mobile-brand-name">Nova In Out</span>
            </div>

            <div class="login-card">

                <!-- Encabezado -->
                <div class="card-header">
                    <div class="card-icon-wrap">
                        <v-icon color="primary" size="26">mdi-account-clock-outline</v-icon>
                    </div>
                    <h2 class="card-title">Welcome back</h2>
                    <p class="card-subtitle">Sign in to continue to your dashboard.</p>
                </div>

                <!-- Formulario -->
                <v-form class="card-form" @submit.prevent="handleLogin">

                    <div class="field-group">
                        <label class="field-label">Email address</label>
                        <v-text-field
                            v-model="email"
                            type="email"
                            placeholder="you@example.com"
                            autocomplete="email"
                            prepend-inner-icon="mdi-email-outline"
                            variant="outlined"
                            density="comfortable"
                            color="primary"
                            hide-details="auto"
                            :disabled="auth.loading"
                            class="field-input"
                            @keyup.enter="handleLogin"
                        />
                    </div>

                    <div class="field-group">
                        <div class="field-label-row">
                            <label class="field-label">Password</label>
                            <a class="forgot-link" href="#" @click.prevent>Forgot password?</a>
                        </div>
                        <v-text-field
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="••••••••"
                            autocomplete="current-password"
                            prepend-inner-icon="mdi-lock-outline"
                            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                            variant="outlined"
                            density="comfortable"
                            color="primary"
                            hide-details="auto"
                            :disabled="auth.loading"
                            class="field-input"
                            @click:append-inner="showPassword = !showPassword"
                            @keyup.enter="handleLogin"
                        />
                    </div>

                    <!-- Error -->
                    <transition name="fade-err">
                        <div v-if="auth.error" class="error-banner">
                            <v-icon size="18" color="error">mdi-alert-circle-outline</v-icon>
                            <span>{{ auth.error }}</span>
                        </div>
                    </transition>

                    <!-- Botón -->
                    <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        block
                        rounded="lg"
                        :loading="auth.loading"
                        :disabled="!canSubmit"
                        class="signin-btn"
                        elevation="0"
                    >
                        <template v-if="!auth.loading">
                            Sign In
                            <v-icon end size="18">mdi-arrow-right</v-icon>
                        </template>
                    </v-btn>

                </v-form>

                <!-- Divider -->
                <div class="card-divider">
                    <span class="divider-line" />
                    <span class="divider-text">Secure login</span>
                    <span class="divider-line" />
                </div>

                <!-- Trust badges -->
                <div class="trust-badges">
                    <span class="trust-badge">
                        <v-icon size="14" color="success">mdi-shield-check-outline</v-icon>
                        Encrypted
                    </span>
                    <span class="trust-badge">
                        <v-icon size="14" color="primary">mdi-lock-outline</v-icon>
                        JWT Auth
                    </span>
                    <span class="trust-badge">
                        <v-icon size="14" color="warning">mdi-clock-outline</v-icon>
                        Auto-refresh
                    </span>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'
import logoUrl from '@/assets/Logos/Logocarro.png'

const router = useRouter()
const route  = useRoute()
const auth   = useAuth()

const email        = ref('')
const password     = ref('')
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
/* ─── Layout raíz ─────────────────────────────────────────────────── */
.login-root {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background-color: #F4F6FA;
}

/* ─── Panel izquierdo: Hero ────────────────────────────────────────── */
.login-hero {
    flex: 0 0 48%;
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, #1e3a8a 0%, #2563eb 55%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px 52px;
}

/* Patrón de puntos / grid */
.hero-grid {
    position: absolute;
    inset: 0;
    background-image:
        radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
}

/* Círculos decorativos */
.hero-circle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}
.hero-circle--lg {
    width: 520px;
    height: 520px;
    top: -180px;
    right: -180px;
    background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
    border: 1px solid rgba(255,255,255,0.08);
}
.hero-circle--sm {
    width: 280px;
    height: 280px;
    bottom: -80px;
    left: -80px;
    background: radial-gradient(circle, rgba(99,163,255,0.15) 0%, transparent 70%);
}

.hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 40px;
    width: 100%;
    max-width: 420px;
}

/* Brand */
.hero-brand {
    display: flex;
    align-items: center;
    gap: 14px;
}
.hero-logo-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.2);
    overflow: hidden;
    flex-shrink: 0;
}
.hero-logo-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}
.hero-brand-text {
    display: flex;
    flex-direction: column;
}
.hero-brand-name {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
}
.hero-brand-sub {
    color: rgba(255,255,255,0.65);
    font-size: 0.75rem;
    letter-spacing: 0.01em;
}

/* Pitch */
.hero-headline {
    color: #fff;
    font-size: clamp(1.9rem, 3vw, 2.6rem);
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.03em;
    margin: 0 0 16px;
}
.hero-subline {
    color: rgba(255,255,255,0.72);
    font-size: 1rem;
    line-height: 1.65;
    margin: 0;
    max-width: 360px;
}

/* Feature chips */
.hero-chips {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.hero-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.18);
    backdrop-filter: blur(6px);
    border-radius: 999px;
    padding: 7px 16px;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.9);
    width: fit-content;
    font-weight: 500;
}
.hero-chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #86efac;
    flex-shrink: 0;
    box-shadow: 0 0 6px #86efac;
}

.hero-footer {
    color: rgba(255,255,255,0.38);
    font-size: 0.73rem;
    margin: 0;
}

/* ─── Panel derecho: Formulario ────────────────────────────────────── */
.login-form-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
}

/* Mobile brand */
.mobile-brand {
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
    position: absolute;
    top: 24px;
    left: 24px;
}
.mobile-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 8px;
    background: #e8f0fe;
}
.mobile-brand-name {
    font-weight: 700;
    font-size: 1rem;
    color: #1e3a8a;
}

/* Card */
.login-card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow:
        0 1px 2px rgba(15,23,42,0.04),
        0 8px 24px rgba(15,23,42,0.06),
        0 24px 48px rgba(15,23,42,0.04);
    padding: 40px 40px 32px;
}

/* Card header */
.card-header {
    margin-bottom: 28px;
}
.card-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}
.card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
}
.card-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
}

/* Formulario */
.card-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.field-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.01em;
}
.field-input :deep(.v-field) {
    border-radius: 10px;
}
.forgot-link {
    font-size: 0.78rem;
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}
.forgot-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
}

/* Error banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.84rem;
    color: #b91c1c;
    font-weight: 500;
}

/* Botón */
.signin-btn {
    height: 48px !important;
    font-size: 0.95rem !important;
    letter-spacing: 0.01em !important;
    margin-top: 4px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    box-shadow: 0 4px 14px rgba(37,99,235,0.35) !important;
    transition: box-shadow 0.2s, transform 0.15s !important;
}
.signin-btn:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(37,99,235,0.45) !important;
    transform: translateY(-1px);
}

/* Divider */
.card-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 16px;
}
.divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}
.divider-text {
    font-size: 0.72rem;
    color: #94a3b8;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

/* Trust badges */
.trust-badges {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}
.trust-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.74rem;
    color: #64748b;
    font-weight: 500;
}

/* Transición error */
.fade-err-enter-active, .fade-err-leave-active {
    transition: opacity 0.25s, transform 0.25s;
}
.fade-err-enter-from, .fade-err-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* ─── Mobile ───────────────────────────────────────────────────────── */
@media (max-width: 959px) {
    .login-root {
        flex-direction: column;
        background: linear-gradient(160deg, #1e3a8a 0%, #2563eb 100%);
        min-height: 100vh;
    }
    .login-form-panel {
        flex: 1;
        padding: 80px 20px 40px;
    }
    .login-card {
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
}
</style>
