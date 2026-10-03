<script setup lang="ts">
import type { Paginated, Property, PublicContent } from '#shared/types'
import { whatsappLink } from '#shared/utils/catalog'
const config = useRuntimeConfig()
const search = ref('')
const { data: content, error: contentError } = await useFetch<{
  data: PublicContent
}>('/api/v1/content')
const hero = computed(() => content.value?.data.hero)
const heroCover = computed(
  () =>
    hero.value?.property?.media?.find((media) => media.kind === 'PHOTO')
      ?.sources[0],
)
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
        <p class="eyebrow">
          {{ hero?.eyebrow ?? 'RUMAH · KEHIDUPAN · MASA DEPAN' }}
        </p>
        <h1 v-if="hero">{{ hero.title }}</h1>
        <h1 v-else>Ruang untuk<br />cerita <em>berikutnya.</em></h1>
        <p class="hero-description">
          {{
            hero?.description ??
            'Setiap rumah membuka kemungkinan baru. Temukan properti yang selaras dengan kebutuhan dan rencana Anda.'
          }}
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
      <img
        v-if="heroCover"
        class="hero-photo"
        :src="heroCover.url"
        :width="heroCover.width ?? undefined"
        :height="heroCover.height ?? undefined"
        :alt="hero?.property?.title ?? 'Properti Flamboyan'"
        fetchpriority="high"
      />
      <div v-else class="hero-art" aria-hidden="true">
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
    <p v-if="contentError" class="container notice">
      Konten referensi belum dapat dimuat.
    </p>
    <section v-if="content?.data.testimonials.length" class="container section">
      <p class="eyebrow">CERITA PENGALAMAN</p>
      <h2>Dari mereka yang telah memilih.</h2>
      <div class="property-grid">
        <figure
          v-for="item in content.data.testimonials"
          :key="item.id"
          class="detail-summary"
        >
          <blockquote>{{ item.quote }}</blockquote>
          <figcaption>{{ item.name }} · {{ item.context }}</figcaption>
        </figure>
      </div>
    </section>
    <section v-if="content?.data.bank_rates.length" class="container section">
      <h2>Referensi pembiayaan</h2>
      <p class="muted">
        Referensi rate publik yang dikurasi, bukan klaim kemitraan bank.
      </p>
      <ul class="poi-list">
        <li v-for="rate in content.data.bank_rates" :key="rate.id">
          {{ rate.bank }} · {{ rate.product }} · {{ rate.annual_rate }}% ·
          Berlaku {{ rate.effective_date }}–{{ rate.valid_until }}.
          <a :href="rate.source_url" target="_blank" rel="noopener noreferrer"
            >Sumber bank ↗</a
          >
        </li>
      </ul>
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
