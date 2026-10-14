<script setup lang="ts">
import { siteOrigin } from '#shared/utils/seo'
const config = useRuntimeConfig()
const origin = computed(() => siteOrigin(String(config.public.siteUrl)))
useHead({
  titleTemplate: (title?: string) =>
    !title || title === 'Flamboyan Perum'
      ? 'Flamboyan Perum'
      : `${title} · Flamboyan`,
  meta: computed(() => [
    {
      property: 'og:image',
      content: `${origin.value}/images/flamboyan-kawasan.webp`,
    },
    {
      property: 'og:image:alt',
      content:
        'Ilustrasi kawasan Bukit Flamboyan Indah 2 dari Rumah Rajasa; bukan foto kondisi aktual.',
    },
  ]),
})
</script>
<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
