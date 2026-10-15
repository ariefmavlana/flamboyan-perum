export interface YouTubePlayer {
  playVideo(): void
  pauseVideo(): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getIframe(): HTMLIFrameElement
  destroy(): void
}

interface PlayerEvent {
  target: YouTubePlayer
  data: number
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      host: string
      videoId: string
      width: string
      height: string
      playerVars: Record<string, string | number>
      events: {
        onReady(event: PlayerEvent): void
        onStateChange(event: PlayerEvent): void
        onError(event: PlayerEvent): void
        onAutoplayBlocked(event: PlayerEvent): void
      }
    },
  ) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let pending: Promise<YouTubeApi> | undefined

export function loadYouTubePlayer(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const previous = window.onYouTubeIframeAPIReady
    const timeout = window.setTimeout(fail, 15000)
    function fail() {
      clearTimeout(timeout)
      script.remove()
      pending = undefined
      reject(new Error('Pemutar YouTube belum dapat dimuat.'))
    }
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT?.Player) {
        clearTimeout(timeout)
        resolve(window.YT)
      }
    }
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.nonce =
      document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ?? ''
    script.onerror = fail
    document.head.append(script)
  })
  return pending
}
