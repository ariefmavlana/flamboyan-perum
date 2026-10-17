<script setup lang="ts">
import type { PublicMedia } from '#shared/types'
import { gateDay } from '#shared/content/flamboyan-assets'
import { youtubeEmbed } from '#shared/utils/youtube'
import { loadYouTubePlayer, type YouTubePlayer } from '~/utils/youtube-player'
const props = withDefaults(
  defineProps<{
    media?: PublicMedia | null
    poster?: PublicMedia | null
    videoUrl?: string | null
    videoTitle?: string | null
    autoplay?: boolean
  }>(),
  {
    autoplay: true,
    media: null,
    poster: null,
    videoUrl: null,
    videoTitle: null,
  },
)
const photo = computed(() =>
  props.media?.kind === 'PHOTO' ? props.media : props.poster,
)
const video = computed(() =>
  youtubeEmbed(
    props.videoUrl || (props.media?.kind === 'VIDEO' ? props.media.url : null),
  ),
)
const title = computed(
  () =>
    props.videoTitle ||
    (props.media?.kind === 'VIDEO'
      ? props.media.alt
      : 'Mengenal Bukit Flamboyan Indah 2'),
)
const sourceSet = computed(() =>
  photo.value?.sources
    .filter((source) => source.width)
    .map((source) => `${source.url} ${source.width}w`)
    .join(', '),
)
const stage = ref<HTMLElement | null>(null)
const mount = ref<HTMLElement | null>(null)
const ready = ref(false)
const playing = ref(false)
const muted = ref(true)
const failed = ref(false)
const loading = ref(false)
const interactive = ref(false)
let player: YouTubePlayer | undefined
let observer: IntersectionObserver | undefined
let motion: MediaQueryList | undefined
let visible = true
let resumeWhenVisible = false
let autoPlay = false
let generation = 0
let readyTimeout: ReturnType<typeof setTimeout> | undefined
let soundPoll: ReturnType<typeof setInterval> | undefined

function visibilityChanged() {
  if (!player || !ready.value) return
  if ((!visible || document.hidden) && playing.value) {
    resumeWhenVisible = true
    player.pauseVideo()
  } else if (visible && !document.hidden && resumeWhenVisible) {
    resumeWhenVisible = false
    player.playVideo()
  }
}
function motionChanged() {
  if (motion?.matches) {
    resumeWhenVisible = false
    player?.pauseVideo()
  }
}
async function load(play = false) {
  if (!video.value || loading.value) return
  const current = ++generation
  const info = video.value
  failed.value = false
  loading.value = true
  try {
    const api = await loadYouTubePlayer()
    if (current !== generation || !mount.value) return
    player?.destroy()
    clearTimeout(readyTimeout)
    clearInterval(soundPoll)
    const target = document.createElement('div')
    mount.value.replaceChildren(target)
    player = new api.Player(target, {
      host: 'https://www.youtube-nocookie.com',
      videoId: info.id,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
        playsinline: 1,
        loop: 1,
        playlist: info.id,
        start: info.start,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady(event) {
          if (current !== generation) return
          const iframe = event.target.getIframe()
          iframe.title = title.value
          iframe.referrerPolicy = 'strict-origin-when-cross-origin'
          iframe.allow =
            'autoplay; encrypted-media; picture-in-picture; fullscreen'
          event.target.mute()
          ready.value = true
          failed.value = false
          loading.value = false
          clearTimeout(readyTimeout)
          soundPoll = setInterval(() => {
            if (visible && !document.hidden && player)
              muted.value = player.isMuted()
          }, 1000)
          if (play && !motion?.matches) {
            if (visible && !document.hidden) event.target.playVideo()
            else resumeWhenVisible = true
          }
        },
        onStateChange(event) {
          if (current !== generation) return
          playing.value = event.data === 1
          if (event.data === 0) {
            event.target.seekTo(info.start, true)
            if (visible && !document.hidden) event.target.playVideo()
          }
        },
        onError() {
          if (current === generation) {
            failed.value = true
            loading.value = false
            playing.value = false
            clearTimeout(readyTimeout)
          }
        },
        onAutoplayBlocked() {
          if (current === generation) playing.value = false
        },
      },
    })
    readyTimeout = setTimeout(() => {
      if (current === generation && !ready.value) {
        failed.value = true
        loading.value = false
      }
    }, 15000)
  } catch {
    if (current === generation) {
      failed.value = true
      loading.value = false
    }
  }
}
function toggle() {
  resumeWhenVisible = false
  if (failed.value || !ready.value) {
    void load(true)
    return
  }
  if (playing.value) player?.pauseVideo()
  else player?.playVideo()
}
function toggleSound() {
  if (!player) return
  if (muted.value) player.unMute()
  else player.mute()
  muted.value = !muted.value
}
watch(
  () => video.value?.id + ':' + video.value?.start,
  () => {
    generation++
    clearTimeout(readyTimeout)
    clearInterval(soundPoll)
    player?.destroy()
    player = undefined
    ready.value = false
    playing.value = false
    muted.value = true
    failed.value = false
    loading.value = false
    if (
      interactive.value &&
      video.value &&
      autoPlay &&
      !motion?.matches &&
      visible
    )
      void load(true)
  },
)
onMounted(() => {
  interactive.value = true
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion.addEventListener('change', motionChanged)
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection
  const auto = props.autoplay && !motion.matches && !connection?.saveData
  autoPlay = auto
  if (stage.value) {
    observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false
        if (
          visible &&
          auto &&
          !motion?.matches &&
          video.value &&
          !player &&
          !loading.value &&
          !failed.value
        )
          void load(true)
        else visibilityChanged()
      },
      { threshold: 0.15 },
    )
    observer.observe(stage.value)
  }
  document.addEventListener('visibilitychange', visibilityChanged)
})
onBeforeUnmount(() => {
  generation++
  clearTimeout(readyTimeout)
  clearInterval(soundPoll)
  player?.destroy()
  observer?.disconnect()
  motion?.removeEventListener('change', motionChanged)
  document.removeEventListener('visibilitychange', visibilityChanged)
})
</script>
<template>
  <figure class="hero-media" :class="{ 'has-video': video }">
    <div ref="stage" class="hero-media-stage">
      <img
        v-if="photo?.sources.length"
        :src="photo.sources.at(-1)?.url"
        :srcset="sourceSet"
        sizes="(max-width: 900px) 100vw, 60vw"
        :width="photo.width ?? undefined"
        :height="photo.height ?? undefined"
        fetchpriority="high"
        :alt="photo.alt"
      />
      <img
        v-else
        :src="gateDay.src"
        :srcset="
          gateDay.sources
            .map((source) => `${source.url} ${source.width}w`)
            .join(', ')
        "
        sizes="(max-width: 900px) 100vw, 60vw"
        :width="gateDay.width"
        :height="gateDay.height"
        fetchpriority="high"
        :alt="gateDay.alt"
      />
      <div
        v-if="video"
        ref="mount"
        class="hero-player"
        :class="{ 'is-ready': ready && !failed }"
      />
      <button
        v-if="video && (!ready || failed)"
        class="hero-start"
        type="button"
        :disabled="!interactive || loading"
        :aria-label="failed ? 'Coba muat ulang video' : 'Putar video kawasan'"
        @click="toggle"
      >
        <AppIcon name="play" />{{
          loading
            ? 'Menyiapkan video…'
            : failed
              ? 'Coba muat ulang video'
              : 'Putar video kawasan'
        }}
      </button>
    </div>
    <figcaption class="hero-media-meta">
      <div>
        <span class="eyebrow">{{
          video ? 'FILM KAWASAN' : 'MENGENAL KAWASAN'
        }}</span>
        <p>{{ video ? title : photo?.alt || gateDay.caption }}</p>
      </div>
      <div v-if="video" class="hero-playback">
        <button
          type="button"
          :disabled="!interactive || loading"
          :aria-label="playing ? 'Jeda video kawasan' : 'Putar video kawasan'"
          @click="toggle"
        >
          <AppIcon :name="playing ? 'pause' : 'play'" />{{
            playing ? 'Jeda' : 'Putar'
          }}
        </button>
        <button
          type="button"
          :disabled="!ready || failed"
          :aria-pressed="!muted"
          aria-label="Suara video"
          @click="toggleSound"
        >
          {{ muted ? 'Aktifkan suara' : 'Bisukan' }}
        </button>
      </div>
    </figcaption>
    <p v-if="video" class="hero-provider">
      YouTube · putar berulang, mulai tanpa suara.
      <NuxtLink to="/privasi">Informasi privasi</NuxtLink
      ><template v-if="failed">
        · Video belum dapat diputar.
        <a
          :href="`https://www.youtube.com/watch?v=${video.id}&t=${video.start}s`"
          target="_blank"
          rel="noopener noreferrer"
          >Buka di YouTube<AppIcon name="external" /></a
        ></template
      >
    </p>
  </figure>
</template>
<style scoped>
.hero-media {
  min-width: 0;
  margin: 0;
}
.hero-media-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #242720;
  overflow: hidden;
}
.hero-media-stage > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.hero-player {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}
.hero-player.is-ready {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}
.hero-player :deep(iframe) {
  display: block;
  border: 0;
  width: 100%;
  height: 100%;
}
.hero-start {
  position: absolute;
  inset: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
  max-width: 90%;
  padding: 16px 20px;
  background: #f7f5eff5;
  color: var(--ink);
  border: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}
.hero-start span {
  font-size: 26px;
}
.hero-media-meta {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 20px;
  padding-top: 18px;
}
.hero-media-meta .eyebrow {
  font-size: 9px;
}
.hero-media-meta p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  max-width: 360px;
}
.hero-playback {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}
.hero-playback button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: transparent;
  font-size: 12px;
  color: var(--ink);
}
.hero-provider {
  margin: 12px 0 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.7;
}
.hero-provider a {
  text-underline-offset: 3px;
}
@media (max-width: 1100px) {
  .hero-media-meta {
    flex-direction: column;
    gap: 12px;
  }
}
@media (max-width: 540px) {
  .hero-media-stage {
    min-height: 200px;
  }
  .hero-media-meta p {
    font-size: 12px;
  }
}
</style>
