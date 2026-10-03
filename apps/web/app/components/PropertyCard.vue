<script setup lang="ts">
import type { Property } from '#shared/types'
import {
  availabilityLabels,
  formatIdr,
  whatsappLink,
} from '#shared/utils/catalog'
const props = defineProps<{ property: Property }>()
const config = useRuntimeConfig()
const cover = computed(() =>
  props.property.media?.find((item) => item.kind === 'PHOTO'),
)
const wa = computed(() =>
  whatsappLink(
    config.public.whatsappNumber,
    props.property.title,
    `${config.public.siteUrl}/properti/${props.property.slug}`,
  ),
)
</script>

<template>
  <article class="property-card">
    <img
      v-if="cover?.sources[0]"
      class="card-photo"
      :src="cover.sources[0].url"
      :alt="cover.alt"
      :width="cover.sources[0].width ?? undefined"
      :height="cover.sources[0].height ?? undefined"
      loading="lazy"
    />
    <div v-else class="property-visual" aria-hidden="true">
      <span>{{ property.house_type }}</span>
      <div class="house-line" />
      <small>Foto belum tersedia</small>
    </div>
    <div class="card-content">
      <div class="card-top">
        <span class="eyebrow">{{ property.location }}</span
        ><span class="badge">{{
          availabilityLabels[property.availability]
        }}</span>
      </div>
      <h3>
        <NuxtLink :to="`/properti/${property.slug}`">{{
          property.title
        }}</NuxtLink>
      </h3>
      <p class="price">{{ formatIdr(property.price_idr) }}</p>
      <p class="muted">{{ property.address }}</p>
      <dl class="spec-inline">
        <div>
          <dt>Tanah</dt>
          <dd>{{ property.land_area }} m²</dd>
        </div>
        <div>
          <dt>Bangunan</dt>
          <dd>{{ property.building_area }} m²</dd>
        </div>
        <div>
          <dt>Kamar</dt>
          <dd>
            {{ property.bedrooms }} tidur · {{ property.bathrooms }} mandi
          </dd>
        </div>
      </dl>
      <p class="muted">
        {{ property.condition === 'NEW' ? 'Rumah baru' : 'Rumah bekas' }} ·
        {{ property.certificate }} · {{ property.house_type }}
      </p>
      <CompareButton :id="property.id" />
      <a
        v-if="wa"
        :href="wa"
        class="text-link"
        target="_blank"
        rel="noopener noreferrer"
        >Hubungi Admin ↗</a
      >
      <NuxtLink v-else :to="`/properti/${property.slug}`" class="text-link"
        >Lihat detail →</NuxtLink
      >
    </div>
  </article>
</template>
