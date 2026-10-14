import {
  analyticsDedupeKey,
  buildAnalyticsEvent,
  campaignContext,
  type AnalyticsContext,
  type AnalyticsEvent,
} from '#shared/utils/analytics'

export function useAnalytics() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const consent = useConsent()
  const fired = useState<Record<string, true>>('analytics-fired', () => ({}))

  const configured = computed(
    () => Boolean(config.public.gtmId) || Boolean(config.public.metaPixelId),
  )
  const pixelsOnly = computed(
    () => Boolean(config.public.metaPixelId) && !config.public.gtmId,
  )

  function track(
    event: AnalyticsEvent,
    context: AnalyticsContext = {},
    options: { once?: boolean } = {},
  ) {
    if (!import.meta.client) return
    if (!configured.value || !consent.allowsOptional.value) return
    const enriched = {
      ...campaignContext(route.query as Record<string, unknown>),
      ...context,
    }
    const key = analyticsDedupeKey(event, enriched)
    if (options.once && fired.value[key]) return
    const payload = buildAnalyticsEvent(event, enriched)
    const target = window as unknown as {
      dataLayer?: unknown[]
      fbq?: (...args: unknown[]) => void
    }
    ;(target.dataLayer ??= []).push(payload)
    if (pixelsOnly.value && typeof target.fbq === 'function') {
      if (event === 'view_property') target.fbq('track', 'ViewContent', payload)
      else target.fbq('trackCustom', event, payload)
    }
    if (options.once) fired.value = { ...fired.value, [key]: true }
  }

  return { track }
}
