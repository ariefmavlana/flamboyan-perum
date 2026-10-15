<script setup lang="ts">
import { logo } from '#shared/content/flamboyan-assets'
defineProps<{ variant?: 'footer' }>()
</script>
<template>
  <NuxtLink
    class="brand"
    :class="{ 'brand-footer': variant === 'footer' }"
    to="/"
    aria-label="Flamboyan beranda"
  >
    <span class="brand-artwork">
      <img
        :src="logo.src"
        :width="logo.width"
        :height="logo.height"
        alt="Bukit Flamboyan Indah"
      />
    </span>
    <span class="brand-sub">PROPERTI & HUNIAN</span>
  </NuxtLink>
</template>
<style scoped>
.brand-artwork {
  display: block;
  width: 200px;
  max-width: 100%;
}
.brand-artwork img {
  display: block;
  width: 100%;
  height: auto;
}
.brand-footer .brand-artwork {
  width: 240px;
  padding: 12px;
  background: var(--cream);
}
@media (max-width: 760px) {
  .brand-artwork {
    width: 176px;
  }
}
</style>
