<script setup lang="ts">
import { whatsappLink } from '#shared/utils/catalog'
import { siteOrigin } from '#shared/utils/seo'
const comparison = useComparison()
const config = useRuntimeConfig()
const consent = useConsent()
const analytics = useAnalytics()
const { whatsappNumber } = await useDevelopment()
const instagram = computed(() =>
  String(config.public.instagramUrl ?? '').trim(),
)
const wa = computed(() =>
  whatsappLink(
    whatsappNumber.value,
    'properti Flamboyan',
    siteOrigin(String(config.public.siteUrl)),
  ),
)
function trackWhatsapp() {
  analytics.track('click_whatsapp', {
    page_type: 'global',
    lead_channel: 'whatsapp',
  })
}
</script>
<template>
  <div class="public-shell">
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <header class="public-header">
      <div class="site-header container">
        <BrandLogo />
        <ResponsiveNav id="public-navigation" label="Navigasi utama">
          <NuxtLink to="/">Beranda</NuxtLink>
          <NuxtLink to="/perumahan">Perumahan</NuxtLink>
          <NuxtLink to="/properti">Jelajahi properti</NuxtLink>
          <NuxtLink to="/panduan">Panduan</NuxtLink>
          <NuxtLink
            :to="{
              path: '/bandingkan',
              query: comparison.ids.value.length
                ? { ids: comparison.ids.value.join(',') }
                : {},
            }"
            >Bandingkan</NuxtLink
          >
          <NuxtLink to="/konsultasi">Konsultasi</NuxtLink>
          <a
            v-if="wa"
            :href="wa"
            class="button whatsapp-button"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackWhatsapp"
            ><AppIcon name="whatsapp" />WhatsApp Admin <AppIcon name="external"
          /></a>
        </ResponsiveNav>
      </div>
    </header>
    <main id="main" tabindex="-1"><slot /></main>
    <aside
      v-if="comparison.ids.value.length"
      class="comparison-tray"
      aria-label="Pilihan perbandingan"
    >
      <AppIcon name="compare" />
      <NuxtLink
        :to="{
          path: '/bandingkan',
          query: { ids: comparison.ids.value.join(',') },
        }"
        >Bandingkan {{ comparison.ids.value.length }} properti<AppIcon
          name="arrow"
      /></NuxtLink>
      <span class="tray-hint">Maksimal 3 pilihan</span>
      <p v-if="comparison.message.value" role="status">
        {{ comparison.message.value }}
      </p>
    </aside>
    <footer class="footer-wrap">
      <div class="container footer-invitation">
        <p class="eyebrow">LANGKAH BERIKUTNYA</p>
        <h2>Mari temukan<br />ruang Anda.</h2>
        <a
          v-if="wa"
          :href="wa"
          class="button whatsapp-button"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackWhatsapp"
          ><AppIcon name="whatsapp" />WhatsApp Admin <AppIcon name="external"
        /></a>
      </div>
      <div class="container footer-main">
        <div>
          <BrandLogo variant="footer" />
          <p>
            Berbeda suasana. Satu naungan.<br />Ruang untuk cerita berikutnya.
          </p>
        </div>
        <nav aria-label="Navigasi footer">
          <NuxtLink to="/perumahan">Pilihan perumahan</NuxtLink>
          <NuxtLink to="/perumahan/bukit-flamboyan-indah-2"
            >Bukit Flamboyan Indah 2</NuxtLink
          >
          <NuxtLink to="/perumahan/banjaran">Banjaran · mendatang</NuxtLink>
          <NuxtLink to="/properti">Katalog properti</NuxtLink
          ><NuxtLink to="/bandingkan">Bandingkan rumah</NuxtLink
          ><NuxtLink to="/bandung-timur">Tentang Bandung Timur</NuxtLink
          ><NuxtLink to="/panduan">Panduan memilih rumah</NuxtLink
          ><NuxtLink to="/konsultasi">Konsultasi & kunjungan</NuxtLink
          ><NuxtLink to="/privasi">Informasi privasi</NuxtLink
          ><a
            v-if="instagram"
            :href="instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram resmi Flamboyan"
            ><AppIcon name="instagram" />Instagram</a
          ><button
            v-if="consent.required.value"
            class="text-link"
            type="button"
            @click="consent.requestChange()"
          >
            Pilihan privasi</button
          ><NuxtLink to="/backoffice"
            >Tim Flamboyan<AppIcon name="external" /></NuxtLink>
        </nav>
      </div>
      <div class="container site-footer">
        <span>Flamboyan Perum · Bandung Timur & Banjaran</span
        ><span>Temukan rumah. Rencanakan langkah berikutnya.</span>
      </div>
    </footer>
    <ConsentBanner />
  </div>
</template>
