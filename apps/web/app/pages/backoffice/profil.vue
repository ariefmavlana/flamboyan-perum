<script setup lang="ts">
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Profil tim — Flamboyan', robots: 'noindex, nofollow' })
const session = useStaffSession()
const name = ref('')
const currentPassword = ref('')
const password = ref('')
const confirmation = ref('')
const message = ref('')
const busy = ref(false)
const version = ref(0)
async function load() {
  try {
    await session.refresh()
    name.value = session.account.value?.name ?? ''
    version.value = session.account.value?.version ?? 0
  } catch (error) {
    message.value = staffError(error)
  }
}
async function save() {
  busy.value = true
  try {
    await useStaffApi().request('/api/v1/me', {
      method: 'PATCH',
      body: {
        name: name.value,
        version: version.value,
        ...(password.value
          ? {
              current_password: currentPassword.value,
              password: password.value,
              password_confirmation: confirmation.value,
            }
          : {}),
      },
    })
    if (password.value) {
      session.account.value = null
      await navigateTo('/login?updated=1')
    } else {
      await load()
      message.value = 'Profil tersimpan.'
    }
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
    currentPassword.value = ''
    password.value = ''
    confirmation.value = ''
  }
}
onMounted(load)
</script>
<template>
  <section class="container section">
    <h1>Profil tim</h1>
    <form class="login-panel" @submit.prevent="save">
      <p class="muted">
        Email dan peran dikelola Admin. Perubahan kata sandi mengakhiri seluruh
        sesi akun Anda.
      </p>
      <label
        >Nama<input
          v-model="name"
          required
          maxlength="160"
          autocomplete="name" /></label
      ><label
        >Kata sandi saat ini<input
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          :required="!!password" /></label
      ><label
        >Kata sandi baru (opsional)<input
          v-model="password"
          type="password"
          minlength="12"
          maxlength="1024"
          autocomplete="new-password" /></label
      ><label
        >Ulangi kata sandi baru<input
          v-model="confirmation"
          type="password"
          :required="!!password"
          autocomplete="new-password"
      /></label>
      <p v-if="message" role="status">{{ message }}</p>
      <div class="action-row">
        <button class="button" :disabled="busy || !version">
          Simpan profil</button
        ><button class="button secondary" type="button" @click="load">
          Muat ulang
        </button>
      </div>
    </form>
  </section>
</template>
