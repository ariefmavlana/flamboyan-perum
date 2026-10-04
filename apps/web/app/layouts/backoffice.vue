<script setup lang="ts">
const session = useStaffSession()
const message = ref('')
onMounted(async () => {
  try {
    await session.refresh()
  } catch (error) {
    message.value = staffError(error)
  }
})
</script>
<template>
  <NuxtLayout name="default">
    <nav class="container workspace-nav" aria-label="Workspace tim">
      <NuxtLink to="/backoffice">CRM</NuxtLink>
      <NuxtLink to="/backoffice/properti">Katalog</NuxtLink>
      <NuxtLink to="/backoffice/profil">Profil</NuxtLink>
      <NuxtLink
        v-if="session.account.value?.role === 'ADMIN'"
        to="/backoffice/konten"
        >Konten publik</NuxtLink
      >
      <NuxtLink
        v-if="session.account.value?.role === 'ADMIN'"
        to="/backoffice/akun"
        >Akun tim</NuxtLink
      >
    </nav>
    <p v-if="message" class="container error-text" role="alert">
      {{ message }}
    </p>
    <slot />
  </NuxtLayout>
</template>
