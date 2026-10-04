<script setup lang="ts">
import type { PublicMedia } from '#shared/types'
const props = defineProps<{
  media?: PublicMedia | null
  poster?: PublicMedia | null
}>()
const photo = computed(() =>
  props.media?.kind === 'PHOTO' ? props.media : props.poster,
)
const video = computed(() =>
  props.media?.kind === 'VIDEO' ? props.media : null,
)
const hydrated = ref(false)
const playing = ref(false)
const player = ref<HTMLDialogElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
onMounted(() => {
  hydrated.value = true
})
watch(
  () => props.media?.id,
  () => {
    player.value?.close()
    playing.value = false
  },
)
function openVideo() {
  playing.value = true
  player.value?.showModal()
}
function closeVideo() {
  playing.value = false
  trigger.value?.focus()
}
const sourceSet = computed(() =>
  photo.value?.sources
    .filter((source) => source.width)
    .map((source) => `${source.url} ${source.width}w`)
    .join(', '),
)
</script>
<template>
  <img
    v-if="photo?.sources.length"
    class="editorial-hero-photo"
    :src="photo.sources.at(-1)?.url"
    :srcset="sourceSet"
    sizes="100vw"
    :width="photo.width ?? undefined"
    :height="photo.height ?? undefined"
    fetchpriority="high"
    :alt="photo.alt"
  />
  <img
    v-else
    class="editorial-hero-photo"
    src="/images/editorial-garden-1920.webp"
    srcset="
      /images/editorial-garden-960.webp   960w,
      /images/editorial-garden-1920.webp 1920w
    "
    sizes="100vw"
    width="1920"
    height="1280"
    fetchpriority="high"
    alt="Inspirasi hunian tropis dengan taman; foto ilustrasi, bukan unit dalam katalog."
  />
  <p v-if="photo?.sources.length" class="photo-credit hero-media-caption">
    {{ photo.alt }}
  </p>
  <p v-else class="photo-credit">
    Foto ilustrasi ·
    <a
      href="https://unsplash.com/photos/Pfp0MP8QB7M"
      target="_blank"
      rel="noopener noreferrer"
      >Sergei Bezzubov / Unsplash ↗</a
    >
  </p>
  <div v-if="video?.url" class="hero-video-control">
    <button
      ref="trigger"
      type="button"
      class="button secondary"
      :disabled="!hydrated"
      @click="openVideo"
    >
      Putar video hunian <span aria-hidden="true">↗</span>
    </button>
    <p>YouTube dimuat hanya setelah Anda memilih putar.</p>
  </div>
  <dialog
    v-if="video?.url"
    ref="player"
    class="hero-video-dialog"
    aria-label="Video hunian"
    @close="closeVideo"
  >
    <div class="hero-video-heading">
      <h2>{{ video.alt }}</h2>
      <button type="button" class="button secondary" @click="player?.close()">
        Tutup video
      </button>
    </div>
    <iframe
      v-if="playing"
      :src="video.url"
      :title="video.alt"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      allow="fullscreen; accelerometer; gyroscope"
      allowfullscreen
    />
  </dialog>
</template>
<style scoped>
.hero-media-caption {
  max-width: min(760px, 90%);
}
.hero-video-control {
  position: absolute;
  z-index: 2;
  top: 24px;
  left: max(24px, calc((100vw - 1240px) / 2));
  max-width: 280px;
  color: #fff;
}
.hero-video-control p {
  font-size: 11px;
  line-height: 1.5;
  margin: 8px 0 0;
}
.hero-video-dialog {
  width: min(1100px, 94vw);
  max-height: 92dvh;
  border: 0;
  padding: 24px;
  background: var(--cream);
  color: var(--ink);
}
.hero-video-dialog::backdrop {
  background: #171712cc;
}
.hero-video-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}
.hero-video-heading h2 {
  font-size: 24px;
  margin: 0;
}
.hero-video-heading .button {
  flex-shrink: 0;
}
.hero-video-dialog iframe {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  border: 0;
}
@media (max-width: 760px) {
  .hero-video-control {
    bottom: auto;
    top: 20px;
    left: 24px;
  }
  .hero-video-control p {
    display: none;
  }
  .hero-video-heading {
    align-items: start;
    flex-direction: column;
  }
  .hero-video-dialog {
    padding: 16px;
  }
}
</style>
