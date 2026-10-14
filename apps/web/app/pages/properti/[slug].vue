<script setup lang="ts">
import type { Property } from '#shared/types'
import {
  availabilityLabels,
  formatIdr,
  whatsappLink,
  propertyUrl,
} from '#shared/utils/catalog'
import { absoluteUrl, canonicalUrl } from '#shared/utils/seo'
import {
  breadcrumbSchema,
  jsonLdText,
  realEstateListingSchema,
} from '#shared/utils/structured-data'
const route = useRoute()
const config = useRuntimeConfig()
const { whatsappNumber } = await useDevelopment()
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
const analytics = usePropertyAnalytics()
const tracking = useAnalytics()
onMounted(() => {
  analytics.record(property.value.id, 'property_view')
  tracking.track(
    'view_property',
    {
      property_id: property.value.id,
      property_type: property.value.house_type,
      page_type: 'property',
      content_group: 'katalog',
    },
    { once: true },
  )
})
function trackWhatsapp() {
  analytics.record(property.value.id, 'whatsapp_click')
  tracking.track('click_whatsapp', {
    property_id: property.value.id,
    property_type: property.value.house_type,
    page_type: 'property',
    lead_channel: 'whatsapp',
  })
}
function trackVisit() {
  tracking.track('request_visit', {
    property_id: property.value.id,
    property_type: property.value.house_type,
    page_type: 'property',
    lead_channel: 'whatsapp',
  })
}
const canonical = computed(() =>
  propertyUrl(config.public.siteUrl, property.value.slug),
)
const wa = computed(() =>
  whatsappLink(whatsappNumber.value, property.value.title, canonical.value),
)
const cover = computed(() =>
  property.value.media?.find((media) => media.kind === 'PHOTO'),
)
const shareImage = computed(() => {
  const source = cover.value?.sources.at(-1)?.url
  return source ? absoluteUrl(String(config.public.siteUrl), source) : undefined
})
const hasMedia = (kind: string) =>
  property.value.media?.some((media) => media.kind === kind)
useSeoMeta({
  title: () => property.value.title,
  description: () => property.value.description.slice(0, 155),
  ogTitle: () => property.value.title,
  ogDescription: () => property.value.description.slice(0, 155),
  ogUrl: () => canonical.value,
  ogType: 'website',
  ogImage: () => shareImage.value,
  ogImageAlt: () => cover.value?.alt,
  twitterCard: () => (shareImage.value ? 'summary_large_image' : 'summary'),
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    {
      type: 'application/ld+json',
      textContent: jsonLdText(
        realEstateListingSchema(property.value, {
          url: canonical.value,
          image: shareImage.value,
        }),
      ),
    },
    {
      type: 'application/ld+json',
      textContent: jsonLdText(
        breadcrumbSchema([
          {
            name: 'Beranda',
            url: canonicalUrl(String(config.public.siteUrl)),
          },
          {
            name: 'Jelajahi properti',
            url: canonicalUrl(String(config.public.siteUrl), '/properti'),
          },
          { name: property.value.title, url: canonical.value },
        ]),
      ),
    },
  ],
}))
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
      <span class="badge" :data-state="property.availability">{{
        availabilityLabels[property.availability]
      }}</span>
    </div>
    <nav class="detail-section-nav" aria-label="Jelajahi detail rumah">
      <a
        v-if="
          hasMedia('PHOTO') || hasMedia('FLOOR_PLAN') || hasMedia('MASTERPLAN')
        "
        href="#galeri"
        >Foto & denah</a
      >
      <a href="#tentang-rumah">Tentang rumah</a>
      <a v-if="hasMedia('VIDEO')" href="#video-properti">Video</a>
      <a v-if="hasMedia('TOUR')" href="#tur-properti">Virtual tour</a>
      <a v-if="hasMedia('BROCHURE')" href="#brosur-properti">Brosur</a>
      <a href="#lokasi-rumah">Lokasi</a><a href="#simulasi-kpr">Simulasi KPR</a>
    </nav>
    <div class="detail-grid">
      <div class="detail-gallery">
        <PropertyGallery :media="property.media ?? []" />
      </div>
      <aside class="detail-summary">
        <p class="eyebrow">HARGA PROPERTI</p>
        <p class="price detail-price">{{ formatIdr(property.price_idr) }}</p>
        <a
          v-if="wa"
          :href="wa"
          class="button full"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackWhatsapp"
          >Hubungi Admin melalui WhatsApp ↗</a
        >
        <p class="muted">
          Ketersediaan dan informasi transaksi dikonfirmasi bersama Admin.
        </p>
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
        <div class="detail-secondary-actions">
          <CompareButton :id="property.id" /><PropertyShare
            :title="property.title"
            :url="canonical"
          />
        </div>
        <NuxtLink
          v-if="wa && property.availability !== 'SOLD_OUT'"
          class="text-link visit-link"
          :to="{
            path: '/konsultasi',
            query: { properti: property.slug, tujuan: 'kunjungan' },
          }"
          @click="trackVisit"
          >Rencanakan kunjungan →</NuxtLink
        >
        <NuxtLink class="text-link" to="/panduan/kunjungan-rumah"
          >Yang perlu diperiksa saat kunjungan →</NuxtLink
        >
      </aside>
      <div class="detail-content">
        <h2 id="tentang-rumah">Tentang rumah ini</h2>
        <p class="description">{{ property.description }}</p>
        <PropertyCommercial
          v-if="property.commercial"
          :commercial="property.commercial"
        />
        <PropertyLocation :property="property" />
      </div>
    </div>
    <div id="simulasi-kpr">
      <MortgageCalculator
        :price="property.price_idr"
        :property-id="property.id"
      />
    </div>
  </section>
</template>
