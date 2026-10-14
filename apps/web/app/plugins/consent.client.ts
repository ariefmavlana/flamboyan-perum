export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const consent = useConsent()
  const gtmId = String(config.public.gtmId ?? '')
  const pixelId = String(config.public.metaPixelId ?? '')
  consent.load()
  let gtmLoaded = false
  let pixelLoaded = false

  function dataLayer(): unknown[] {
    const target = window as unknown as { dataLayer?: unknown[] }
    target.dataLayer ??= []
    return target.dataLayer
  }

  function loadGtm() {
    if (gtmLoaded) return
    gtmLoaded = true
    dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
    document.head.appendChild(script)
  }

  function loadPixel() {
    if (pixelLoaded) return
    pixelLoaded = true
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    script.onload = () => {
      const target = window as unknown as {
        fbq?: (...args: unknown[]) => void
      }
      target.fbq?.('init', pixelId)
      target.fbq?.('track', 'PageView')
    }
    document.head.appendChild(script)
  }

  if (gtmId && pixelId)
    console.warn(
      '[flamboyan] GTM dan Meta Pixel sama-sama aktif. Pastikan Pixel tidak juga dikonfigurasi di dalam container GTM agar PageView tidak terhitung ganda.',
    )

  watchEffect(() => {
    const state = consent.state.value
    if (!consent.decided.value) return
    if (!gtmId && !pixelId) return
    dataLayer().push({
      event: 'flamboyan_consent_update',
      consent_analytics: state.analytics ? 'granted' : 'denied',
      consent_marketing: state.marketing ? 'granted' : 'denied',
    })
    if (gtmId && consent.allowsOptional.value) loadGtm()
    if (pixelId && !gtmId && state.marketing) loadPixel()
  })
})
