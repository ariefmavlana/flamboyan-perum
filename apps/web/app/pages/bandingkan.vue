<script setup lang="ts">
import type { Property } from '#shared/types'
import { formatIdr, availabilityLabels } from '#shared/utils/catalog'
const route = useRoute()
const comparison = useComparison()
const compareIds = computed(() =>
  typeof route.query.ids === 'string'
    ? [
        ...new Set(
          route.query.ids
            .split(',')
            .map(Number)
            .filter((id) => Number.isSafeInteger(id) && id > 0),
        ),
      ].slice(0, 3)
    : comparison.ids.value,
)
const { data, error, status, refresh } = await useAsyncData(
  'property-comparison',
  () =>
    compareIds.value.length
      ? $fetch<{ data: Property[]; missing: number[] }>('/api/v1/compare', {
          query: { 'ids[]': compareIds.value },
        })
      : Promise.resolve({ data: [], missing: [] }),
  { watch: [compareIds] },
)
function remove(id: number) {
  if (comparison.ids.value.includes(id)) comparison.toggle(id)
  return navigateTo({
    path: '/bandingkan',
    query: { ids: compareIds.value.filter((item) => item !== id).join(',') },
  })
}
useSeoMeta({
  title: 'Bandingkan properti — Flamboyan',
  robots: 'noindex, follow',
})
</script>
<template>
  <section class="container section">
    <p class="eyebrow">PERTIMBANGKAN PILIHAN ANDA</p>
    <h1 class="page-title">Bandingkan rumah.</h1>
    <p>Pilih 2–3 properti dari katalog. Pilihan tersimpan di perangkat ini.</p>
    <NuxtLink class="text-link" to="/properti">← Pilih dari katalog</NuxtLink>
    <p v-if="status === 'pending'" role="status">Memuat perbandingan…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>Perbandingan belum dapat dimuat.</p>
      <button class="button" @click="refresh()">Coba lagi</button>
    </div>
    <template v-else
      ><p v-if="(data?.data.length ?? 0) < 2" class="notice">
        Tambahkan pilihan hingga minimal 2 properti untuk dibandingkan.
      </p>
      <div v-if="data?.missing.length" class="notice">
        <p>Pilihan berikut tidak tersedia di katalog publik.</p>
        <button
          v-for="id in data.missing"
          :key="id"
          class="button secondary"
          @click="remove(id)"
        >
          Hapus pilihan #{{ id }}
        </button>
      </div>
      <div class="compare-grid">
        <article
          v-for="property in data?.data"
          :key="property.id"
          class="detail-summary"
        >
          <h2>
            <NuxtLink :to="`/properti/${property.slug}`">{{
              property.title
            }}</NuxtLink>
          </h2>
          <p class="price">{{ formatIdr(property.price_idr) }}</p>
          <dl class="spec-list">
            <div>
              <dt>Lokasi</dt>
              <dd>{{ property.location }}</dd>
            </div>
            <div>
              <dt>Alamat</dt>
              <dd>{{ property.address }}</dd>
            </div>
            <div>
              <dt>Tipe</dt>
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
              <dt>Tanah</dt>
              <dd>{{ property.land_area }} m²</dd>
            </div>
            <div>
              <dt>Bangunan</dt>
              <dd>{{ property.building_area }} m²</dd>
            </div>
            <div>
              <dt>Kamar tidur / mandi</dt>
              <dd>{{ property.bedrooms }} / {{ property.bathrooms }}</dd>
            </div>
            <div>
              <dt>Ketersediaan</dt>
              <dd>{{ availabilityLabels[property.availability] }}</dd>
            </div>
          </dl>
          <button class="button secondary" @click="remove(property.id)">
            Hapus {{ property.title }}
          </button>
        </article>
      </div></template
    >
  </section>
</template>
