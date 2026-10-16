<script setup lang="ts">
import type { Property } from '#shared/types'
import {
  availabilityLabels,
  formatIdr,
  whatsappLink,
  propertyUrl,
} from '#shared/utils/catalog'
import { formatArea, formatDate } from '#shared/utils/format'
const props = defineProps<{ property: Property }>()
const config = useRuntimeConfig()
const { whatsappNumber } = await useDevelopment()
const analytics = usePropertyAnalytics()
const tracking = useAnalytics()
function trackSelect() {
  tracking.track('select_property', {
    property_id: props.property.id,
    property_type: props.property.house_type,
    page_type: 'katalog',
    content_group: 'katalog',
  })
}
function trackWhatsapp() {
  analytics.record(props.property.id, 'whatsapp_click')
  tracking.track('click_whatsapp', {
    property_id: props.property.id,
    property_type: props.property.house_type,
    page_type: 'katalog',
    lead_channel: 'whatsapp',
  })
}
const photos = computed(() =>
  (props.property.preview_media ?? props.property.media ?? []).filter(
    (item) => item.kind === 'PHOTO' && item.sources.length,
  ),
)
const photoSizes = '(max-width: 540px) 100vw, (max-width: 1100px) 50vw, 33vw'
const {
  stage,
  index,
  selected: cover,
  paused,
  motionAllowed,
  loading,
  message,
  move,
  toggle,
} = usePhotoCarousel(photos, photoSizes)
const offer = computed(() => {
  const terms = props.property.commercial
  return terms?.offer_until &&
    Number(terms.normal_price_idr) > Number(props.property.price_idr)
    ? terms
    : null
})
const wa = computed(() =>
  whatsappLink(
    whatsappNumber.value,
    props.property.title,
    propertyUrl(config.public.siteUrl, props.property.slug),
  ),
)
</script>

<template>
  <article v-reveal class="property-card">
    <div ref="stage" class="card-photo-stage">
      <NuxtLink
        class="card-media"
        :to="`/properti/${property.slug}`"
        :aria-label="`Lihat ${property.title}`"
      >
        <Transition
          name="photo-dissolve"
          @before-leave="(el) => el.setAttribute('aria-hidden', 'true')"
          ><img
            v-if="cover?.sources[0]"
            :key="cover.id"
            class="card-photo"
            :class="{
              'is-illustration': /ilustrasi|inspirasi/i.test(cover.alt),
            }"
            :src="cover.sources[0].url"
            :srcset="
              cover.sources
                .filter((source) => source.width)
                .map((source) => `${source.url} ${source.width}w`)
                .join(',') || undefined
            "
            :sizes="photoSizes"
            :alt="cover.alt"
            :width="cover.sources[0].width ?? undefined"
            :height="cover.sources[0].height ?? undefined"
            loading="lazy"
          />
          <div v-else class="property-visual">
            <AppIcon name="home" /><small>Foto belum tersedia</small>
          </div></Transition
        >
        <MediaDisclosure :alt="cover?.alt" />
        <span class="badge" :data-state="property.availability">{{
          availabilityLabels[property.availability]
        }}</span>
        <span class="card-house-type">Tipe {{ property.house_type }}</span>
      </NuxtLink>
      <div
        v-if="photos.length > 1"
        class="card-photo-controls"
        :aria-label="`Foto tipe ${property.house_type}`"
      >
        <span>{{ index + 1 }} / {{ photos.length }} foto</span>
        <button
          type="button"
          :aria-label="`Foto sebelumnya tipe ${property.house_type}`"
          :disabled="loading"
          @click="move(-1)"
        >
          ←
        </button>
        <button
          v-if="motionAllowed"
          type="button"
          :aria-label="`${paused ? 'Putar' : 'Jeda'} foto tipe ${property.house_type}`"
          :aria-pressed="paused"
          @click="toggle"
        >
          {{ paused ? '▷' : 'Ⅱ' }}
        </button>
        <button
          type="button"
          :aria-label="`Foto berikutnya tipe ${property.house_type}`"
          :disabled="loading"
          @click="move(1)"
        >
          →
        </button>
      </div>
      <p v-if="message" class="photo-load-message" role="status">
        {{ message }}
      </p>
    </div>
    <div class="card-content">
      <p class="card-location"><AppIcon name="pin" />{{ property.location }}</p>
      <h3>
        <NuxtLink :to="`/properti/${property.slug}`" @click="trackSelect">{{
          property.title
        }}</NuxtLink>
      </h3>
      <div class="card-pricing">
        <p class="card-price-label">Harga rumah</p>
        <p class="price">{{ formatIdr(property.price_idr) }}</p>
        <p v-if="offer" class="card-offer">
          <del>{{ formatIdr(offer.normal_price_idr) }}</del
          ><span>Program s.d. {{ formatDate(offer.offer_until!) }}</span>
        </p>
      </div>
      <dl class="spec-inline">
        <div>
          <dt>Luas Tanah</dt>
          <dd>{{ formatArea(property.land_area) }}</dd>
        </div>
        <div>
          <dt>Luas Bangunan</dt>
          <dd>{{ formatArea(property.building_area) }}</dd>
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
      <p class="muted card-property-note">
        {{ property.condition === 'NEW' ? 'Rumah baru' : 'Rumah bekas' }} ·
        {{
          property.commercial?.lot_dimensions
            ? `Kavling ${property.commercial.lot_dimensions}`
            : property.certificate
        }}
      </p>
      <NuxtLink
        :to="`/properti/${property.slug}`"
        class="card-detail-link"
        @click="trackSelect"
        >Lihat rumah & denah <AppIcon name="arrow"
      /></NuxtLink>
      <div class="card-actions">
        <CompareButton :id="property.id" /><a
          v-if="wa"
          :href="wa"
          class="text-link whatsapp-card-link"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackWhatsapp"
          ><AppIcon name="chat" />WhatsApp Admin ↗</a
        ><NuxtLink v-else :to="`/properti/${property.slug}`" class="text-link"
          >Lihat detail →</NuxtLink
        >
      </div>
    </div>
  </article>
</template>
<style scoped>
.card-photo.is-illustration {
  object-fit: contain;
  background: var(--cream);
}

.card-house-type {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 8px 12px;
  color: #fff;
  background: #252b26ed;
  font-size: 12px;
  letter-spacing: 0.04em;
}
.card-pricing {
  padding-bottom: 18px;
}
.card-price-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0 0 6px;
  color: var(--muted);
}
.property-card .card-content .price {
  font-size: clamp(23px, 2.3vw, 30px);
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.card-offer {
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: var(--muted);
}
.card-offer span {
  color: #7e4b31;
}
.property-card .spec-inline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding-block: 16px;
  border-block: 1px solid var(--line);
  margin-block: 0 14px;
}
.spec-inline dt {
  font-size: 10px;
  line-height: 1.5;
}
.spec-inline dd {
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
}
.card-property-note {
  margin-block: 0 12px;
}
.card-detail-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
  padding-block: 12px;
  margin-bottom: 12px;
  border-block: 1px solid var(--line);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
.card-detail-link:hover {
  color: #8f4a33;
}
.property-card .card-actions {
  border: 0;
}
.card-actions :deep(label),
.card-actions a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
@media (max-width: 540px) {
  .property-card .spec-inline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .card-house-type {
    right: 12px;
    bottom: 12px;
  }
}
</style>
