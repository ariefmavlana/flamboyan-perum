<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: 'Hunian Bandung Timur — Flamboyan',
  description:
    'Kenali pilihan hunian Flamboyan di Bandung Timur. Telusuri ruang, pertimbangkan lokasi, dan rencanakan kunjungan bersama Admin.',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl.replace(/\/+$/, '')}/bandung-timur`,
    },
  ],
})
</script>
<template>
  <div>
    <section class="container section place-intro">
      <div class="editorial-page-heading">
        <p class="eyebrow">FLAMBOYAN · BANDUNG TIMUR</p>
        <h1>Ruang untuk hidup.<br />Di Bandung Timur.</h1>
        <p>
          Memilih rumah berarti mempertimbangkan keseharian: ruang untuk
          keluarga, perjalanan yang Anda jalani, dan rencana beberapa tahun ke
          depan.
        </p>
        <NuxtLink to="/properti" class="button"
          >Jelajahi pilihan hunian →</NuxtLink
        >
      </div>
      <figure>
        <img
          src="/images/editorial-garden-960.webp"
          width="960"
          height="640"
          alt="Ilustrasi hunian tropis dengan taman, bukan dokumentasi lokasi Flamboyan."
          fetchpriority="high"
        />
        <figcaption>
          Foto suasana, bukan lokasi perumahan ·
          <a
            href="https://unsplash.com/photos/Pfp0MP8QB7M"
            target="_blank"
            rel="noopener noreferrer"
            >Sergei Bezzubov / Unsplash ↗</a
          >
        </figcaption>
      </figure>
    </section>
    <section class="container section place-priorities">
      <p class="eyebrow">BERANGKAT DARI KEBUTUHAN ANDA</p>
      <h2>Kenali yang penting<br />untuk keseharian.</h2>
      <div class="value-strip">
        <div>
          <span class="step">01</span>
          <h3>Ruang yang sesuai</h3>
          <p>
            Bandingkan denah, luas, kamar, dan hubungan antarruang. Bayangkan
            bagaimana Anda menggunakannya setiap hari.
          </p>
          <NuxtLink class="text-link" to="/bandingkan"
            >Bandingkan rumah →</NuxtLink
          >
        </div>
        <div>
          <span class="step">02</span>
          <h3>Lokasi yang dipahami</h3>
          <p>
            Lihat titik properti dan informasi sekitar yang tersedia. Coba rute
            pada jam perjalanan Anda saat berkunjung.
          </p>
          <NuxtLink class="text-link" to="/panduan/memilih-lokasi"
            >Catatan menilai lokasi →</NuxtLink
          >
        </div>
        <div>
          <span class="step">03</span>
          <h3>Rencana yang terukur</h3>
          <p>
            Pelajari harga dan simulasi cicilan. Konfirmasikan ketersediaan,
            spesifikasi, dan langkah berikutnya bersama Admin.
          </p>
          <NuxtLink class="text-link" to="/panduan/merencanakan-pembiayaan"
            >Kenali pembiayaan →</NuxtLink
          >
        </div>
      </div>
    </section>
    <section class="container guide-help">
      <div>
        <p class="eyebrow">LIHAT LANGSUNG</p>
        <h2>Mari kenali rumahnya.</h2>
        <p>
          Admin membantu mengonfirmasi titik lokasi, unit yang dapat dilihat,
          dan waktu kunjungan. Jadwal disepakati melalui percakapan.
        </p>
      </div>
      <NuxtLink
        class="button"
        :to="{ path: '/konsultasi', query: { tujuan: 'kunjungan' } }"
        >Rencanakan kunjungan →</NuxtLink
      >
    </section>
  </div>
</template>
