<template>
    <v-container fluid class="app-page d-flex justify-center align-start">
      <v-card class="app-card pa-6 pa-sm-8" width="100%" max-width="540" elevation="0">
        <div class="d-flex align-center ga-3 mb-6">
          <div class="d-flex align-center justify-center" style="width: 44px; height: 44px; border-radius: 12px; background: rgba(var(--v-theme-primary), 0.12);">
            <v-icon color="primary" size="22">mdi-credit-card-outline</v-icon>
          </div>
          <div>
            <h1 class="text-h6 font-weight-bold ma-0" style="line-height: 1.1;">Payment</h1>
            <div class="text-caption text-medium-emphasis">Securely process a card payment</div>
          </div>
        </div>

        <v-form @submit.prevent="handleSubmit" class="d-flex flex-column ga-4">
          <v-text-field
            v-model="cardholderName"
            label="Cardholder Name"
            required
            prepend-inner-icon="mdi-account-outline"
          />

          <div>
            <label class="field-label">Card Number</label>
            <div ref="cardNumberRef" class="stripe-field" />
          </div>

          <div class="d-flex ga-3 flex-wrap flex-sm-nowrap">
            <div class="flex-grow-1">
              <label class="field-label">Expiration Date</label>
              <div ref="cardExpiryRef" class="stripe-field" />
            </div>
            <div class="flex-grow-1">
              <label class="field-label">CVC</label>
              <div ref="cardCvcRef" class="stripe-field" />
            </div>
          </div>

          <v-alert v-if="cardError" type="error" variant="tonal" density="compact" rounded="lg">
            {{ cardError }}
          </v-alert>

          <v-btn type="submit" color="primary" :loading="loading" block size="large" class="font-weight-bold">
            <v-icon start>mdi-lock-outline</v-icon>
            Pay Now
          </v-btn>

          <div class="d-flex align-center justify-center ga-1 text-caption text-medium-emphasis">
            <v-icon size="14">mdi-shield-check-outline</v-icon>
            <span>Secured with Stripe</span>
          </div>
        </v-form>
      </v-card>
    </v-container>
  </template>

  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { loadStripe } from '@stripe/stripe-js'

  let stripe: any
  let elements: any
  let cardNumber: any
  let cardExpiry: any
  let cardCvc: any

  const cardNumberRef = ref<HTMLElement | null>(null)
  const cardExpiryRef = ref<HTMLElement | null>(null)
  const cardCvcRef = ref<HTMLElement | null>(null)

  const cardholderName = ref('')
  const cardError = ref('')
  const loading = ref(false)

  onMounted(async () => {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK)
    if (!stripe) {
      cardError.value = 'Stripe failed to load.'
      return
    }

    elements = stripe.elements({
      locale: 'auto',
      appearance: {
        theme: 'flat',
      },
    })

    const style = {
      base: {
        fontSize: '15px',
        color: '#0f172a',
        fontFamily: 'Inter, Roboto, sans-serif',
        '::placeholder': { color: '#94a3b8' },
      },
      invalid: {
        color: '#ef4444',
      },
    }

    cardNumber = elements.create('cardNumber', { style })
    cardNumber.mount(cardNumberRef.value!)

    cardExpiry = elements.create('cardExpiry', { style })
    cardExpiry.mount(cardExpiryRef.value!)

    cardCvc = elements.create('cardCvc', { style })
    cardCvc.mount(cardCvcRef.value!)

    cardNumber.on('change', (event: any) => {
      cardError.value = event.error ? event.error.message : ''
    })
  })

  const handleSubmit = async () => {
    cardError.value = ''
    loading.value = true

    const { token, error } = await stripe.createToken(cardNumber, {
      name: cardholderName.value,
    })

    if (error) {
      cardError.value = error.message
    } else {
      console.log('Token generated:', token.id)
    }

    loading.value = false
  }
  </script>

  <style scoped>
  .stripe-field {
    padding: 14px 12px;
    border: 1px solid rgb(var(--v-theme-surface-variant));
    border-radius: 8px;
    background-color: rgb(var(--v-theme-surface));
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }
  .stripe-field:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }

  .field-label {
    font-size: 0.78rem;
    font-weight: 600;
    margin-bottom: 6px;
    display: block;
    color: rgb(var(--v-theme-on-surface-variant));
    letter-spacing: 0.02em;
  }
  </style>
