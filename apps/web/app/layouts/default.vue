<script setup lang="ts">
const comparison = useComparison()
</script>
<template>
  <div>
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <header class="site-header container">
      <NuxtLink class="brand" to="/" aria-label="Flamboyan beranda"
        ><span class="brand-mark" aria-hidden="true">F</span> FLAMBOYAN<span
          class="brand-sub"
          >PERUM</span
        ></NuxtLink
      >
      <nav aria-label="Navigasi utama">
        <NuxtLink to="/properti">Jelajahi properti</NuxtLink
        ><NuxtLink to="/login" class="nav-secondary">Tim Flamboyan ↗</NuxtLink>
      </nav>
    </header>
    <main id="main"><slot /></main>
    <aside
      v-if="comparison.ids.value.length"
      class="comparison-tray container"
      aria-label="Pilihan perbandingan"
    >
      <NuxtLink
        :to="{
          path: '/bandingkan',
          query: { ids: comparison.ids.value.join(',') },
        }"
        >Bandingkan {{ comparison.ids.value.length }} properti →</NuxtLink
      >
      <p v-if="comparison.message.value" role="status">
        {{ comparison.message.value }}
      </p>
    </aside>
    <footer class="site-footer container">
      <span>Flamboyan Perum</span
      ><span>Temukan ruang untuk cerita berikutnya.</span>
    </footer>
  </div>
</template>
