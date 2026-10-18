import { cleanPageLocation, isPublicAcquisitionPath } from '#shared/utils/acquisition'
import { DEFAULT_CONSENT, googleConsentSignals } from '#shared/utils/consent'

type Pixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push?: Pixel
  loaded: boolean
  version: string
}

export default defineNuxtPlugin((nuxt) => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const consent = useConsent()
  const acquisition = useAcquisitionContext()
  const gtmId = /^GTM-[A-Z0-9]+$/.test(String(config.public.gtmId)) ? String(config.public.gtmId) : ''
  const pixelId = /^\d{5,25}$/.test(String(config.public.metaPixelId)) ? String(config.public.metaPixelId) : ''
  const target = window as unknown as {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: Pixel
    _fbq?: Pixel
  }
  let gtmLoaded = false
  let pixelLoaded = false
  let lastPage: string | null = null
  let previousLocation = ''
  let lastConsent = ''
  let lastDecision = ''
  consent.load()

  function google(...args: unknown[]) {
    const queue = target.dataLayer ??= []
    // Google's command queue uses Arguments objects, before the container loads.
    /* eslint-disable prefer-rest-params -- Google's native command protocol uses Arguments objects. */
    target.gtag ??= function () { queue.push(arguments) }
    /* eslint-enable prefer-rest-params */
    target.gtag(...args)
  }

  function loadGtm() {
    if (gtmLoaded) return
    gtmLoaded = true
    ;(target.dataLayer ??= []).push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
    document.head.appendChild(script)
  }

  function loadPixel() {
    if (pixelLoaded) return
    pixelLoaded = true
    if (!target.fbq) {
      const stub = ((...args: unknown[]) => {
        if (stub.callMethod) stub.callMethod(...args)
        else stub.queue.push(args)
      }) as Pixel
      stub.queue = []
      stub.loaded = true
      stub.version = '2.0'
      stub.push = stub
      target.fbq = stub
      target._fbq ??= stub
    }
    target.fbq('init', pixelId)
    target.fbq('consent', 'grant')
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  function pageView() {
    if (!isPublicAcquisitionPath(route.path) || !consent.allowsOptional.value) return
    const location = cleanPageLocation(String(config.public.siteUrl), route.path)
    if (!location || lastPage === location) return
    const referrer = previousLocation
    previousLocation = location
    if (gtmId && gtmLoaded) {
      // Event tags inherit Google's page context independently of dataLayer
      // page_view fields. Refresh it on every public SPA navigation as well.
      google('set', { page_location: location, page_referrer: referrer, send_page_view: false })
      ;(target.dataLayer ??= []).push({
        event: 'page_view',
        page_location: location,
        page_path: route.path,
        page_referrer: referrer,
        flamboyan_public_page: true,
        consent_analytics: consent.state.value.analytics ? 'granted' : 'denied',
        consent_marketing: consent.state.value.marketing ? 'granted' : 'denied',
      })
    }
    if (!gtmId && pixelLoaded && consent.state.value.marketing)
      target.fbq?.('track', 'PageView', { page_location: location })
    if (gtmLoaded || pixelLoaded) lastPage = location
  }

  if (gtmId) {
    google('consent', 'default', googleConsentSignals(DEFAULT_CONSENT))
    google('set', { ads_data_redaction: true, url_passthrough: false })
  }

  function update() {
    const publicPage = isPublicAcquisitionPath(route.path)
    const state = consent.state.value
    const signals = googleConsentSignals(state, publicPage)
    const key = JSON.stringify(signals)
    const decision = JSON.stringify([state.version, state.decidedAt, state.analytics, state.marketing])
    if (lastDecision && lastDecision !== decision) acquisition.clear()
    lastDecision = decision
    acquisition.capture()
    if (gtmId && key !== lastConsent) {
      const location = cleanPageLocation(String(config.public.siteUrl), route.path)
      if (location) google('set', { page_location: location, page_referrer: previousLocation, send_page_view: false })
      google('consent', 'update', signals)
      ;(target.dataLayer ??= []).push({
        event: 'flamboyan_consent_update',
        consent_analytics: signals.analytics_storage,
        consent_marketing: signals.ad_storage,
        flamboyan_public_page: publicPage,
      })
      lastConsent = key
    }
    if (!publicPage || !consent.allowsOptional.value) {
      target.fbq?.('consent', 'revoke')
      lastPage = null
      previousLocation = ''
      return
    }
    if (gtmId) loadGtm()
    else if (pixelId && state.marketing) {
      loadPixel()
      target.fbq?.('consent', 'grant')
    } else if (pixelLoaded) target.fbq?.('consent', 'revoke')
    pageView()
  }

  watch([() => consent.state.value, () => route.path], update, { immediate: true, deep: true, flush: 'post' })
  nuxt.hook('page:finish', () => { acquisition.capture(); pageView() })
})
