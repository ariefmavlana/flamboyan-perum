<script setup lang="ts">
import type { PublicMedia } from '#shared/types'
import { gateDay } from '#shared/content/flamboyan-assets'
const props = defineProps<{ photos: PublicMedia[]; hasVideo: boolean }>()
const {
  stage,
  selected,
  index,
  paused,
  motionAllowed,
  loading,
  message,
  move,
  toggle,
} = usePhotoCarousel(
  computed(() => props.photos),
  '100vw',
)
</script>
<template>
  <section
    ref="stage"
    class="photo-banner"
    :class="{ 'has-multiple': photos.length > 1 }"
    aria-label="Selamat datang di Flamboyan"
  >
    <Transition
      name="photo-dissolve"
      @before-leave="(el) => el.setAttribute('aria-hidden', 'true')"
    >
      <img
        v-if="selected"
        :key="selected.id"
        class="photo-banner-image"
        :src="selected.sources.at(-1)?.url"
        :srcset="
          selected.sources
            .filter((source) => source.width)
            .map((source) => `${source.url} ${source.width}w`)
            .join(', ')
        "
        sizes="100vw"
        :width="selected.width ?? undefined"
        :height="selected.height ?? undefined"
        :alt="selected.alt"
        fetchpriority="high"
      />
    </Transition>
    <div class="photo-banner-shade" aria-hidden="true" />
    <slot />
    <div class="banner-bottom">
      <div class="banner-footer">
        <a v-if="hasVideo" class="banner-scroll" href="#film-kawasan"
          >Lihat video kawasan <AppIcon name="chevron-down" /></a
        >
        <div
          v-if="photos.length > 1"
          class="banner-photo-controls"
          role="group"
          aria-label="Foto banner beranda"
        >
          <span>{{ index + 1 }} / {{ photos.length }}</span>
          <button
            type="button"
            aria-label="Foto banner sebelumnya"
            :disabled="loading"
            @click="move(-1)"
          >
            <AppIcon name="chevron-left" />
          </button>
          <button
            v-if="motionAllowed"
            type="button"
            :aria-label="paused ? 'Putar foto banner' : 'Jeda foto banner'"
            :aria-pressed="paused"
            @click="toggle"
          >
            <AppIcon :name="paused ? 'play' : 'pause'" />
          </button>
          <button
            type="button"
            aria-label="Foto banner berikutnya"
            :disabled="loading"
            @click="move(1)"
          >
            <AppIcon name="chevron-right" />
          </button>
        </div>
        <p v-if="message" role="status">{{ message }}</p>
      </div>
      <span class="photo-banner-caption">{{
        selected?.id === -1 ? gateDay.caption : selected?.alt
      }}</span>
    </div>
  </section>
</template>
