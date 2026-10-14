<script setup lang="ts">
import type { Paginated, Property, PublicContent } from '#shared/types'
import { formatIdr, whatsappLink } from '#shared/utils/catalog'
const config = useRuntimeConfig()
const { whatsappNumber } = await useDevelopment()
const search = ref('')
const { data: content, error: contentError } = await useFetch<{
  data: PublicContent
}>('/api/v1/content')
const hero = computed(() => content.value?.data.hero)
const development = computed(() => content.value?.data.development)
const heroMedia = computed(() =>
  hero.value?.property?.media?.find((media) => media.kind === 'PHOTO'),
)
const heroCover = computed(() => heroMedia.value?.sources[0])
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
    whatsappNumber.value,
    'properti Flamboyan',
    config.public.siteUrl,
  ),
)
useSeoMeta({
  title: 'Flamboyan — Pilihan perumahan & cerita berikutnya',
  description:
    'Jelajahi perumahan Flamboyan di Bandung Timur dan kenali rencana hunian Banjaran. Temukan kawasan, bandingkan rumah, dan diskusikan pilihan Anda.',
})
useHead({ link: [{ rel: 'canonical', href: config.public.siteUrl }] })
</script>

<template>
  <div>
    <section class="editorial-hero" aria-label="Selamat datang di Flamboyan">
      <EditorialHeroMedia
        :media="hero?.media"
        :poster="hero?.media?.kind === 'VIDEO' ? heroMedia : undefined"
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
              'Berbeda suasana, satu rasa pulang. Jelajahi pilihan perumahan dalam naungan Flamboyan dan temukan ruang untuk keseharian yang Anda inginkan.'
            }}
          </p>
          <NuxtLink class="editorial-link" to="/properti"
            >Jelajahi pilihan rumah <AppIcon name="arrow"
          /></NuxtLink>
          <NuxtLink class="editorial-link hero-visit-link" to="/perumahan"
            >Kenali perumahan kami <AppIcon name="arrow"
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
          <p class="eyebrow">PILIHAN YANG LEBIH PERSONAL</p>
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
          <p>Telusuri harga, luas, dan denah sebelum menentukan pilihan.</p>
        </form>
      </div>
    </section>
    <nav class="buyer-shortcuts container" aria-label="Mulai mencari hunian">
      <NuxtLink to="/properti"
        ><span>01 / TEMUKAN</span><strong>Pilihan rumah</strong
        ><AppIcon name="arrow"
      /></NuxtLink>
      <NuxtLink to="/bandingkan"
        ><span>02 / PERTIMBANGKAN</span><strong>Bandingkan pilihan</strong
        ><AppIcon name="arrow"
      /></NuxtLink>
      <NuxtLink to="/konsultasi?tujuan=kunjungan"
        ><span>03 / KUNJUNGI</span><strong>Lihat lebih dekat</strong
        ><AppIcon name="arrow"
      /></NuxtLink>
    </nav>
    <section
      class="container home-residences"
      aria-labelledby="residences-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">SATU NAUNGAN, BERAGAM CERITA</p>
          <h2 id="residences-title">Temukan tempat Anda pulang.</h2>
          <p class="muted">
            Dari Bandung Timur hingga rencana baru di Banjaran. Kenali setiap
            kawasan dan cerita yang menyertainya.
          </p>
        </div>
        <NuxtLink class="text-link" to="/perumahan"
          >Seluruh perumahan →</NuxtLink
        >
      </div>
      <ResidenceCollection />
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
    <section class="editorial-intro container">
      <figure class="editorial-interior">
        <img
          src="/images/flamboyan-kawasan.webp"
          width="1080"
          height="800"
          loading="lazy"
          alt="Ilustrasi deretan hunian Bukit Flamboyan Indah 2 dari Rumah Rajasa; bukan foto kondisi aktual."
        />
        <figcaption>
          Ilustrasi kawasan ·
          <a
            href="https://rumahrajasa.com/"
            target="_blank"
            rel="noopener noreferrer"
            >Rumah Rajasa ↗</a
          >
        </figcaption>
      </figure>
      <div class="intro-copy">
        <p class="eyebrow">
          {{ development?.name ?? 'BUKIT FLAMBOYAN INDAH 2' }}
        </p>
        <h2>Ruang untuk keluarga.<br />Pilihan untuk masa depan.</h2>
        <div>
          <p>
            Memilih rumah berarti mempertimbangkan rutinitas, kebutuhan
            keluarga, dan rencana jangka panjang. Mulailah dari ruang yang Anda
            perlukan, lalu bandingkan luas tanah, tata ruang, dan pilihan
            pembiayaannya.
          </p>
          <a
            v-if="wa"
            :href="wa"
            class="text-link"
            target="_blank"
            rel="noopener noreferrer"
            >Diskusikan kebutuhan hunian <AppIcon name="arrow"
          /></a>
        </div>
      </div>
    </section>
    <section
      class="neighbourhood-story container"
      aria-labelledby="neighbourhood-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">KENALI SEBELUM MEMUTUSKAN</p>
          <h2 id="neighbourhood-title">
            Rumahnya. Kawasannya.<br />Keseharian Anda.
          </h2>
        </div>
        <NuxtLink class="text-link" to="/konsultasi?tujuan=kunjungan"
          >Rencanakan survei →</NuxtLink
        >
      </div>
      <div class="neighbourhood-grid">
        <figure>
          <img
            src="/images/flamboyan-gerbang.webp"
            width="747"
            height="420"
            loading="lazy"
            alt="Ilustrasi gerbang Bukit Flamboyan Indah 2 dari Rumah Rajasa."
          />
          <figcaption>Ilustrasi gerbang kawasan · Rumah Rajasa</figcaption>
        </figure>
        <div class="neighbourhood-copy">
          <p class="eyebrow">BANDUNG TIMUR</p>
          <h3>Temukan kecocokannya secara langsung.</h3>
          <p v-if="development?.address">{{ development.address }}</p>
          <p>
            Saat berkunjung, periksa akses dari rutinitas Anda, suasana
            lingkungan, kualitas bangunan, dan kesiapan fasilitas bersama tim
            kami.
          </p>
          <p class="muted">
            Visual kawasan merupakan ilustrasi pengembang. Kondisi dan
            ketersediaan unit dikonfirmasi saat konsultasi.
          </p>
          <NuxtLink class="text-link" to="/panduan/kunjungan-rumah"
            >Panduan saat melihat rumah →</NuxtLink
          >
        </div>
      </div>
    </section>
    <section v-if="hero?.property" class="editorial-spotlight container">
      <NuxtLink
        v-if="heroCover"
        :to="'/properti/' + hero.property.slug"
        class="spotlight-image"
        ><img
          :src="heroCover.url"
          :alt="heroMedia?.alt ?? hero.property.title"
          :srcset="
            heroMedia?.sources
              .filter((source) => source.width)
              .map((source) => `${source.url} ${source.width}w`)
              .join(',')
          "
          sizes="(max-width: 760px) 100vw, 50vw"
          :width="heroCover.width ?? undefined"
          :height="heroCover.height ?? undefined"
          loading="lazy" /><MediaDisclosure :alt="heroMedia?.alt"
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
    <BuyerGuidePreview />
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
    <BankPartners :partners="content?.data.bank_partners ?? []" />
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
