<script setup lang="ts">
import type { User } from '#shared/types'
const email = ref('')
const password = ref('')
const message = ref('')
const busy = ref(false)
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
const api = useStaffApi()
useSeoMeta({
  title: 'Masuk tim — Flamboyan Perum',
  robots: 'noindex, nofollow',
})
async function login() {
  busy.value = true
  message.value = ''
  try {
    await api.request<{ data: User }>('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    password.value = ''
    await navigateTo('/backoffice')
  } catch {
    message.value =
      'Belum dapat masuk. Periksa email dan kata sandi atau coba kembali.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="container section">
    <form class="login-panel" @submit.prevent="login">
      <p class="eyebrow">TIM FLAMBOYAN</p>
      <h1>Selamat datang kembali.</h1>
      <p class="muted">Masuk untuk mengelola perjalanan calon pembeli.</p>
      <label
        >Email<input
          v-model="email"
          :disabled="!hydrated"
          type="email"
          required
          autocomplete="username"
          maxlength="254" /></label
      ><label
        >Kata sandi<input
          v-model="password"
          :disabled="!hydrated"
          type="password"
          required
          autocomplete="current-password"
          maxlength="1024"
      /></label>
      <p v-if="message" role="alert" class="error-text">{{ message }}</p>
      <button class="button full" :disabled="busy || !hydrated" type="submit">
        {{ busy ? 'Memproses…' : 'Masuk →' }}
      </button>
      <NuxtLink to="/forgot-password">Lupa kata sandi?</NuxtLink>
      <p v-if="$route.query.updated" role="status">
        Kata sandi diperbarui. Silakan masuk kembali.
      </p>
    </form>
  </section>
</template>
