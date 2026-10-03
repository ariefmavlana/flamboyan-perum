<script setup lang="ts">
import type { Paginated, Property } from '#shared/types'
const route = useRoute()
const interactive = ref(false)
onMounted(() => {
  interactive.value = true
})
const textFields = [
  { key: 'q', label: 'Cari lokasi atau rumah', max: 100 },
  { key: 'location', label: 'Lokasi tepat', max: 160 },
  { key: 'certificate', label: 'Sertifikat', max: 80 },
] as const
const numberFields = [
  { key: 'min_price', label: 'Harga minimum', max: 1e12, min: 0, step: 1 },
  { key: 'max_price', label: 'Harga maksimum', max: 1e12, min: 0, step: 1 },
  {
    key: 'min_land_area',
    label: 'Tanah minimum (m²)',
    max: 1e6,
    min: 0,
    step: 0.01,
  },
  {
    key: 'max_land_area',
    label: 'Tanah maksimum (m²)',
    max: 1e6,
    min: 0,
    step: 0.01,
  },
  {
    key: 'min_building_area',
    label: 'Bangunan minimum (m²)',
    max: 1e6,
    min: 0,
    step: 0.01,
  },
  {
    key: 'max_building_area',
    label: 'Bangunan maksimum (m²)',
    max: 1e6,
    min: 0,
    step: 0.01,
  },
  { key: 'bedrooms', label: 'Minimum kamar tidur', max: 50, min: 0, step: 1 },
  { key: 'bathrooms', label: 'Minimum kamar mandi', max: 50, min: 1, step: 1 },
] as const
const keys = [
  ...textFields.map((field) => field.key),
  ...numberFields.map((field) => field.key),
  'sort',
  'condition',
  'availability',
]
const form = reactive<Record<string, string>>({})
watch(
  () => route.query,
  (query) => {
    for (const key of keys)
      form[key] =
        typeof query[key] === 'string'
          ? query[key]
          : key === 'sort'
            ? 'newest'
            : ''
  },
  { immediate: true },
)
const requestQuery = computed(() => ({
  ...Object.fromEntries(
    [...keys, 'page']
      .filter(
        (key) =>
          typeof route.query[key] === 'string' && route.query[key] !== '',
      )
      .map((key) => [key, route.query[key]]),
  ),
  per_page: 12,
}))
const { data, error, status, refresh } = await useFetch<Paginated<Property>>(
  '/api/v1/properties',
  { query: requestQuery },
)
const message = ref('')
function filter() {
  message.value = ''
  for (const key of ['price', 'land_area', 'building_area'])
    if (
      form[`min_${key}`] &&
      form[`max_${key}`] &&
      Number(form[`min_${key}`]) > Number(form[`max_${key}`])
    ) {
      message.value =
        'Batas maksimum harus lebih besar dari atau sama dengan minimum.'
      return
    }
  return navigateTo({
    path: '/properti',
    query: Object.fromEntries(
      keys.filter((key) => form[key] !== '').map((key) => [key, form[key]]),
    ),
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
  robots: () =>
    Object.keys(route.query).length ? 'noindex, follow' : 'index, follow',
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
    <form @submit.prevent="filter">
      <fieldset
        class="hydration-controls"
        :disabled="!interactive"
        aria-label="Filter katalog"
      >
        <div class="filter-bar">
          <label
            >Cari lokasi atau rumah<input
              v-model="form.q"
              maxlength="100"
              placeholder="Nama, lokasi, atau alamat" /></label
          ><label v-for="field in numberFields.slice(0, 2)" :key="field.key"
            >{{ field.label
            }}<input
              v-model="form[field.key]"
              type="number"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              placeholder="Rp" /></label
          ><label
            >Urutkan<select v-model="form.sort">
              <option value="newest">Terbaru</option>
              <option value="price_asc">Harga terendah</option>
              <option value="price_desc">Harga tertinggi</option>
              <option value="land_asc">Tanah terkecil</option>
              <option value="land_desc">Tanah terluas</option>
              <option value="building_asc">Bangunan terkecil</option>
              <option value="building_desc">Bangunan terluas</option>
            </select></label
          ><button class="button" type="submit">Terapkan</button>
        </div>
        <details class="advanced-filter">
          <summary>Filter spesifikasi dan ketersediaan</summary>
          <div class="form-grid">
            <label v-for="field in textFields.slice(1)" :key="field.key"
              >{{ field.label
              }}<input
                v-model="form[field.key]"
                :maxlength="field.max" /></label
            ><label v-for="field in numberFields.slice(2)" :key="field.key"
              >{{ field.label
              }}<input
                v-model="form[field.key]"
                type="number"
                :min="field.min"
                :max="field.max"
                :step="field.step" /></label
            ><label
              >Kondisi<select v-model="form.condition" aria-label="Kondisi">
                <option value="">Semua</option>
                <option value="NEW">Baru</option>
                <option value="RESALE">Bekas</option>
              </select></label
            ><label
              >Ketersediaan<select
                v-model="form.availability"
                aria-label="Ketersediaan"
              >
                <option value="">Semua</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="BOOKED">Dipesan</option>
                <option value="SOLD_OUT">Terjual</option>
              </select></label
            >
          </div>
          <button class="button" type="submit">Terapkan spesifikasi</button>
        </details>
        <NuxtLink class="text-link" to="/properti">Reset filter</NuxtLink>
        <p v-if="message" class="error-text" role="alert">{{ message }}</p>
      </fieldset>
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
        Belum ada properti yang sesuai. Coba kata kunci atau spesifikasi lain.
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
      </nav></template
    >
  </section>
</template>
