<script setup lang="ts">
import type { PublicMedia } from '#shared/types'
const props = defineProps<{ media: PublicMedia[] }>()
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
type ImageKind = 'PHOTO' | 'FLOOR_PLAN'
const images = computed(() =>
  props.media.filter(
    (item) =>
      (item.kind === 'PHOTO' || item.kind === 'FLOOR_PLAN') &&
      item.sources.length > 0,
  ),
)
const groups = computed(() =>
  (
    [
      { kind: 'PHOTO', label: 'Foto' },
      { kind: 'FLOOR_PLAN', label: 'Denah' },
    ] as const
  )
    .map((group) => ({
      ...group,
      count: images.value.filter((item) => item.kind === group.kind).length,
    }))
    .filter((group) => group.count > 0),
)
const activeKind = ref<ImageKind>('PHOTO')
const selectedId = ref<number | null>(null)
const activeImages = computed(() =>
  images.value.filter((item) => item.kind === activeKind.value),
)
const selected = computed(
  () =>
    activeImages.value.find((item) => item.id === selectedId.value) ??
    activeImages.value[0],
)
const activeIndex = computed(() =>
  activeImages.value.findIndex((item) => item.id === selected.value?.id),
)
const preview = ref<HTMLDialogElement | null>(null)
const opener = ref<HTMLButtonElement | null>(null)
watch(
  images,
  () => {
    if (!images.value.some((item) => item.kind === activeKind.value)) {
      activeKind.value = groups.value[0]?.kind ?? 'PHOTO'
    }
    if (!activeImages.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = activeImages.value[0]?.id ?? null
    }
    if (!selected.value) preview.value?.close()
  },
  { immediate: true },
)
function chooseKind(kind: ImageKind) {
  activeKind.value = kind
  selectedId.value = activeImages.value[0]?.id ?? null
}
function moveImage(direction: number) {
  if (activeImages.value.length < 2) return
  const index =
    (activeIndex.value + direction + activeImages.value.length) %
    activeImages.value.length
  selectedId.value = activeImages.value[index]?.id ?? null
}
function handlePreviewKey(event: KeyboardEvent) {
  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select'))
  )
    return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    moveImage(event.key === 'ArrowLeft' ? -1 : 1)
  }
}
const loadedEmbeds = ref<string[]>([])
const embedKey = (item: PublicMedia) => `${item.id}:${item.url}`
const embedGroups = computed(() =>
  [
    {
      kind: 'VIDEO',
      id: 'video-properti',
      title: 'Video properti',
      items: props.media.filter((item) => item.kind === 'VIDEO' && item.url),
    },
    {
      kind: 'TOUR',
      id: 'tur-properti',
      title: 'Virtual tour',
      items: props.media.filter((item) => item.kind === 'TOUR' && item.url),
    },
  ].filter((group) => group.items.length > 0),
)
watch(
  () => props.media,
  () => {
    const available = new Set(props.media.map(embedKey))
    loadedEmbeds.value = loadedEmbeds.value.filter((key) => available.has(key))
  },
)
const brochures = computed(() =>
  props.media.filter(
    (item) => item.kind === 'BROCHURE' && item.sources[0]?.url,
  ),
)
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
  <div id="galeri" class="property-gallery">
    <template v-if="selected">
      <div class="gallery-toolbar">
        <div
          class="gallery-groups"
          role="group"
          aria-label="Jenis gambar properti"
        >
          <button
            v-for="group in groups"
            :key="group.kind"
            type="button"
            :aria-pressed="activeKind === group.kind"
            :disabled="!hydrated"
            @click="chooseKind(group.kind)"
          >
            {{ group.label }} ({{ group.count }})
          </button>
        </div>
        <span class="gallery-hint">Pilih gambar untuk memperbesar ↗</span>
      </div>
      <button
        ref="opener"
        class="gallery-main"
        :class="{ 'is-plan': selected.kind === 'FLOOR_PLAN' }"
        type="button"
        aria-label="Perbesar gambar properti"
        :disabled="!hydrated"
        @click="preview?.showModal()"
      >
        <img
          :src="selected.sources.at(-1)?.url"
          :srcset="srcset(selected)"
          sizes="(max-width: 1280px) 100vw, 1200px"
          :alt="selected.alt"
          :width="selected.width ?? undefined"
          :height="selected.height ?? undefined"
          fetchpriority="high"
        />
      </button>
      <div class="gallery-caption">
        <p>
          {{ selected.kind === 'FLOOR_PLAN' ? 'Denah · ' : ''
          }}{{ selected.alt }}
        </p>
        <span>{{ activeIndex + 1 }} / {{ activeImages.length }}</span>
      </div>
      <div v-if="activeImages.length > 1" class="gallery-thumbs">
        <button
          v-for="item in activeImages"
          :key="item.id"
          type="button"
          :aria-label="`Lihat ${item.alt}`"
          :aria-pressed="selected.id === item.id"
          :disabled="!hydrated"
          :class="{ 'is-plan': item.kind === 'FLOOR_PLAN' }"
          @click="selectedId = item.id"
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
        class="image-dialog gallery-preview"
        aria-label="Gambar properti diperbesar"
        @keydown="handlePreviewKey"
        @close="opener?.focus()"
      >
        <div class="preview-header">
          <span>{{
            selected.kind === 'FLOOR_PLAN' ? 'Denah' : 'Foto properti'
          }}</span>
          <button
            class="button secondary"
            type="button"
            @click="preview?.close()"
          >
            Tutup gambar
          </button>
        </div>
        <div class="preview-image">
          <img
            :src="selected.sources.at(-1)?.url"
            :alt="selected.alt"
            :width="selected.width ?? undefined"
            :height="selected.height ?? undefined"
          />
        </div>
        <div class="preview-footer">
          <p class="preview-caption" aria-live="polite">{{ selected.alt }}</p>
          <div class="preview-controls">
            <button
              type="button"
              aria-label="Gambar sebelumnya"
              :disabled="activeImages.length < 2"
              @click="moveImage(-1)"
            >
              ←
            </button>
            <span>{{ activeIndex + 1 }} / {{ activeImages.length }}</span>
            <button
              type="button"
              aria-label="Gambar berikutnya"
              :disabled="activeImages.length < 2"
              @click="moveImage(1)"
            >
              →
            </button>
          </div>
        </div>
      </dialog>
    </template>
    <div v-else class="detail-visual property-visual">
      <div class="house-line" aria-hidden="true" />
      <p>Foto properti belum tersedia.</p>
    </div>
  </div>
  <section
    v-for="group in embedGroups"
    :id="group.id"
    :key="group.kind"
    class="gallery-media-section"
  >
    <h3>{{ group.title }}</h3>
    <div v-for="item in group.items" :key="item.id" class="media-embed">
      <p>{{ item.alt }}</p>
      <div v-if="!loadedEmbeds.includes(embedKey(item))" class="embed-preview">
        <span class="embed-symbol" aria-hidden="true">{{
          item.kind === 'VIDEO' ? '▷' : '360°'
        }}</span>
        <p>
          {{
            item.kind === 'VIDEO'
              ? 'Lihat hunian dari sudut yang berbeda.'
              : 'Jelajahi ruang, sesuai ritme Anda.'
          }}
        </p>
        <p class="muted">
          Konten dari penyedia eksternal dimuat setelah Anda memilih untuk
          membukanya.
        </p>
        <button
          class="button secondary"
          type="button"
          :disabled="!hydrated"
          @click="loadedEmbeds.push(embedKey(item))"
        >
          Muat {{ item.kind === 'VIDEO' ? 'video' : 'tour' }}
        </button>
      </div>
      <iframe
        v-else
        :src="item.url ?? undefined"
        :title="item.alt"
        loading="lazy"
        referrerpolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="fullscreen; accelerometer; gyroscope"
        allowfullscreen
      />
    </div>
  </section>
  <section
    v-if="brochures.length"
    id="brosur-properti"
    class="gallery-media-section"
  >
    <h3>Brosur properti</h3>
    <p>Simpan informasi hunian untuk dipelajari kembali.</p>
    <a
      v-for="item in brochures"
      :key="item.id"
      :href="item.sources[0]?.url"
      class="button secondary"
      >Unduh {{ item.alt }} (PDF) ↓</a
    >
  </section>
</template>

<style scoped>
.property-gallery,
.gallery-media-section {
  scroll-margin-top: 140px;
  min-width: 0;
}
.gallery-toolbar,
.gallery-caption,
.preview-header,
.preview-footer,
.preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.gallery-toolbar {
  margin-bottom: 16px;
}
.gallery-groups {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}
.gallery-groups button {
  min-height: 44px;
  padding: 10px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}
.gallery-groups button[aria-pressed='true'] {
  border-bottom-color: var(--green);
  color: var(--ink);
}
.gallery-hint,
.gallery-caption {
  font-size: 12px;
  color: var(--muted);
}
.gallery-caption {
  align-items: baseline;
  margin-top: 12px;
}
.gallery-caption p {
  margin: 0;
}
.gallery-caption span {
  white-space: nowrap;
}
.property-gallery .gallery-main.is-plan img {
  height: min(660px, 75dvh);
  object-fit: contain;
  background: #fff;
}
.property-gallery .gallery-thumbs .is-plan img {
  object-fit: contain;
  background: #fff;
}
.gallery-preview {
  width: min(1100px, calc(100vw - 32px));
  height: min(880px, calc(100dvh - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 20px;
  color: var(--ink);
  background: var(--cream);
  border-radius: 0;
}
.gallery-preview[open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
}
.preview-header {
  font-size: 13px;
}
.preview-header .button {
  min-height: 44px;
}
.preview-image {
  min-height: 0;
  min-width: 0;
}
.gallery-preview .preview-image img {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: contain;
}
.preview-caption {
  margin: 0;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.preview-controls {
  flex-shrink: 0;
  gap: 8px;
}
.preview-controls button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  font-size: 24px;
  cursor: pointer;
}
.preview-controls button:disabled {
  opacity: 0.35;
  cursor: default;
}
.preview-controls span {
  min-width: 48px;
  text-align: center;
  font-size: 13px;
}
.gallery-media-section {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}
.gallery-media-section h3 {
  margin-top: 0;
}
.embed-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(24px, 5vw, 64px);
  text-align: center;
  background: #eee9df;
}
.embed-symbol {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 1px solid #b5a795;
  border-radius: 50%;
  font-size: 26px;
}
.embed-preview p {
  max-width: 48ch;
  margin: 12px 0 0;
}
.embed-preview .button {
  margin-top: 24px;
}
@media (max-width: 600px) {
  .gallery-hint {
    display: none;
  }
  .gallery-preview {
    padding: 12px;
  }
  .preview-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }
  .preview-caption {
    max-height: 6em;
    overflow: auto;
  }
  .preview-controls {
    justify-content: center;
  }
  .preview-header {
    gap: 8px;
  }
  .preview-header .button {
    padding-inline: 12px;
  }
}
</style>
