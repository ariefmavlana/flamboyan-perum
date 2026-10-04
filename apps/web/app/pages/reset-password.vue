<script setup lang="ts">
useSeoMeta({
  title: 'Kata sandi baru — Flamboyan',
  robots: 'noindex, nofollow',
})
const route = useRoute()
const password = ref('')
const confirmation = ref('')
const message = ref('')
const busy = ref(false)
const valid = computed(
  () =>
    typeof route.query.token === 'string' &&
    typeof route.query.email === 'string',
)
async function submit() {
  busy.value = true
  try {
    await useStaffApi().request('/auth/reset-password', {
      method: 'POST',
      body: {
        email: route.query.email,
        token: route.query.token,
        password: password.value,
        password_confirmation: confirmation.value,
      },
    })
    await navigateTo('/login?updated=1', { replace: true })
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
    password.value = ''
    confirmation.value = ''
  }
}
</script>
<template>
  <section class="container section">
    <form v-if="valid" class="login-panel" @submit.prevent="submit">
      <h1>Atur kata sandi baru</h1>
      <label
        >Kata sandi baru<input
          v-model="password"
          required
          type="password"
          minlength="12"
          maxlength="1024"
          autocomplete="new-password" /></label
      ><label
        >Ulangi kata sandi<input
          v-model="confirmation"
          required
          type="password"
          autocomplete="new-password"
      /></label>
      <p v-if="message" role="alert">{{ message }}</p>
      <button class="button" :disabled="busy">Perbarui kata sandi</button>
    </form>
    <div v-else class="login-panel">
      <p class="eyebrow">PEMULIHAN AKUN</p>
      <h1>Periksa tautan pemulihan.</h1>
      <p role="alert">
        Tautan pemulihan tidak lengkap.
        <NuxtLink class="text-link" to="/forgot-password"
          >Minta tautan baru</NuxtLink
        >.
      </p>
    </div>
  </section>
</template>
