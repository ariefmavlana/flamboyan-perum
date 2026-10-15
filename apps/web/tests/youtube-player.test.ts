import { afterEach, describe, expect, it, vi } from 'vitest'

function environment() {
  const scripts: {
    src: string
    async: boolean
    nonce: string
    onerror: (() => void) | null
    remove: ReturnType<typeof vi.fn>
  }[] = []
  vi.stubGlobal('window', { setTimeout })
  vi.stubGlobal('document', {
    createElement: () => {
      const script = {
        src: '',
        async: false,
        nonce: '',
        onerror: null as (() => void) | null,
        remove: vi.fn(),
      }
      scripts.push(script)
      return script
    },
    querySelector: () => ({ nonce: 'TEST-NONCE' }),
    head: { append: vi.fn() },
  })
  return scripts
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.resetModules()
})

describe('YouTube SDK loading', () => {
  it('shares one request, preserves CSP nonce, and permits retry after a failed request', async () => {
    const scripts = environment()
    const { loadYouTubePlayer } = await import('../app/utils/youtube-player')
    const first = loadYouTubePlayer()
    expect(loadYouTubePlayer()).toBe(first)
    expect(scripts).toHaveLength(1)
    expect(scripts[0]?.src).toBe('https://www.youtube.com/iframe_api')
    expect(scripts[0]?.nonce).toBe('TEST-NONCE')
    const rejection = expect(first).rejects.toThrow('belum dapat dimuat')
    scripts[0]?.onerror?.()
    await rejection
    expect(scripts[0]?.remove).toHaveBeenCalledOnce()
    const retry = loadYouTubePlayer()
    expect(retry).not.toBe(first)
    expect(scripts).toHaveLength(2)
    const retryRejection = expect(retry).rejects.toThrow()
    scripts[1]?.onerror?.()
    await retryRejection
  })
  it('times out a blocked SDK request so the UI can return to the poster', async () => {
    vi.useFakeTimers()
    const scripts = environment()
    const { loadYouTubePlayer } = await import('../app/utils/youtube-player')
    const request = loadYouTubePlayer()
    const rejection = expect(request).rejects.toThrow('belum dapat dimuat')
    await vi.advanceTimersByTimeAsync(15000)
    await rejection
    expect(scripts[0]?.remove).toHaveBeenCalledOnce()
  })
})
