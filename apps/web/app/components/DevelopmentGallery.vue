<script setup lang="ts">
import type { DevelopmentImage } from '#shared/content/flamboyan-assets'
const props = defineProps<{ images: DevelopmentImage[]; label: string }>()
const hydrated = ref(false)
const selectedIndex = ref<number | null>(null)
const selected = computed(() =>
  selectedIndex.value === null ? undefined : props.images[selectedIndex.value],
)
const preview = ref<HTMLDialogElement | null>(null)
let opener: HTMLButtonElement | null = null
onMounted(() => {
  hydrated.value = true
})
async function openImage(index: number, event: MouseEvent) {
  opener = event.currentTarget as HTMLButtonElement
  selectedIndex.value = index
  await nextTick()
  preview.value?.showModal()
}
function closeImage() {
  selectedIndex.value = null
  opener?.focus()
}
function moveImage(direction: number) {
  if (selectedIndex.value === null || props.images.length < 2) return
  selectedIndex.value =
    (selectedIndex.value + direction + props.images.length) %
    props.images.length
}
function handlePreviewKey(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    const controls = preview.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href]',
    )
    const first = controls?.[0]
    const last = controls?.[controls.length - 1]
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    }
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    moveImage(event.key === 'ArrowLeft' ? -1 : 1)
  }
}
const srcset = (image: DevelopmentImage) =>
  image.sources.map((source) => `${source.url} ${source.width}w`).join(', ')
</script>
<template>
  <div
    class="development-gallery"
    :class="{ 'single-image': images.length === 1 }"
  >
    <figure
      v-for="(image, index) in images"
      :key="image.key"
      :data-asset-key="image.key"
    >
      <button
        type="button"
        :aria-label="`Perbesar ${image.alt}`"
        :disabled="!hydrated"
        :class="{ 'is-plan': image.category === 'siteplan' }"
        @click="openImage(index, $event)"
      >
        <img
          :src="image.src"
          :srcset="srcset(image)"
          :sizes="
            images.length === 1
              ? '(max-width: 1280px) 100vw, 1200px'
              : '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw'
          "
          :width="image.width"
          :height="image.height"
          :alt="image.alt"
          loading="lazy"
        />
        <span class="development-zoom" aria-hidden="true"
          ><AppIcon name="search" /></span
        >
      </button>
      <figcaption>{{ image.caption }}</figcaption>
    </figure>
  </div>
  <dialog
    ref="preview"
    class="image-dialog development-preview"
    :aria-label="`${label} diperbesar`"
    @keydown="handlePreviewKey"
    @close="closeImage"
  >
    <template v-if="selected">
      <div class="development-preview-heading">
        <span>{{ label }}</span>
        <button
          type="button"
          class="button secondary"
          @click="preview?.close()"
        >
          Tutup gambar
        </button>
      </div>
      <div class="development-preview-image">
        <img
          :src="selected.sources.at(-1)?.url ?? selected.src"
          :width="selected.width"
          :height="selected.height"
          :alt="selected.alt"
        />
      </div>
      <div class="development-preview-footer">
        <p aria-live="polite">{{ selected.caption }}</p>
        <a
          v-if="selected.category === 'siteplan'"
          :href="selected.sources.at(-1)?.url ?? selected.src"
          target="_blank"
          rel="noopener noreferrer"
          class="text-link"
          >Buka siteplan ukuran penuh<AppIcon name="external" /></a
        >
        <div class="development-preview-controls">
          <button
            type="button"
            aria-label="Gambar sebelumnya"
            :disabled="images.length < 2"
            @click="moveImage(-1)"
          >
            <AppIcon name="chevron-left" />
          </button>
          <span>{{ (selectedIndex ?? 0) + 1 }} / {{ images.length }}</span>
          <button
            type="button"
            aria-label="Gambar berikutnya"
            :disabled="images.length < 2"
            @click="moveImage(1)"
          >
            <AppIcon name="chevron-right" />
          </button>
        </div>
      </div>
    </template>
  </dialog>
</template>
<style scoped>
.development-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 32px 24px;
}
.development-gallery.single-image {
  grid-template-columns: minmax(0, 1fr);
}
.development-gallery figure {
  margin: 0;
  min-width: 0;
}
.development-gallery button {
  display: block;
  position: relative;
  width: 100%;
  padding: 0;
  border: 0;
  background: var(--cream);
  cursor: pointer;
}
.development-gallery img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}
.development-gallery .is-plan img {
  max-height: 680px;
  background: #fff;
}
.development-zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: #f7f5efee;
  color: var(--ink);
}
.development-gallery figcaption {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--muted);
}
.development-preview {
  width: min(1200px, calc(100vw - 32px));
  height: min(940px, calc(100dvh - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 24px;
  color: var(--ink);
  background: var(--cream);
  border-radius: 0;
}
.development-preview[open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
}
.development-preview-heading,
.development-preview-footer,
.development-preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
}
.development-preview-heading .button {
  flex-shrink: 0;
  min-height: 44px;
}
.development-preview-image {
  min-height: 0;
  min-width: 0;
}
.development-preview .development-preview-image img {
  width: 100%;
  height: 100%;
  max-height: none;
  max-width: none;
  object-fit: contain;
}
.development-preview-footer p {
  margin: 0;
  line-height: 1.5;
}
.development-preview-controls {
  flex-shrink: 0;
  gap: 8px;
}
.development-preview-controls button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  font-size: 24px;
  cursor: pointer;
}
.development-preview-controls button:disabled {
  opacity: 0.35;
}
.development-preview-controls span {
  min-width: 48px;
  text-align: center;
}
@media (max-width: 1000px) {
  .development-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .development-gallery {
    grid-template-columns: minmax(0, 1fr);
  }
  .development-preview {
    padding: 12px;
  }
  .development-preview-heading {
    gap: 8px;
  }
  .development-preview-heading .button {
    padding-inline: 12px;
  }
  .development-preview-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }
  .development-preview-footer p {
    max-height: 6em;
    overflow: auto;
  }
  .development-preview-controls {
    justify-content: center;
  }
}
</style>
