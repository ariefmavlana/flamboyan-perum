<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const missing = computed(() => props.error.statusCode === 404)
useHead({
  title: () =>
    `${missing.value ? 'Halaman tidak ditemukan' : 'Halaman belum tersedia'} — Flamboyan`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
<template>
  <NuxtLayout name="default"
    ><section class="container section narrow error-page">
      <p class="eyebrow">{{ error.statusCode }}</p>
      <h1>
        {{
          missing ? 'Halaman tidak ditemukan.' : 'Halaman belum dapat dimuat.'
        }}
      </h1>
      <p class="muted">
        {{
          missing
            ? 'Tautan mungkin sudah berubah atau properti tidak lagi tersedia dalam katalog.'
            : 'Ada kendala saat memuat informasi. Silakan kembali ke beranda dan coba lagi.'
        }}
      </p>
      <button
        class="button"
        :disabled="!ready"
        @click="clearError({ redirect: '/' })"
      >
        Kembali ke beranda <AppIcon name="arrow" />
      </button></section
  ></NuxtLayout>
</template>
