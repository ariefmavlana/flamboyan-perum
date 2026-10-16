import { afterEach, expect, it, vi } from 'vitest'
import { computed, effectScope, nextTick, ref, watch } from 'vue'
import type { PublicMedia } from '../shared/types'
import { usePhotoCarousel } from '../app/composables/usePhotoCarousel'

const disposers: (() => void)[] = []
function carousel(reducedMotion = false) {
  vi.useFakeTimers()
  let mount = () => {}
  let intersection: (entries: { isIntersecting: boolean }[]) => void = () => {}
  const disconnect = vi.fn()
  const motion = new EventTarget()
  Object.assign(motion, { matches: reducedMotion })
  const document = Object.assign(new EventTarget(), { hidden: false })
  const decode = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', (callback: () => void) => {
    mount = callback
  })
  vi.stubGlobal('onBeforeUnmount', (callback: () => void) =>
    disposers.push(callback),
  )
  vi.stubGlobal('window', { matchMedia: () => motion })
  vi.stubGlobal('document', document)
  vi.stubGlobal(
    'Image',
    class {
      decode = decode
    },
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof intersection) {
        intersection = callback
      }
      observe() {}
      disconnect = disconnect
    },
  )
  const photos = ref(
    [1, 2].map((id): PublicMedia => ({
      id,
      kind: 'PHOTO',
      alt: `Foto ${id}`,
      position: id,
      url: null,
      width: 800,
      height: 600,
      sources: [{ url: `/photo-${id}.webp`, width: 800, height: 600 }],
    })),
  )
  const scope = effectScope()
  const enabled = ref(true)
  const result = scope.run(() =>
    usePhotoCarousel(
      computed(() => photos.value),
      '800px',
      () => enabled.value,
    ),
  )!
  const stage = Object.assign(new EventTarget(), { contains: () => false })
  result.stage.value = stage as unknown as HTMLElement
  mount()
  intersection([{ isIntersecting: true }])
  disposers.push(() => scope.stop())
  return {
    ...result,
    decode,
    stage,
    motion,
    document,
    photos,
    enabled,
    disconnect,
    intersection,
  }
}

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('decodes the next photo before switching and loops from last to first', async () => {
  const gallery = carousel()
  await nextTick()
  let decoded = () => {}
  gallery.decode.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        decoded = resolve
      }),
  )
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(0)
  expect(gallery.loading.value).toBe(true)
  decoded()
  await nextTick()
  expect(gallery.index.value).toBe(1)
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(0)
})

it('pauses for keyboard focus, hidden tabs, offscreen content and explicit pause', async () => {
  const gallery = carousel()
  await nextTick()
  gallery.stage.dispatchEvent(new Event('focusin'))
  await vi.advanceTimersByTimeAsync(13000)
  expect(gallery.index.value).toBe(0)
  gallery.stage.dispatchEvent(
    Object.assign(new Event('focusout'), { relatedTarget: null }),
  )
  await nextTick()
  gallery.document.hidden = true
  gallery.document.dispatchEvent(new Event('visibilitychange'))
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(0)
  gallery.document.hidden = false
  gallery.document.dispatchEvent(new Event('visibilitychange'))
  gallery.intersection([{ isIntersecting: false }])
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(0)
  gallery.intersection([{ isIntersecting: true }])
  gallery.toggle()
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(0)
  gallery.toggle()
  await vi.advanceTimersByTimeAsync(6500)
  expect(gallery.index.value).toBe(1)
})

it('keeps reduced-motion and floor-plan mode manual while permitting image selection', async () => {
  const gallery = carousel(true)
  await vi.advanceTimersByTimeAsync(13000)
  expect(gallery.index.value).toBe(0)
  await gallery.choose(1)
  expect(gallery.index.value).toBe(1)
  Object.assign(gallery.motion, { matches: false })
  gallery.motion.dispatchEvent(new Event('change'))
  gallery.enabled.value = false
  gallery.toggle()
  await vi.advanceTimersByTimeAsync(13000)
  expect(gallery.index.value).toBe(1)
})

it('retains the current photo on decode failure and recovers on manual retry', async () => {
  const gallery = carousel()
  gallery.decode.mockRejectedValueOnce(new Error('unavailable'))
  await gallery.choose(1)
  expect(gallery.index.value).toBe(0)
  expect(gallery.paused.value).toBe(true)
  expect(gallery.message.value).toContain('belum dapat dimuat')
  await gallery.choose(1)
  expect(gallery.index.value).toBe(1)
  expect(gallery.message.value).toBe('')
  expect(gallery.loading.value).toBe(false)
})
