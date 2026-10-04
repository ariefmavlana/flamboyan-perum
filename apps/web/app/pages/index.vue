<script setup lang="ts">
import type { Paginated, Property, PublicContent } from '#shared/types'
import { formatIdr, whatsappLink } from '#shared/utils/catalog'
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
  title: 'Flamboyan Perum — Temukan rumah yang tepat',
  description:
    'Jelajahi katalog rumah, pahami spesifikasinya, dan temukan properti yang sesuai dengan kebutuhan Anda.',
})
useHead({ link: [{ rel: 'canonical', href: config.public.siteUrl }] })
</script>

<template>
  <div>
    <section class="hero container">
      <div class="hero-copy">
        <p class="eyebrow">{{ hero?.eyebrow ?? 'KATALOG HUNIAN FLAMBOYAN' }}</p>
        <h1>
          {{ hero?.title ?? 'Rumah yang tepat. Untuk langkah berikutnya.' }}
        </h1>
        <p class="hero-description">
          {{
            hero?.description ??
            'Jelajahi pilihan rumah, bandingkan detailnya, dan rencanakan pembiayaan sesuai kebutuhan Anda.'
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
          <AppIcon name="search" /><label class="sr-only" for="home-search"
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
          >Konsultasikan pilihan dengan Admin ↗</a
        >
      </div>
      <div class="hero-media">
        <template v-if="heroCover && hero?.property">
          <img
            class="hero-photo"
            :src="heroCover.url"
            :width="heroCover.width ?? undefined"
            :height="heroCover.height ?? undefined"
            :alt="hero.property.title"
            fetchpriority="high"
          />
          <NuxtLink class="hero-caption" :to="`/properti/${hero.property.slug}`"
            ><div>
              <small>DALAM KATALOG</small>{{ hero.property.title
              }}<small>{{ formatIdr(hero.property.price_idr) }}</small>
            </div>
            <AppIcon name="arrow"
          /></NuxtLink>
        </template>
        <div v-else class="hero-placeholder">
          <AppIcon name="home" />
          <p class="eyebrow">MULAI DARI KEBUTUHAN ANDA</p>
          <h2>Lokasi, ruang, dan anggaran.</h2>
          <p class="muted">Lihat informasi setiap rumah dalam satu katalog.</p>
          <NuxtLink class="text-link" to="/properti"
            >Lihat pilihan properti →</NuxtLink
          >
        </div>
      </div>
    </section>
    <div class="discovery-strip">
      <section class="value-strip container" aria-label="Langkah memilih rumah">
        <div>
          <span class="step">01</span>
          <h3>Temukan pilihan</h3>
          <p>Cari berdasarkan lokasi dan anggaran.</p>
        </div>
        <div>
          <span class="step">02</span>
          <h3>Bandingkan detail</h3>
          <p>Pertimbangkan spesifikasi dan estimasi KPR.</p>
        </div>
        <div>
          <span class="step">03</span>
          <h3>Bicarakan rencana</h3>
          <p>Hubungi Admin untuk langkah selanjutnya.</p>
        </div>
      </section>
    </div>
    <section class="section container">
      <div class="section-heading">
        <div>
          <p class="eyebrow">PILIHAN FLAMBOYAN</p>
          <h2>Rumah untuk dipertimbangkan.</h2>
          <p class="muted">Kenali lokasi, harga, dan ruang yang ditawarkan.</p>
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
    <p v-if="contentError" class="container notice">
      Konten referensi belum dapat dimuat.
    </p>
    <section v-if="content?.data.testimonials.length" class="testimonials">
      <div class="container section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">CERITA PENGALAMAN</p>
            <h2>Pengalaman memilih hunian.</h2>
          </div>
        </div>
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
      </div>
    </section>
    <section v-if="content?.data.bank_rates.length" class="container section">
      <p class="eyebrow">RENCANA PEMBIAYAAN</p>
      <h2>Referensi pembiayaan</h2>
      <p class="muted">
        Referensi suku bunga yang dikurasi. Konfirmasi syarat dan penawaran
        langsung ke bank.
      </p>
      <ul class="bank-grid">
        <li v-for="rate in content.data.bank_rates" :key="rate.id">
          <h3>{{ rate.bank }}</h3>
          <p class="muted">{{ rate.product }}</p>
          <strong
            >{{ rate.annual_rate }}%
            <small class="muted">per tahun</small></strong
          >
          <p class="muted">
            Berlaku {{ rate.effective_date }}–{{ rate.valid_until }}
          </p>
          <a
            class="text-link"
            :href="rate.source_url"
            target="_blank"
            rel="noopener noreferrer"
            >Sumber bank ↗</a
          >
        </li>
      </ul>
    </section>
  </div>
</template>
