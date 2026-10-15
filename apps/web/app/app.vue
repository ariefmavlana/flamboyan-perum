<script setup lang="ts">
import { siteOrigin } from '#shared/utils/seo'
import { gateDay } from '#shared/content/flamboyan-assets'
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
      content: `${origin.value}${gateDay.src}`,
    },
    {
      property: 'og:image:alt',
      content: gateDay.alt,
    },
  ]),
})
</script>
<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
