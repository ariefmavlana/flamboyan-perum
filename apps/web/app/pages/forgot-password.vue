<script setup lang="ts">
useSeoMeta({ title: 'Pemulihan akun — Flamboyan', robots: 'noindex, nofollow' })
const email = ref('')
const message = ref('')
const busy = ref(false)
async function submit() {
  busy.value = true
  try {
    const response = await useStaffApi().request<{ message: string }>(
      '/auth/forgot-password',
      { method: 'POST', body: { email: email.value } },
    )
    message.value = response.message
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="container section">
    <form class="login-panel" @submit.prevent="submit">
      <h1>Pulihkan akun tim</h1>
      <p class="muted">
        Tautan pemulihan berlaku 60 menit. Gunakan email akun yang telah
        diverifikasi Admin.
      </p>
      <label
        >Email<input
          v-model="email"
          required
          type="email"
          autocomplete="username"
          maxlength="254"
      /></label>
      <p v-if="message" role="status">{{ message }}</p>
      <button class="button" :disabled="busy">Kirim petunjuk pemulihan</button
      ><NuxtLink to="/login">Kembali masuk</NuxtLink>
    </form>
  </section>
</template>
