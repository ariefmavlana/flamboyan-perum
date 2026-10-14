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
      content: `${origin.value}/images/gerbang-kawasan-1920.webp`,
    },
    {
      property: 'og:image:alt',
      content:
        'Gerbang kawasan Bukit Flamboyan Indah 2 · dokumentasi pengguna.',
    },
  ]),
})
</script>
<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
