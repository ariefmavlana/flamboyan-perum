<script setup lang="ts">
import type { Paginated, Property } from '#shared/types'
import {
  developmentPhotos,
  gateDay,
  gateDusk,
  siteplan,
  logo,
} from '#shared/content/flamboyan-assets'
import { absoluteUrl, canonicalUrl } from '#shared/utils/seo'
import { formatDate } from '#shared/utils/format'
import { breadcrumbSchema, jsonLdText } from '#shared/utils/structured-data'
const config = useRuntimeConfig()
const { development } = await useDevelopment()
const { data, error, refresh } = await useFetch<Paginated<Property>>(
  '/api/v1/properties',
  {
    query: { q: 'Bukit Flamboyan Indah 2', per_page: 48, sort: 'price_asc' },
  },
)
const properties = computed(() =>
  (data.value?.data ?? []).filter(
    (property) =>
      property.slug ===
      `bukit-flamboyan-indah-2-${property.house_type.replace('/', '-')}`,
  ),
)
const canonical = canonicalUrl(
  String(config.public.siteUrl),
  '/perumahan/bukit-flamboyan-indah-2',
)
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
  title: 'Bukit Flamboyan Indah 2 — kawasan & pilihan rumah',
  description:
    'Kenali Bukit Flamboyan Indah 2 melalui dokumentasi aktual, ilustrasi gerbang, siteplan kawasan, serta pilihan tipe dan harga dari katalog.',
  ogImage: absoluteUrl(String(config.public.siteUrl), gateDay.src),
  ogImageAlt: gateDay.alt,
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      textContent: jsonLdText(
        breadcrumbSchema([
          { name: 'Beranda', url: canonicalUrl(String(config.public.siteUrl)) },
          {
            name: 'Pilihan perumahan',
            url: canonicalUrl(String(config.public.siteUrl), '/perumahan'),
          },
          { name: 'Bukit Flamboyan Indah 2', url: canonical },
        ]),
      ),
    },
  ],
})
</script>
<template>
  <div class="flamboyan-project">
    <section class="container residence-intro">
      <NuxtLink class="text-link" to="/perumahan">← Seluruh perumahan</NuxtLink>
      <div class="residence-intro-grid">
        <div class="project-identity">
          <img
            :src="logo.src"
            :width="logo.width"
            :height="logo.height"
            alt="Logo Bukit Flamboyan Indah"
          />
          <p class="eyebrow">BANDUNG TIMUR / KAWASAN FLAMBOYAN</p>
          <h1>Bukit Flamboyan<br />Indah 2.</h1>
        </div>
        <div>
          <p>
            Kenali rumahnya. Pahami kawasannya. Mulai dari gambaran ruang,
            dokumentasi lapangan, dan rencana yang dapat Anda pelajari sebelum
            berkunjung.
          </p>
          <p v-if="development?.address" class="muted">
            {{ development.address }}
          </p>
          <a class="text-link" href="#pilihan-rumah"
            >Jelajahi pilihan tipe <span aria-hidden="true">↓</span></a
          >
        </div>
      </div>
      <nav class="residence-index project-nav" aria-label="Jelajahi kawasan">
        <a href="#pilihan-rumah">PILIHAN RUMAH</a>
        <a href="#dokumentasi">DOKUMENTASI AKTUAL</a>
        <a href="#rancangan-gerbang">ILUSTRASI GERBANG</a>
        <a href="#siteplan">SITEPLAN</a>
      </nav>
    </section>
    <figure class="project-hero container">
      <img
        :src="gateDay.src"
        :srcset="
          gateDay.sources
            .map((source) => `${source.url} ${source.width}w`)
            .join(', ')
        "
        sizes="(max-width: 1536px) 100vw, 1408px"
        :width="gateDay.width"
        :height="gateDay.height"
        :alt="gateDay.alt"
        fetchpriority="high"
      />
      <figcaption>{{ gateDay.caption }}</figcaption>
    </figure>
    <section
      id="pilihan-rumah"
      class="container section"
      aria-labelledby="project-homes-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">RUANG UNTUK KESEHARIAN ANDA</p>
          <h2 id="project-homes-title">Pilihan rumah.<br />Dengan jelas.</h2>
          <p class="muted">
            Lihat spesifikasi, ilustrasi ruang, denah, dan harga pada setiap
            tipe. Ketersediaan dikonfirmasi bersama Admin.
          </p>
        </div>
        <NuxtLink
          to="/properti?q=Bukit%20Flamboyan%20Indah%202"
          class="text-link"
          >Telusuri katalog →</NuxtLink
        >
      </div>
      <div v-if="error" role="alert" class="notice">
        <p>Pilihan rumah belum dapat dimuat.</p>
        <button class="button secondary" @click="refresh()">Coba lagi</button>
      </div>
      <div v-else-if="properties.length" class="property-grid">
        <PropertyCard
          v-for="property in properties"
          :key="property.id"
          :property="property"
        />
      </div>
      <p v-else class="notice">
        Pilihan rumah akan tampil setelah katalog dipublikasikan.
      </p>
    </section>
    <section
      id="dokumentasi"
      class="container section project-documentation"
      aria-labelledby="project-documentation-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">DOKUMENTASI LAPANGAN</p>
          <h2 id="project-documentation-title">
            Lihat ruangnya.<br />Kenali kondisinya.
          </h2>
          <p class="muted">
            Foto aktual kawasan dan rumah contoh dari dokumentasi pemilik.
            Pencahayaan dan warna diselaraskan untuk keterbacaan; kondisi
            bangunan tetap dipertahankan. Tipe rumah pada dokumentasi ini
            dikonfirmasi saat kunjungan.
          </p>
        </div>
        <NuxtLink
          class="text-link"
          to="/konsultasi?kawasan=bukit-flamboyan-indah-2&tujuan=kunjungan"
          >Rencanakan kunjungan →</NuxtLink
        >
      </div>
      <DevelopmentGallery
        :images="developmentPhotos"
        label="Dokumentasi aktual kawasan"
      />
    </section>
    <section
      id="rancangan-gerbang"
      class="container section"
      aria-labelledby="project-gates-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">GAMBARAN RANCANGAN</p>
          <h2 id="project-gates-title">
            Gerbang kawasan.<br />Dalam dua suasana.
          </h2>
          <p class="muted">
            Ilustrasi desain gerbang pada siang dan senja. Kondisi serta tahap
            pekerjaan aktual diperiksa bersama Admin saat kunjungan.
          </p>
        </div>
      </div>
      <DevelopmentGallery
        :images="[gateDay, gateDusk]"
        label="Ilustrasi gerbang kawasan"
      />
    </section>
    <section
      id="siteplan"
      class="container section"
      aria-labelledby="project-siteplan-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">RENCANA KAWASAN</p>
          <h2 id="project-siteplan-title">Pelajari susunannya.</h2>
          <p class="muted">
            Siteplan kawasan dari pengembang, terpisah dari denah bangunan
            setiap tipe. Nomor dan warna kavling pada gambar tidak menyatakan
            stok penjualan terkini. Pilih gambar untuk melihat legenda dan
            detail lebih besar.
          </p>
        </div>
      </div>
      <DevelopmentGallery :images="[siteplan]" label="Siteplan kawasan" />
    </section>
    <section
      v-if="development"
      class="container section"
      aria-labelledby="project-details-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ development.developer }}</p>
          <h2 id="project-details-title">Konteks untuk<br />kunjungan Anda.</h2>
          <p class="muted">{{ development.address }}</p>
          <p class="muted">
            {{ development.house_types }} tipe ·
            {{ development.planned_units }} rencana unit. Jumlah rencana tidak
            menyatakan stok tersedia.
          </p>
        </div>
      </div>
      <div class="facility-grid">
        <article class="facility-card">
          <h3>Fasilitas kawasan</h3>
          <ul v-if="facilities.length" class="facility-list">
            <li v-for="item in facilities" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="muted">
            Informasi fasilitas dikonfirmasi bersama Admin.
          </p>
        </article>
        <article class="facility-card">
          <h3>Sekitar kawasan</h3>
          <ul v-if="nearby.length" class="facility-list">
            <li v-for="item in nearby" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="muted">
            Informasi sekitar kawasan dikonfirmasi saat kunjungan.
          </p>
        </article>
      </div>
      <p v-if="development.source_name" class="muted project-source">
        Sumber: {{ development.source_name
        }}<span v-if="development.source_date">
          · {{ formatDate(development.source_date) }}</span
        >. Kesiapan fasilitas dan akses diperiksa saat kunjungan.
      </p>
    </section>
    <section class="container guide-help residence-help">
      <div>
        <p class="eyebrow">KENALI SEBELUM MEMUTUSKAN</p>
        <h2>Mulai dari kebutuhan Anda.</h2>
        <p>
          Diskusikan pilihan tipe, pembiayaan, dan rencana melihat rumah secara
          langsung bersama Admin.
        </p>
      </div>
      <NuxtLink class="button" to="/konsultasi?kawasan=bukit-flamboyan-indah-2"
        >Diskusikan Bukit Flamboyan <AppIcon name="arrow"
      /></NuxtLink>
    </section>
  </div>
</template>
<style scoped>
.project-identity {
  max-width: none;
}
.project-identity > img {
  display: block;
  width: min(280px, 100%);
  height: auto;
  margin-bottom: 24px;
}
.project-nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.project-hero {
  margin-block: 0;
}
.project-hero img {
  display: block;
  width: 100%;
  height: auto;
}
.project-hero figcaption {
  font-size: 12px;
  color: var(--muted);
  margin-top: 12px;
}
.flamboyan-project .section {
  scroll-margin-top: 32px;
}
.flamboyan-project .section-heading > div > p:last-child {
  max-width: 720px;
  line-height: 1.8;
}
.project-documentation {
  border-block: 1px solid var(--line);
}
.project-source {
  margin-top: 24px;
  font-size: 12px;
}
</style>
