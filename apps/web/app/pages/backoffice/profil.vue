<script setup lang="ts">
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Profil saya', robots: 'noindex, nofollow' })
const session = useStaffSession()
const name = ref('')
const currentPassword = ref('')
const password = ref('')
const confirmation = ref('')
const message = ref('')
const success = ref(false)
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
  success.value = false
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
      success.value = true
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
    <h1>Profil saya</h1>
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
      ><PasswordField
        v-model="currentPassword"
        label="Kata sandi saat ini"
        autocomplete="current-password"
        :required="!!password"
      /><PasswordField
        v-model="password"
        label="Kata sandi baru (opsional)"
        minlength="12"
        maxlength="1024"
        autocomplete="new-password"
      /><PasswordField
        v-model="confirmation"
        label="Ulangi kata sandi baru"
        :required="!!password"
        autocomplete="new-password"
      />
      <p
        v-if="message"
        :role="success ? 'status' : 'alert'"
        :class="success ? 'success-notice' : 'error-text'"
      >
        {{ message }}
      </p>
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
