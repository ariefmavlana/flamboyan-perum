<script setup lang="ts">
import { canonicalUrl } from '#shared/utils/seo'
import { formatDate } from '#shared/utils/format'
const config = useRuntimeConfig()
const { development } = await useDevelopment()
const toList = (value?: string | null) => [
  ...new Set(
    (value ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  ),
]
const facilities = computed(() => toList(development.value?.facilities))
const nearby = computed(() => toList(development.value?.nearby))
useSeoMeta({
  title: 'Hunian Bandung Timur',
  description:
    'Kenali pilihan hunian Flamboyan di Bandung Timur. Telusuri ruang, pertimbangkan lokasi, dan rencanakan kunjungan bersama Admin.',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl(String(config.public.siteUrl), '/bandung-timur'),
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
          src="/images/bandung-timur-gerbang-1920.webp"
          srcset="
            /images/bandung-timur-gerbang-960.webp   960w,
            /images/bandung-timur-gerbang-1920.webp 1920w
          "
          width="1920"
          height="1434"
          alt="Gerbang kawasan Bukit Flamboyan Indah 2, Cibiru Wetan · dokumentasi pengguna."
          fetchpriority="high"
        />
        <figcaption>
          Gerbang kawasan Bukit Flamboyan Indah 2 · dokumentasi pengguna
        </figcaption>
      </figure>
    </section>
    <section
      v-if="development"
      class="container section place-priorities place-facilities"
      aria-labelledby="facilities-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ development.developer }}</p>
          <h2 id="facilities-title">{{ development.name }}</h2>
          <p class="muted">{{ development.address }}</p>
          <p class="muted">
            {{ development.house_types }} tipe ·
            {{ development.planned_units }} rencana unit · ketersediaan aktual
            dikonfirmasi ke Admin.
          </p>
        </div>
      </div>
      <div class="facility-grid">
        <article class="facility-card">
          <h3>Fasilitas kawasan</h3>
          <p class="muted">
            Keterangan pengembang untuk fasilitas di dalam perumahan.
          </p>
          <ul v-if="facilities.length" class="facility-list">
            <li v-for="item in facilities" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="muted">Rincian fasilitas kawasan belum tersedia.</p>
        </article>
        <article class="facility-card facility-card-wide">
          <h3>Fasilitas sekitar</h3>
          <p class="muted">
            Referensi lingkungan sekitar; tidak menyatakan jarak atau waktu
            tempuh.
          </p>
          <ul v-if="nearby.length" class="facility-list facility-list-columns">
            <li v-for="item in nearby" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="muted">
            Referensi fasilitas sekitar belum tersedia.
          </p>
        </article>
      </div>
      <article class="facility-note">
        <h3>Sebelum berkunjung</h3>
        <p>{{ development.notes }}</p>
        <p class="muted">
          Sumber: {{ development.source_name }} ·
          {{ formatDate(development.source_date) }}.
        </p>
      </article>
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
