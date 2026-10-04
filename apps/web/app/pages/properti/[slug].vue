<script setup lang="ts">
import type { Property } from '#shared/types'
import {
  availabilityLabels,
  formatIdr,
  whatsappLink,
} from '#shared/utils/catalog'
const route = useRoute()
const config = useRuntimeConfig()
const { data, error } = await useFetch<{ data: Property }>(
  `/api/v1/properties/${encodeURIComponent(String(route.params.slug))}`,
)
if (error.value)
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    statusMessage:
      error.value.statusCode === 404
        ? 'Properti tidak ditemukan'
        : 'Properti belum dapat dimuat. Silakan coba lagi.',
  })
if (!data.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Properti belum dapat dimuat',
  })
const property = computed(() => data.value!.data)
const canonical = computed(
  () => `${config.public.siteUrl}/properti/${property.value.slug}`,
)
const wa = computed(() =>
  whatsappLink(
    config.public.whatsappNumber,
    property.value.title,
    canonical.value,
  ),
)
useSeoMeta({
  title: () => `${property.value.title} — Flamboyan Perum`,
  description: () => property.value.description.slice(0, 155),
  ogTitle: () => property.value.title,
  ogDescription: () => property.value.description.slice(0, 155),
  ogUrl: () => canonical.value,
  ogType: 'website',
})
useHead(() => ({ link: [{ rel: 'canonical', href: canonical.value }] }))
</script>

<template>
  <section class="container section">
    <NuxtLink class="text-link" to="/properti">← Kembali ke katalog</NuxtLink>
    <div class="detail-heading">
      <div>
        <p class="eyebrow">{{ property.location }}</p>
        <h1 class="page-title">{{ property.title }}</h1>
        <p class="muted">{{ property.address }}</p>
      </div>
      <span class="badge">{{ availabilityLabels[property.availability] }}</span>
    </div>
    <div class="detail-grid">
      <div>
        <PropertyGallery :media="property.media ?? []" />
        <h2>Tentang rumah ini</h2>
        <p class="description">{{ property.description }}</p>
      </div>
      <aside class="detail-summary">
        <p class="eyebrow">HARGA PROPERTI</p>
        <p class="price detail-price">{{ formatIdr(property.price_idr) }}</p>
        <dl class="spec-list">
          <div>
            <dt>Tipe rumah</dt>
            <dd>{{ property.house_type }}</dd>
          </div>
          <div>
            <dt>Kondisi</dt>
            <dd>{{ property.condition === 'NEW' ? 'Baru' : 'Bekas' }}</dd>
          </div>
          <div>
            <dt>Sertifikat</dt>
            <dd>{{ property.certificate }}</dd>
          </div>
          <div>
            <dt>Luas tanah</dt>
            <dd>{{ property.land_area }} m²</dd>
          </div>
          <div>
            <dt>Luas bangunan</dt>
            <dd>{{ property.building_area }} m²</dd>
          </div>
          <div>
            <dt>Kamar tidur</dt>
            <dd>{{ property.bedrooms }}</dd>
          </div>
          <div>
            <dt>Kamar mandi</dt>
            <dd>{{ property.bathrooms }}</dd>
          </div>
        </dl>
        <a
          v-if="wa"
          :href="wa"
          class="button full"
          target="_blank"
          rel="noopener noreferrer"
          >Hubungi Admin melalui WhatsApp ↗</a
        >
        <p class="muted">
          Ketersediaan dan informasi transaksi dikonfirmasi bersama Admin.
        </p>
      </aside>
    </div>
  </section>
</template>
