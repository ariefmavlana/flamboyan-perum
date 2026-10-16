import type { PublicMedia } from '#shared/types'
import type { ComputedRef } from 'vue'

export function usePhotoCarousel(
  photos: ComputedRef<PublicMedia[]>,
  sizes: string,
  enabled: () => boolean = () => true,
) {
  const stage = ref<HTMLElement | null>(null)
  const index = ref(0)
  const paused = ref(false)
  const motionAllowed = ref(false)
  const visible = ref(false)
  const pageVisible = ref(true)
  const hovered = ref(false)
  const focused = ref(false)
  const loading = ref(false)
  const message = ref('')
  const selected = computed(() => photos.value[index.value] ?? photos.value[0])
  const playing = computed(
    () =>
      photos.value.length > 1 &&
      enabled() &&
      motionAllowed.value &&
      visible.value &&
      pageVisible.value &&
      !paused.value &&
      !hovered.value &&
      !focused.value,
  )
  let observer: IntersectionObserver | undefined
  let motion: MediaQueryList | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let generation = 0

  async function choose(next: number, automatic = false) {
    if (!automatic) paused.value = true
    if (loading.value || next === index.value) return
    const item = photos.value[next]
    if (!item) return
    const current = ++generation
    loading.value = true
    message.value = ''
    const image = new Image()
    image.srcset = item.sources
      .filter((source) => source.width)
      .map((source) => `${source.url} ${source.width}w`)
      .join(', ')
    image.sizes = sizes
    image.src = item.sources.at(-1)?.url ?? ''
    try {
      await image.decode()
      if (current === generation && (!automatic || playing.value))
        index.value = next
    } catch {
      if (current === generation) {
        paused.value = true
        message.value =
          'Foto berikutnya belum dapat dimuat. Coba pilih kembali.'
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  function move(direction: number, automatic = false) {
    if (photos.value.length < 2) return
    void choose(
      (index.value + direction + photos.value.length) % photos.value.length,
      automatic,
    )
  }
  function toggle() {
    paused.value = !paused.value
    if (!paused.value) {
      hovered.value = false
      focused.value = false
    }
  }
  function visibilityChanged() {
    pageVisible.value = !document.hidden
  }
  function motionChanged() {
    motionAllowed.value = !motion?.matches
  }
  function enter(event: PointerEvent) {
    if (event.pointerType === 'mouse') hovered.value = true
  }
  function leave() {
    hovered.value = false
  }
  function focusIn() {
    focused.value = true
  }
  function focusOut(event: FocusEvent) {
    focused.value = !!stage.value?.contains(event.relatedTarget as Node | null)
  }
  watch(playing, (value) => {
    clearInterval(timer)
    if (value) timer = setInterval(() => move(1, true), 6500)
  })
  watch(photos, () => {
    generation++
    loading.value = false
    index.value = 0
    message.value = ''
  })
  onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionChanged()
    motion.addEventListener('change', motionChanged)
    visibilityChanged()
    document.addEventListener('visibilitychange', visibilityChanged)
    if (!stage.value) return
    observer = new IntersectionObserver(
      (entries) => {
        visible.value = entries[0]?.isIntersecting ?? false
      },
      { threshold: 0.2 },
    )
    observer.observe(stage.value)
    stage.value.addEventListener('pointerenter', enter)
    stage.value.addEventListener('pointerleave', leave)
    stage.value.addEventListener('focusin', focusIn)
    stage.value.addEventListener('focusout', focusOut)
  })
  onBeforeUnmount(() => {
    generation++
    clearInterval(timer)
    observer?.disconnect()
    motion?.removeEventListener('change', motionChanged)
    document.removeEventListener('visibilitychange', visibilityChanged)
    stage.value?.removeEventListener('pointerenter', enter)
    stage.value?.removeEventListener('pointerleave', leave)
    stage.value?.removeEventListener('focusin', focusIn)
    stage.value?.removeEventListener('focusout', focusOut)
  })
  return {
    stage,
    index,
    selected,
    paused,
    motionAllowed,
    playing,
    loading,
    message,
    choose,
    move,
    toggle,
  }
}
