<script setup lang="ts">
defineProps<{ logotype?: boolean }>()
</script>

<template>
  <NuxtLink class="brand" to="/" aria-label="Flamboyan beranda"
    ><img
      v-if="logotype"
      class="brand-logo"
      src="/images/logo-flamboyan.webp"
      width="308"
      height="96"
      alt=""
    /><span v-else class="brand-wordmark"
      >flamboyan<span class="brand-dot">.</span></span
    ><span class="brand-sub">PROPERTI & HUNIAN</span></NuxtLink
  >
</template>
