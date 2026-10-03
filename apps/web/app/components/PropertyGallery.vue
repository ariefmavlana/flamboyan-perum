<script setup lang="ts">
import type { PublicMedia } from '#shared/types'
const props = defineProps<{ media: PublicMedia[] }>()
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
const images = computed(() =>
  props.media.filter(
    (item) => item.kind === 'PHOTO' || item.kind === 'FLOOR_PLAN',
  ),
)
const active = ref(0)
const selected = computed(
  () =>
    images.value[Math.min(active.value, Math.max(0, images.value.length - 1))],
)
const loadedEmbeds = ref<number[]>([])
const preview = ref<HTMLDialogElement | null>(null)
const srcset = (item: PublicMedia) =>
  [
    ...new Map(
      item.sources
        .filter((source) => source.width)
        .map((source) => [source.width, `${source.url} ${source.width}w`]),
    ).values(),
  ].join(', ')
</script>
<template>
  <div v-if="selected" class="property-gallery">
    <button
      class="gallery-main"
      type="button"
      aria-label="Perbesar gambar properti"
      :disabled="!hydrated"
      @click="preview?.showModal()"
    >
      <img
        :src="selected.sources.at(-1)?.url"
        :srcset="srcset(selected)"
        sizes="(max-width: 900px) 100vw, 65vw"
        :alt="selected.alt"
        :width="selected.width ?? undefined"
        :height="selected.height ?? undefined"
        fetchpriority="high"
      />
    </button>
    <p>
      {{ selected.kind === 'FLOOR_PLAN' ? 'Denah · ' : '' }}{{ selected.alt }} ·
      {{ active + 1 }} / {{ images.length }}
    </p>
    <div class="gallery-thumbs">
      <button
        v-for="(item, index) in images"
        :key="item.id"
        type="button"
        :aria-label="`Lihat ${item.alt}`"
        :aria-pressed="active === index"
        :disabled="!hydrated"
        @click="active = index"
      >
        <img
          :src="item.sources[0]?.url"
          :alt="item.alt"
          width="120"
          height="80"
          loading="lazy"
        />
      </button>
    </div>
    <dialog
      ref="preview"
      class="image-dialog"
      aria-label="Gambar properti diperbesar"
    >
      <button class="button secondary" @click="preview?.close()">
        Tutup gambar</button
      ><img
        :src="selected.sources.at(-1)?.url"
        :alt="selected.alt"
        :width="selected.width ?? undefined"
        :height="selected.height ?? undefined"
      />
    </dialog>
  </div>
  <div v-else class="detail-visual property-visual">
    <div class="house-line" aria-hidden="true" />
    <p>Foto properti belum tersedia.</p>
  </div>
  <section
    v-for="item in media.filter(
      (value) => value.kind === 'VIDEO' || value.kind === 'TOUR',
    )"
    :key="item.id"
    class="media-embed"
  >
    <h3>{{ item.kind === 'VIDEO' ? 'Video properti' : 'Virtual tour' }}</h3>
    <p>{{ item.alt }}</p>
    <p v-if="!loadedEmbeds.includes(item.id)" class="muted">
      Konten dari penyedia eksternal dimuat setelah Anda memilih untuk
      membukanya.
    </p>
    <button
      v-if="!loadedEmbeds.includes(item.id)"
      class="button secondary"
      type="button"
      :disabled="!hydrated"
      @click="loadedEmbeds.push(item.id)"
    >
      Muat {{ item.kind === 'VIDEO' ? 'video' : 'tour' }}</button
    ><iframe
      v-else
      :src="item.url ?? undefined"
      :title="item.alt"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      allow="fullscreen; accelerometer; gyroscope"
      allowfullscreen
    />
  </section>
  <a
    v-for="item in media.filter((value) => value.kind === 'BROCHURE')"
    :key="item.id"
    :href="item.sources[0]?.url"
    class="button secondary"
    >Unduh {{ item.alt }} (PDF)</a
  >
</template>
