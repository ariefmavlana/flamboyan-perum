<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: 'Panduan memilih hunian — Flamboyan Bandung Timur',
  description:
    'Catatan untuk mempersiapkan kunjungan rumah, menilai lokasi, dan menggunakan simulasi pembiayaan.',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl.replace(/\/+$/, '')}/panduan`,
    },
  ],
})
</script>
<template>
  <div>
    <section class="container section editorial-page-heading">
      <p class="eyebrow">PANDUAN FLAMBOYAN</p>
      <h1>Rumah yang tepat.<br />Keputusan yang matang.</h1>
      <p>
        Catatan praktis untuk mengenali ruang, mempertimbangkan lokasi, dan
        menyiapkan percakapan berikutnya.
      </p>
    </section>
    <BuyerGuidePreview :show-index-link="false" />
    <section class="container guide-help">
      <h2>Ada yang ingin dibicarakan?</h2>
      <NuxtLink class="button" to="/konsultasi">Mulai konsultasi →</NuxtLink>
    </section>
  </div>
</template>
