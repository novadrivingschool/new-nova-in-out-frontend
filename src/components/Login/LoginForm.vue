<!--
  src/components/Login/LoginForm.vue

  Acceso. Misma estructura y técnica que go-nova/src/views/auth/LoginView.vue
  (referencia directa pedida): `v-theme-provider` en vez de un hack con
  v-sheet, retícula + viñeta en un componente de fondo aparte, tarjeta de
  cristal con filete claro de contorno y campos oscuros "solo-filled". La
  diferencia es la marca: el wordmark separa "N"/"O" (blanco, `on-surface`)
  de la "I" (`login-navy` en plugins/vuetify.ts, calibrado por contraste
  WCAG — ver el comentario junto a su definición) en vez del azul vibrante de
  `primary` que usa el resto de la app. Es deliberado, no un descuido:
  `primary` es el acento de marca para navegación y acciones en toda la
  interfaz, mientras que el login pidió expresamente un tono más serio y no
  lo comparte. La card en sí sigue en `surface`, igual que el resto de la
  app — se probaron dos variantes de un fondo de card propio (gris
  intermedio, luego azul sólido) y ninguna mejoró sobre esto; el contraste
  real lo da el acento sobre la card oscura, no el color de la card. El login
  sigue siempre en oscuro, sin selector de tema, sea cual sea el ajuste del
  resto de la app.

  Sin `v-main` propio: App.vue ya envuelve cada `<router-view>` en su propio
  `v-main`, así que anidar otro aquí duplicaría el layout de Vuetify. El
  `v-theme-provider` con `with-background` es directamente la raíz visual y
  simplemente llena ese `v-main` (`height: 100%`).
-->
<template>
  <v-theme-provider theme="dark" with-background class="login-root">
    <LoginBackdrop />

    <div class="login-center">
      <div class="login-stack">
        <v-card class="login-card" elevation="0">
          <p class="login-card__wordmark">
            N<span class="login-card__wordmark-accent">I</span>O
          </p>

          <v-card-text class="pa-0">
            <h1 class="login-card__title">Good to see you</h1>

            <p
              v-if="auth.error"
              class="login-card__error mt-5"
              role="alert"
              aria-live="assertive"
            >
              {{ auth.error }}
            </p>

            <v-form class="login-form mt-5" @submit.prevent="handleLogin">
              <v-text-field
                v-model="employeeNumber"
                name="employeeNumber"
                type="text"
                label="Employee number"
                placeholder="NIOJD483920"
                variant="solo-filled"
                flat
                autocomplete="username"
                autocapitalize="characters"
                autocorrect="off"
                spellcheck="false"
                prepend-inner-icon="mdi-account-outline"
                class="login-field login-field--mono mb-3"
                :disabled="auth.loading"
                :error="hasError"
                @keyup.enter="handleLogin"
              />

              <v-text-field
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                placeholder="••••••••"
                variant="solo-filled"
                flat
                autocomplete="current-password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                class="login-field"
                :disabled="auth.loading"
                :error="hasError"
                @click:append-inner="showPassword = !showPassword"
                @keyup.enter="handleLogin"
              />

              <v-btn
                type="submit"
                block
                size="large"
                class="login-btn mt-5"
                :loading="auth.loading"
                :disabled="!canSubmit"
              >
                Continue
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </v-theme-provider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'
import LoginBackdrop from '@/components/Login/LoginBackdrop.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const employeeNumber = ref('')
const password = ref('')
const showPassword = ref(false)

const hasError = computed(() => !!auth.error)

const canSubmit = computed(
  () => !!employeeNumber.value.trim() && !!password.value && !auth.loading,
)

// Al corregir los datos se retira el error: mantenerlo visible mientras el
// usuario reescribe sugiere que el nuevo valor también ha fallado.
watch([employeeNumber, password], () => {
  if (auth.error) auth.error = null
})

async function handleLogin(): Promise<void> {
  if (!canSubmit.value) return

  const ok = await auth.login(employeeNumber.value, password.value)
  if (!ok) return

  const redirect = (route.query.redirect as string) || '/screenshots'
  await router.replace(redirect)
}
</script>

<style scoped>
/* ===== Fondo ===== */
/* Llena el `v-main` de App.vue (ya es `height: 100%` + `overflow-y: auto`
   por app.scss) en vez de imponer su propio 100dvh — evitaría un doble
   cálculo de alto y un scroll interno espurio. */
.login-root {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.login-center {
  position: relative;
  z-index: 5;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-6) var(--app-gutter);
}

.login-stack {
  width: 100%;
  max-width: 25rem;
}

/* ===== Tarjeta ===== */
.login-card {
  position: relative;
  padding: var(--app-space-6);
  text-align: center;
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--app-radius-xl) !important;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.08) !important;
}

/* Filete claro del contorno — el mismo recurso que en go-nova para separar
   la tarjeta del fondo sin depender de una sombra dura. */
.login-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.85);
  border-radius: inherit;
  pointer-events: none;
}

.login-card__wordmark {
  margin: 0 0 var(--app-space-6);
  font-size: var(--app-text-5xl);
  font-weight: 700;
  letter-spacing: var(--app-tracking-tighter);
  color: rgb(var(--v-theme-on-surface));
}

.login-card__wordmark-accent {
  color: rgb(var(--v-theme-login-navy));
}

.login-card__title {
  font-size: var(--app-text-xl);
  font-weight: 600;
  letter-spacing: var(--app-tracking-tighter);
  line-height: 1.2;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.login-card__error {
  margin: 0;
  padding-inline-start: var(--app-space-3);
  border-inline-start: 2px solid rgb(var(--v-theme-error));
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-error));
  text-align: left;
}

/* ===== Formulario ===== */
.login-form {
  text-align: left;
}

/* Campos oscuros "solo-filled": el mismo tratamiento que go-nova, adaptado a
   los tokens de NIO en vez de hex sueltos. */
.login-field :deep(.v-field) {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: var(--app-radius-sm);
}

.login-field :deep(.v-field:hover) {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.login-field :deep(.v-field--focused) {
  background: rgba(var(--v-theme-on-surface), 0.1);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.25);
}

.login-field :deep(.v-label) {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 1;
}

.login-field :deep(.v-field__prepend-inner .v-icon),
.login-field :deep(.v-field__append-inner .v-icon) {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 1;
}

/* El backend normaliza a mayúsculas; mostrarlo así evita confusión */
.login-field--mono :deep(input) {
  font-family: var(--app-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/**
 * Chrome/Edge pintan los campos autocompletados con su propio fondo (amarillo
 * o azulado) sin avisar; sin este reset el formulario parece roto en cuanto
 * el navegador autorrellena employee number o password.
 */
.login-field :deep(input:-webkit-autofill),
.login-field :deep(input:-webkit-autofill:hover),
.login-field :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: rgb(var(--v-theme-on-surface));
  caret-color: rgb(var(--v-theme-on-surface));
  -webkit-box-shadow: 0 0 0 1000px rgb(var(--v-theme-surface-variant)) inset;
  transition: background-color 9999s ease-in-out 0s;
}

/* ===== Botón ===== */
.login-btn {
  font-weight: 600;
  background: rgb(var(--v-theme-login-navy)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--app-space-5);
  }

  .login-card__wordmark {
    /* A 56px "NIO" no cabe con margen en una card de ~280px de ancho útil en
       pantallas angostas (padding reducido + gutter) — un escalón menos que
       en desktop, sigue siendo notablemente más grande que el resto de la
       interfaz. */
    font-size: var(--app-text-4xl);
    margin-bottom: var(--app-space-5);
  }
}
</style>
