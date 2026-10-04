<script setup lang="ts">
import { whatsappLink } from '#shared/utils/catalog'
const comparison = useComparison()
const config = useRuntimeConfig()
const wa = computed(() =>
  whatsappLink(
    config.public.whatsappNumber,
    'properti Flamboyan',
    config.public.siteUrl,
  ),
)
</script>
<template>
  <div class="public-shell">
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <header class="public-header">
      <div class="site-header container">
        <BrandLogo />
        <ResponsiveNav id="public-navigation" label="Navigasi utama">
          <NuxtLink to="/">Beranda</NuxtLink>
          <NuxtLink to="/properti">Jelajahi properti</NuxtLink>
          <NuxtLink
            :to="{
              path: '/bandingkan',
              query: comparison.ids.value.length
                ? { ids: comparison.ids.value.join(',') }
                : {},
            }"
            >Bandingkan</NuxtLink
          >
          <a
            v-if="wa"
            :href="wa"
            class="button"
            target="_blank"
            rel="noopener noreferrer"
            >Hubungi Admin <AppIcon name="arrow"
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
        >Bandingkan {{ comparison.ids.value.length }} properti →</NuxtLink
      >
      <span class="tray-hint">Maksimal 3 pilihan</span>
      <p v-if="comparison.message.value" role="status">
        {{ comparison.message.value }}
      </p>
    </aside>
    <footer class="footer-wrap">
      <div class="container footer-main">
        <div>
          <BrandLogo />
          <p>
            Informasi rumah yang Anda butuhkan.<br />Langkah berikutnya yang
            lebih terarah.
          </p>
        </div>
        <nav aria-label="Navigasi footer">
          <NuxtLink to="/properti">Katalog properti</NuxtLink
          ><NuxtLink to="/bandingkan">Bandingkan rumah</NuxtLink
          ><NuxtLink to="/privasi">Informasi privasi</NuxtLink
          ><NuxtLink to="/login">Tim Flamboyan ↗</NuxtLink>
        </nav>
      </div>
      <div class="container site-footer">
        <span>Flamboyan Perum</span
        ><span>Temukan rumah. Rencanakan langkah berikutnya.</span>
      </div>
    </footer>
  </div>
</template>
