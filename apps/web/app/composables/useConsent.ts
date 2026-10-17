import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  hasOptionalConsent,
  isDecided,
  parseConsent,
  serializeConsent,
  type ConsentState,
} from '#shared/utils/consent'

export function useConsent() {
  const config = useRuntimeConfig()
  const state = useState<ConsentState>('consent-state', () => ({
    ...DEFAULT_CONSENT,
  }))
  const open = useState<boolean>('consent-open', () => false)
  const required = computed(
    () => Boolean(config.public.gtmId) || Boolean(config.public.metaPixelId) || String(config.public.attributionEnabled) === 'true',
  )
  const decided = computed(() => isDecided(state.value))
  const allowsOptional = computed(() => hasOptionalConsent(state.value))

  function load() {
    if (!import.meta.client || decided.value) return
    try {
      const stored = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
      if (stored) state.value = stored
    } catch { /* Consent defaults remain denied when storage is unavailable. */ }
  }

  function decide(preferences: { analytics: boolean; marketing: boolean }) {
    state.value = {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      decidedAt: new Date().toISOString(),
    }
    if (import.meta.client) {
      try {
        window.localStorage.setItem(
          CONSENT_STORAGE_KEY,
          serializeConsent(state.value),
        )
      } catch {
        /* Preference still applies for this session without storage. */
      }
    }
    open.value = false
  }

  function requestChange() {
    open.value = true
  }

  return {
    state,
    required,
    decided,
    allowsOptional,
    open,
    load,
    decide,
    requestChange,
  }
}
