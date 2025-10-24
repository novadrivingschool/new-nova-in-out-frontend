<template>
    <v-container fluid class="d-flex justify-center">
      <v-card class="pa-6 mt-12" width="500" elevation="4">
        <h2 class="text-h6 mb-4">Payment Form</h2>
  
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="cardholderName"
            label="Cardholder Name"
            required
            class="mb-4"
          />
  
          <label class="field-label">Card Number</label>
          <div ref="cardNumberRef" class="stripe-field" />
  
          <label class="field-label">Expiration Date</label>
          <div ref="cardExpiryRef" class="stripe-field" />
  
          <label class="field-label">CVC</label>
          <div ref="cardCvcRef" class="stripe-field" />
  
          <p v-if="cardError" class="text-red">{{ cardError }}</p>
  
          <v-btn type="submit" color="primary" :loading="loading" block>
            Pay Now
          </v-btn>
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
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': { color: '#aaa' },
      },
      invalid: {
        color: '#e53935',
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
      console.log('💳 Token generated:', token.id)
      // Send token.id to your backend
    }
  
    loading.value = false
  }
  </script>
  
  <style scoped>
  .stripe-field {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 16px;
    background-color: #1f1f1f;
  }
  
  .field-label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    display: block;
    color: #ccc;
  }
  
  .text-red {
    color: #e53935;
    font-size: 14px;
  }
  </style>
  