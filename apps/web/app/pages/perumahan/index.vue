<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: 'Pilihan perumahan — Flamboyan',
  description:
    'Kenali Bukit Flamboyan Indah 2 di Bandung Timur dan rencana hunian Banjaran dalam satu naungan Flamboyan.',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl.replace(/\/+$/, '')}/perumahan`,
    },
  ],
})
</script>
<template>
  <div class="residences-page">
    <section class="container residence-intro">
      <p class="eyebrow">PERUMAHAN FLAMBOYAN</p>
      <div class="residence-intro-grid">
        <h1>Berbeda suasana.<br />Satu rasa pulang.</h1>
        <div>
          <p>
            Setiap tempat punya ceritanya. Temukan kawasan yang dekat dengan
            cara Anda menjalani hidup, dalam satu naungan Flamboyan.
          </p>
          <a href="#pilihan-kawasan" class="text-link"
            >Temukan kawasan Anda <span aria-hidden="true">↓</span></a
          >
        </div>
      </div>
      <div class="residence-index">
        <span>BANDUNG TIMUR</span><span aria-hidden="true">/</span
        ><span>BANJARAN · MENDATANG</span>
      </div>
    </section>
    <section
      id="pilihan-kawasan"
      class="container residence-selection"
      aria-label="Pilihan kawasan Flamboyan"
    >
      <ResidenceCollection />
    </section>
    <section class="container guide-help residence-help">
      <div>
        <p class="eyebrow">PILIHAN YANG PERSONAL</p>
        <h2>Mulai dari keseharian Anda.</h2>
        <p>
          Ceritakan kebutuhan ruang, lokasi, dan rencana Anda. Tim kami membantu
          memahami pilihan serta informasi yang sudah tersedia.
        </p>
      </div>
      <NuxtLink class="button" to="/konsultasi"
        >Diskusikan pilihan Anda <AppIcon name="arrow"
      /></NuxtLink>
    </section>
  </div>
</template>
