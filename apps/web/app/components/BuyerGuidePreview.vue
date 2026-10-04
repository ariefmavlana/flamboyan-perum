<script setup lang="ts">
import { buyerGuides } from '#shared/content/buyer-guides'
withDefaults(defineProps<{ showIndexLink?: boolean }>(), {
  showIndexLink: true,
})
</script>
<template>
  <section class="container section buyer-guides-preview">
    <div class="section-heading">
      <div>
        <p class="eyebrow">CATATAN MEMILIH RUMAH</p>
        <h2>Pilihan yang lebih dipahami.</h2>
      </div>
      <NuxtLink v-if="showIndexLink" to="/panduan" class="text-link"
        >Baca seluruh panduan →</NuxtLink
      >
    </div>
    <div class="guide-card-grid">
      <article
        v-for="guide in buyerGuides"
        :key="guide.slug"
        class="guide-card"
      >
        <NuxtLink
          :to="'/panduan/' + guide.slug"
          class="guide-card-image"
          tabindex="-1"
          aria-hidden="true"
          ><img
            :src="guide.image"
            alt=""
            width="960"
            height="640"
            loading="lazy"
        /></NuxtLink>
        <p class="eyebrow">{{ guide.category }} · PANDUAN FLAMBOYAN</p>
        <h3>
          <NuxtLink :to="'/panduan/' + guide.slug">{{ guide.title }}</NuxtLink>
        </h3>
        <p>{{ guide.summary }}</p>
        <NuxtLink
          :to="'/panduan/' + guide.slug"
          class="text-link"
          :aria-label="'Baca: ' + guide.title"
          >Baca catatan →</NuxtLink
        >
      </article>
    </div>
  </section>
</template>
