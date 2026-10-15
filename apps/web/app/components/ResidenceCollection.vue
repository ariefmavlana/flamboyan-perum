<script setup lang="ts">
import { gateDay } from '#shared/content/flamboyan-assets'
</script>
<template>
  <div class="residence-collection">
    <article class="residence-card">
      <NuxtLink
        to="/perumahan/bukit-flamboyan-indah-2"
        class="residence-card-image"
        aria-label="Kenali Bukit Flamboyan Indah 2"
      >
        <img
          :src="gateDay.src"
          :srcset="
            gateDay.sources
              .map((source) => `${source.url} ${source.width}w`)
              .join(', ')
          "
          sizes="(max-width: 760px) 100vw, 50vw"
          :width="gateDay.width"
          :height="gateDay.height"
          loading="lazy"
          :alt="gateDay.alt"
        />
        <span class="residence-status">Jelajahi kawasan</span>
        <span class="residence-image-note">Ilustrasi desain gerbang</span>
      </NuxtLink>
      <div class="residence-card-copy">
        <p class="eyebrow">01 / BANDUNG TIMUR</p>
        <h3>
          <NuxtLink to="/perumahan/bukit-flamboyan-indah-2"
            >Bukit Flamboyan Indah 2</NuxtLink
          >
        </h3>
        <p>
          Kenali kawasan, pelajari pilihan rumah, dan pertimbangkan ruang untuk
          langkah berikutnya.
        </p>
        <NuxtLink to="/perumahan/bukit-flamboyan-indah-2" class="text-link"
          >Kenali perumahan <AppIcon name="arrow"
        /></NuxtLink>
      </div>
    </article>
    <article class="residence-card residence-card-upcoming">
      <NuxtLink
        to="/perumahan/banjaran"
        class="residence-card-image"
        aria-label="Kenali rencana hunian Banjaran"
      >
        <img
          src="/images/editorial-garden-960.webp"
          srcset="
            /images/editorial-garden-960.webp   960w,
            /images/editorial-garden-1920.webp 1920w
          "
          sizes="(max-width: 760px) 100vw, 50vw"
          width="960"
          height="640"
          loading="lazy"
          alt="Foto inspirasi rumah tropis dengan taman; bukan lokasi atau desain final perumahan Banjaran."
        />
        <span class="residence-status">Hunian mendatang</span>
        <span class="residence-image-note"
          >Foto inspirasi · Sergei Bezzubov / Unsplash</span
        >
      </NuxtLink>
      <div class="residence-card-copy">
        <p class="eyebrow">02 / BANJARAN</p>
        <h3>
          <NuxtLink to="/perumahan/banjaran">Sebuah cerita baru.</NuxtLink>
        </h3>
        <p>
          Rencana perumahan berikutnya dalam naungan Flamboyan. Mulai mengenal
          arah suasananya.
        </p>
        <NuxtLink to="/perumahan/banjaran" class="text-link"
          >Jelajahi konsep Banjaran <AppIcon name="arrow"
        /></NuxtLink>
      </div>
    </article>
  </div>
</template>
