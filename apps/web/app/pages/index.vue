<script setup lang="ts">
import type { Paginated, Property } from '#shared/types'
import { whatsappLink } from '#shared/utils/catalog'
const config = useRuntimeConfig()
const search = ref('')
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
const { data, error, refresh } = await useFetch<Paginated<Property>>(
  '/api/v1/properties',
  { query: { featured: 1, per_page: 3 } },
)
const wa = computed(() =>
  whatsappLink(
    config.public.whatsappNumber,
    'properti Flamboyan',
    config.public.siteUrl,
  ),
)
useSeoMeta({
  title: 'Flamboyan Perum — Ruang untuk cerita berikutnya',
  description:
    'Jelajahi katalog rumah, pahami spesifikasinya, dan temukan properti yang sesuai dengan kebutuhan Anda.',
})
useHead({ link: [{ rel: 'canonical', href: config.public.siteUrl }] })
</script>

<template>
  <div>
    <section class="hero container">
      <div class="hero-copy">
        <p class="eyebrow">RUMAH · KEHIDUPAN · MASA DEPAN</p>
        <h1>Ruang untuk<br />cerita <em>berikutnya.</em></h1>
        <p class="hero-description">
          Setiap rumah membuka kemungkinan baru. Temukan properti yang selaras
          dengan kebutuhan dan rencana Anda.
        </p>
        <form
          class="hero-search"
          @submit.prevent="
            navigateTo({
              path: '/properti',
              query: search ? { q: search } : {},
            })
          "
        >
          <label class="sr-only" for="home-search"
            >Cari lokasi atau nama properti</label
          ><input
            id="home-search"
            v-model="search"
            :disabled="!hydrated"
            placeholder="Lokasi atau nama properti"
            maxlength="100"
          /><button type="submit" :disabled="!hydrated">Jelajahi →</button>
        </form>
        <a
          v-if="wa"
          :href="wa"
          class="text-link"
          target="_blank"
          rel="noopener noreferrer"
          >Bicarakan kebutuhan Anda dengan Admin ↗</a
        >
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="sun" />
        <div class="arch">
          <div class="art-house">
            <div class="art-window" />
            <div class="art-door" />
          </div>
        </div>
        <span class="art-caption">A PLACE TO BEGIN AGAIN</span>
      </div>
    </section>
    <section class="section container">
      <div class="section-heading">
        <div>
          <p class="eyebrow">PILIHAN FLAMBOYAN</p>
          <h2>Kenali rumah berikutnya.</h2>
        </div>
        <NuxtLink class="text-link" to="/properti">Seluruh properti →</NuxtLink>
      </div>
      <div v-if="error" class="notice" role="alert">
        <p>Katalog belum dapat dimuat.</p>
        <button class="button secondary" @click="refresh()">Coba lagi</button>
      </div>
      <div v-else-if="data?.data.length" class="property-grid">
        <PropertyCard
          v-for="property in data.data"
          :key="property.id"
          :property="property"
        />
      </div>
      <p v-else class="notice">
        Pilihan properti akan tampil setelah katalog tersedia.
      </p>
    </section>
    <section class="value-strip container">
      <div>
        <span class="eyebrow">01 / TEMUKAN</span>
        <h3>Mulai dari kebutuhan Anda.</h3>
        <p>Jelajahi lokasi, harga, dan spesifikasi dalam satu katalog.</p>
      </div>
      <div>
        <span class="eyebrow">02 / KENALI</span>
        <h3>Detail yang membantu.</h3>
        <p>Pahami luas, ruangan, kondisi, dan ketersediaan setiap rumah.</p>
      </div>
      <div>
        <span class="eyebrow">03 / HUBUNGI</span>
        <h3>Percakapan yang terarah.</h3>
        <p>Hubungi Admin dengan konteks properti yang Anda pilih.</p>
      </div>
    </section>
  </div>
</template>
