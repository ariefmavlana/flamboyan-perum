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
    <footer class="site-footer container">
      <span>Flamboyan Perum</span
      ><span>Temukan ruang untuk cerita berikutnya.</span>
    </footer>
  </div>
</template>
