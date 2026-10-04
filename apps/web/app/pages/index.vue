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
    <section class="editorial-hero" aria-label="Selamat datang di Flamboyan">
      <img
        class="editorial-hero-photo"
        src="/images/editorial-garden-1920.webp"
        srcset="
          /images/editorial-garden-960.webp   960w,
          /images/editorial-garden-1920.webp 1920w
        "
        sizes="100vw"
        width="1920"
        height="1280"
        fetchpriority="high"
        alt="Inspirasi suasana hunian tropis dengan taman; foto ilustrasi, bukan unit dalam katalog."
      />
      <div class="editorial-hero-content">
        <div class="editorial-headline">
          <p class="eyebrow">
            {{ hero?.eyebrow ?? 'FLAMBOYAN · PROPERTI & HUNIAN' }}
          </p>
          <h1>{{ hero?.title ?? 'Ruang untuk cerita berikutnya.' }}</h1>
          <p>
            {{
              hero?.description ??
              'Temukan rumah yang terasa tepat. Jelajahi ruang, kenali lokasinya, dan rencanakan langkah berikutnya bersama kami.'
            }}
          </p>
          <NuxtLink class="editorial-link" to="/properti"
            >Temukan pilihan Anda <AppIcon name="arrow"
          /></NuxtLink>
        </div>
        <form
          class="editorial-search"
          @submit.prevent="
            navigateTo({
              path: '/properti',
              query: search ? { q: search } : {},
            })
          "
        >
          <label for="home-search">Cari lokasi atau nama properti</label>
          <div class="editorial-search-control">
            <input
              id="home-search"
              v-model="search"
              :disabled="!hydrated"
              placeholder="Di mana Anda ingin tinggal?"
              maxlength="100"
            /><button
              type="submit"
              :disabled="!hydrated"
              aria-label="Jelajahi →"
            >
              <AppIcon name="arrow" />
            </button>
          </div>
          <p>Lokasi yang Anda pilih. Ruang yang Anda butuhkan.</p>
        </form>
      </div>
      <p class="photo-credit">
        Foto ilustrasi ·
        <a
          href="https://unsplash.com/photos/Pfp0MP8QB7M"
          target="_blank"
          rel="noopener noreferrer"
          >Sergei Bezzubov / Unsplash ↗</a
        >
      </p>
    </section>
    <section class="editorial-intro container">
      <p class="eyebrow">SEBUAH TEMPAT UNTUK PULANG</p>
      <h2>Lebih dari alamat.<br />Tentang cara Anda hidup.</h2>
      <div>
        <p>
          Mulai dari lokasi yang dekat dengan keseharian, ruang yang cukup untuk
          tumbuh, hingga anggaran yang terasa nyaman. Setiap detail membantu
          Anda menemukan pilihan.
        </p>
        <a
          v-if="wa"
          :href="wa"
          class="text-link"
          target="_blank"
          rel="noopener noreferrer"
          >Bicarakan rencana Anda <AppIcon name="arrow"
        /></a>
      </div>
    </section>
    <section class="section container featured-collection">
      <div class="section-heading">
        <div>
          <p class="eyebrow">PILIHAN FLAMBOYAN</p>
          <h2>Pilihan untuk langkah berikutnya.</h2>
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
    <section v-if="hero?.property" class="editorial-spotlight container">
      <NuxtLink
        v-if="heroCover"
        :to="'/properti/' + hero.property.slug"
        class="spotlight-image"
        ><img
          :src="heroCover.url"
          :alt="hero.property.title"
          :width="heroCover.width ?? undefined"
          :height="heroCover.height ?? undefined"
          loading="lazy"
      /></NuxtLink>
      <div class="spotlight-copy">
        <p class="eyebrow">SOROTAN KATALOG</p>
        <h2>{{ hero.property.title }}</h2>
        <p class="price">{{ formatIdr(hero.property.price_idr) }}</p>
        <p>
          Kenali spesifikasi, lihat setiap ruang, dan pertimbangkan
          kemungkinannya untuk keseharian Anda.
        </p>
        <NuxtLink class="text-link" :to="'/properti/' + hero.property.slug"
          >Kenali rumah ini <AppIcon name="arrow"
        /></NuxtLink>
      </div>
    </section>
    <section
      class="editorial-guide container"
      aria-label="Langkah memilih rumah"
    >
      <div class="section-heading">
        <p class="eyebrow">DARI PILIHAN MENJADI RENCANA</p>
        <h2>Langkah yang lebih terarah.</h2>
      </div>
      <div class="value-strip">
        <div>
          <span class="step">01</span>
          <h3>Temukan ruang Anda</h3>
          <p>
            Telusuri lokasi, anggaran, dan spesifikasi yang sesuai kebutuhan.
          </p>
          <NuxtLink class="text-link" to="/properti"
            >Jelajahi katalog →</NuxtLink
          >
        </div>
        <div>
          <span class="step">02</span>
          <h3>Lihat lebih dekat</h3>
          <p>
            Bandingkan hingga tiga rumah dan pelajari estimasi pembiayaannya.
          </p>
          <NuxtLink class="text-link" to="/bandingkan"
            >Bandingkan pilihan →</NuxtLink
          >
        </div>
        <div>
          <span class="step">03</span>
          <h3>Mulai percakapan</h3>
          <p>Diskusikan ketersediaan dan rencana kunjungan bersama Admin.</p>
          <a
            v-if="wa"
            class="text-link"
            :href="wa"
            target="_blank"
            rel="noopener noreferrer"
            >Hubungi Admin ↗</a
          >
        </div>
      </div>
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
