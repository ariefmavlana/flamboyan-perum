<script setup lang="ts">
import type { User } from '#shared/types'
const email = ref('')
const password = ref('')
const message = ref('')
const busy = ref(false)
const hydrated = ref(false)
const checking = ref(true)
const guest = ref(false)
const sessionError = ref('')
const session = useStaffSession()
let active = true
onBeforeUnmount(() => {
  active = false
})
onMounted(() => {
  hydrated.value = true
  void checkSession()
})
const api = useStaffApi()
useSeoMeta({
  title: 'Masuk tim — Flamboyan Perum',
  robots: 'noindex, nofollow',
})
async function checkSession() {
  checking.value = true
  guest.value = false
  sessionError.value = ''
  try {
    const account = await session.refresh({ redirectOnGuest: false })
    if (!active) return
    if (account) await navigateTo('/backoffice', { replace: true })
    else guest.value = true
  } catch {
    if (active)
      sessionError.value =
        'Sesi belum dapat diperiksa. Periksa koneksi Anda lalu coba lagi.'
  } finally {
    if (active) checking.value = false
  }
}
async function login() {
  if (busy.value || !guest.value) return
  busy.value = true
  message.value = ''
  try {
    await api.request<{ data: User }>('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    password.value = ''
    await navigateTo('/backoffice', { replace: true })
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
    <div v-if="checking" class="login-panel" role="status" aria-live="polite">
      <p class="eyebrow">TIM FLAMBOYAN</p>
      <h1>Memeriksa sesi Anda…</h1>
      <p class="muted">Sebentar, kami menyiapkan akses workspace Anda.</p>
    </div>
    <div v-else-if="sessionError" class="login-panel">
      <h1>Akses workspace</h1>
      <p role="alert" class="error-text">{{ sessionError }}</p>
      <button class="button full" type="button" @click="checkSession">
        Coba lagi
      </button>
    </div>
    <form v-else-if="guest" class="login-panel" @submit.prevent="login">
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
