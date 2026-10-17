import {
  analyticsDedupeKey,
  buildAnalyticsEvent,
  type AnalyticsContext,
  type AnalyticsEvent,
} from '#shared/utils/analytics'
import { isPublicAcquisitionPath } from '#shared/utils/acquisition'

export function useAnalytics() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const consent = useConsent()
  const acquisition = useAcquisitionContext()
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
    if (!configured.value || !consent.allowsOptional.value || !isPublicAcquisitionPath(route.path)) return
    if (pixelsOnly.value && !consent.state.value.marketing) return
    acquisition.capture()
    const touch = acquisition.context.value?.last_touch
    const enriched = {
      ...(touch ? { traffic_source: touch.source, traffic_medium: touch.medium, campaign_id: touch.campaign } : {}),
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
    if (pixelsOnly.value && consent.state.value.marketing && typeof target.fbq === 'function') {
      if (event === 'view_property') target.fbq('track', 'ViewContent', payload)
      else target.fbq('trackCustom', event, payload)
    }
    if (options.once) fired.value = { ...fired.value, [key]: true }
  }

  return { track }
}
