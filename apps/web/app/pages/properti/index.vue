<script setup lang="ts">
import type { Paginated, Property } from '#shared/types'
const route = useRoute()
const q = ref(String(route.query.q ?? ''))
const sort = ref(String(route.query.sort ?? 'newest'))
const minPrice = ref(String(route.query.min_price ?? ''))
const maxPrice = ref(String(route.query.max_price ?? ''))
const requestQuery = computed(() => ({ ...route.query, per_page: 12 }))
const { data, error, status, refresh } = await useFetch<Paginated<Property>>(
  '/api/v1/properties',
  { query: requestQuery },
)
function filter() {
  return navigateTo({
    path: '/properti',
    query: {
      ...(q.value ? { q: q.value } : {}),
      sort: sort.value,
      ...(minPrice.value ? { min_price: minPrice.value } : {}),
      ...(maxPrice.value ? { max_price: maxPrice.value } : {}),
    },
  })
}
const pageLink = (page: number) => ({
  path: '/properti',
  query: { ...route.query, page },
})
useSeoMeta({
  title: 'Jelajahi properti — Flamboyan Perum',
  description:
    'Cari rumah berdasarkan lokasi, harga, dan spesifikasi yang sesuai kebutuhan Anda.',
})
useHead({
  link: [
    { rel: 'canonical', href: `${useRuntimeConfig().public.siteUrl}/properti` },
  ],
})
</script>

<template>
  <section class="container section">
    <p class="eyebrow">KATALOG PROPERTI</p>
    <h1 class="page-title">
      Rumah yang selaras<br />dengan <em>rencana Anda.</em>
    </h1>
    <form class="filter-bar" @submit.prevent="filter">
      <label
        >Cari lokasi atau rumah<input
          v-model="q"
          maxlength="100"
          placeholder="Nama, lokasi, atau alamat" /></label
      ><label
        >Harga minimum<input
          v-model="minPrice"
          type="number"
          min="0"
          max="1000000000000"
          placeholder="Rp" /></label
      ><label
        >Harga maksimum<input
          v-model="maxPrice"
          type="number"
          min="0"
          max="1000000000000"
          placeholder="Rp" /></label
      ><label
        >Urutkan<select v-model="sort">
          <option value="newest">Terbaru</option>
          <option value="price_asc">Harga terendah</option>
          <option value="price_desc">Harga tertinggi</option>
          <option value="land_desc">Tanah terluas</option>
          <option value="building_desc">Bangunan terluas</option>
        </select></label
      ><button class="button" type="submit">Terapkan</button>
    </form>
    <p v-if="status === 'pending'" role="status">Memuat katalog…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>Katalog belum dapat dimuat. Periksa filter atau coba lagi.</p>
      <button class="button secondary" @click="refresh()">Coba lagi</button>
    </div>
    <template v-else
      ><p class="muted">{{ data?.meta.total ?? 0 }} properti ditemukan</p>
      <div v-if="data?.data.length" class="property-grid">
        <PropertyCard
          v-for="property in data.data"
          :key="property.id"
          :property="property"
        />
      </div>
      <p v-else class="notice">
        Belum ada properti yang sesuai. Coba kata kunci atau rentang harga lain.
      </p>
      <nav
        v-if="data && data.meta.last_page > 1"
        class="pagination"
        aria-label="Halaman katalog"
      >
        <NuxtLink
          v-if="data.meta.current_page > 1"
          :to="pageLink(data.meta.current_page - 1)"
          >← Sebelumnya</NuxtLink
        ><span
          >Halaman {{ data.meta.current_page }} /
          {{ data.meta.last_page }}</span
        ><NuxtLink
          v-if="data.meta.current_page < data.meta.last_page"
          :to="pageLink(data.meta.current_page + 1)"
          >Berikutnya →</NuxtLink
        >
      </nav>
    </template>
  </section>
</template>
