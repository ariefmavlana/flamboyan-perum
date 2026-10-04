import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRealtimeNotifications } from '../app/composables/useRealtimeNotifications'

const harness = vi.hoisted(() => ({
  request: vi.fn(),
  disconnect: vi.fn(),
  subscribed: null as (() => void) | null,
  event: null as ((payload: unknown) => void) | null,
  state: null as ((state: { current: string }) => void) | null,
  cleanup: null as (() => void) | null,
  constructed: vi.fn(),
}))
vi.mock('pusher-js', () => ({
  default: class {
    connection = {
      bind: (_event: string, handler: typeof harness.state) => {
        harness.state = handler
      },
    }
    constructor() {
      harness.constructed()
    }
  },
}))
vi.mock('laravel-echo', () => ({
  default: class {
    disconnect = harness.disconnect
    private() {
      return {
        subscribed(callback: () => void) {
          harness.subscribed = callback
          return this
        },
        listen(_name: string, callback: (event: unknown) => void) {
          harness.event = callback
          return this
        },
        error() {
          return this
        },
      }
    }
  },
}))
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  harness.subscribed = null
  harness.event = null
  harness.state = null
  harness.cleanup = null
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useStaffApi', () => ({ request: harness.request }))
  vi.stubGlobal('onBeforeUnmount', (callback: () => void) => {
    harness.cleanup = callback
  })
  harness.request.mockResolvedValue({
    data: { enabled: true, key: 'public-key', cluster: 'ap1' },
  })
})
afterEach(() => {
  harness.cleanup?.()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Realtime notification reconciliation', () => {
  it('deduplicates events, refreshes on subscription/reconnect and polls while disconnected', async () => {
    const update = vi.fn(async () => {})
    const realtime = useRealtimeNotifications(update, vi.fn())
    await realtime.start(42)
    harness.subscribed?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(update).toHaveBeenCalledTimes(1)
    const notification = { id: '0199af8a-a111-7111-a111-111111111111' }
    harness.event?.(notification)
    harness.event?.(notification)
    await vi.advanceTimersByTimeAsync(0)
    expect(update).toHaveBeenCalledTimes(2)
    harness.state?.({ current: 'disconnected' })
    expect(realtime.state.value).toContain('Koneksi terputus')
    await vi.advanceTimersByTimeAsync(60000)
    expect(update).toHaveBeenCalledTimes(3)
    harness.subscribed?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(update).toHaveBeenCalledTimes(4)
    realtime.stop()
    await vi.advanceTimersByTimeAsync(60000)
    expect(update).toHaveBeenCalledTimes(4)
    expect(harness.disconnect).toHaveBeenCalledTimes(1)
  })
  it('coalesces arriving events into another refresh instead of losing an in-flight update', async () => {
    let release: (() => void) | undefined
    const update = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      )
      .mockResolvedValue(undefined)
    const realtime = useRealtimeNotifications(update, vi.fn())
    await realtime.start(42)
    harness.event?.({ id: '0199af8a-a111-7111-a111-111111111111' })
    harness.event?.({ id: '0199af8a-a111-7111-a111-222222222222' })
    harness.event?.({ id: '0199af8a-a111-7111-a111-333333333333' })
    expect(update).toHaveBeenCalledTimes(1)
    release?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(update).toHaveBeenCalledTimes(2)
  })
  it('stops on session revocation and never starts a connection after unmount', async () => {
    const revoked = vi.fn(async () => {})
    const realtime = useRealtimeNotifications(
      vi.fn().mockRejectedValue({ statusCode: 401 }),
      revoked,
    )
    await realtime.start(42)
    harness.subscribed?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(revoked).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    harness.constructed.mockClear()
    let resolveConfig: ((data: unknown) => void) | undefined
    harness.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfig = resolve
        }),
    )
    const pending = realtime.start(42)
    realtime.stop()
    resolveConfig?.({ data: { enabled: true, key: 'key', cluster: 'ap1' } })
    await pending
    expect(harness.constructed).not.toHaveBeenCalled()
  })
  it('uses a working polling fallback without requiring configured push', async () => {
    harness.request.mockResolvedValue({
      data: { enabled: false, key: null, cluster: null },
    })
    const update = vi.fn(async () => {})
    const realtime = useRealtimeNotifications(update, vi.fn())
    await realtime.start(42)
    await vi.advanceTimersByTimeAsync(60000)
    expect(update).toHaveBeenCalledTimes(1)
    expect(harness.constructed).not.toHaveBeenCalled()
  })
})
