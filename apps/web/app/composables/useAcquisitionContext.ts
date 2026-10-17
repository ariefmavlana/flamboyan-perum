import {
  ATTRIBUTION_STORAGE_KEY,
  acquisitionTouch,
  isPublicAcquisitionPath,
  nextAcquisitionContext,
  parseAcquisitionContext,
  type AcquisitionContext,
} from '#shared/utils/acquisition'

export function useAcquisitionContext() {
  const config = useRuntimeConfig()
  const consent = useConsent()
  const route = useRoute()
  const context = useState<AcquisitionContext | null>('acquisition-context', () => null)

  const allowed = computed(
    () => String(config.public.attributionEnabled) === 'true' && consent.allowsOptional.value,
  )

  function clear() {
    context.value = null
    if (import.meta.client) {
      try { window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY) } catch { /* unavailable storage */ }
    }
  }

  function capture() {
    if (!import.meta.client) return
    if (!allowed.value) { clear(); return }
    if (!isPublicAcquisitionPath(route.path)) return
    let previous = context.value
    try { previous = parseAcquisitionContext(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)) } catch { /* session-only context */ }
    const touch = acquisitionTouch(route.query as Record<string, unknown>)
    if (touch && previous?.last_touch.source === touch.source &&
      previous.last_touch.medium === touch.medium && previous.last_touch.campaign === touch.campaign &&
      previous.last_touch.content === touch.content && previous.last_touch.term === touch.term) {
      context.value = previous
      return
    }
    context.value = nextAcquisitionContext(previous, touch)
    if (context.value) {
      try { window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(context.value)) } catch { /* no PII; session-only fallback */ }
    }
  }

  async function submissionAttribution(): Promise<string | null> {
    capture()
    if (!allowed.value || !context.value) return null
    try {
      const response = await $fetch<{ data: { token: string } }>('/api/v1/inquiries/context', {
        method: 'POST',
        body: {
          first_touch: context.value.first_touch,
          last_touch: context.value.last_touch,
          consent: {
            analytics: consent.state.value.analytics,
            marketing: consent.state.value.marketing,
            decided_at: consent.state.value.decidedAt,
            version: String(consent.state.value.version),
          },
        },
      })
      return typeof response.data?.token === 'string' ? response.data.token : null
    } catch {
      // Missing optional attribution must never prevent a consultation request.
      return null
    }
  }

  return { context, allowed, capture, clear, submissionAttribution }
}
