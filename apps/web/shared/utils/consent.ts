export const CONSENT_STORAGE_KEY = 'flamboyan-consent-v1'
export const CONSENT_VERSION = 2
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000

export interface ConsentState {
  version: number
  necessary: true
  analytics: boolean
  marketing: boolean
  decidedAt: string | null
}

export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
}

export function parseConsent(raw: string | null | undefined, now = Date.now()): ConsentState | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return null
    const candidate = value as Record<string, unknown>
    if (candidate.version !== CONSENT_VERSION) return null
    if (
      typeof candidate.analytics !== 'boolean' ||
      typeof candidate.marketing !== 'boolean'
    )
      return null
    if (typeof candidate.decidedAt !== 'string' || !candidate.decidedAt)
      return null
    const decidedAt = Date.parse(candidate.decidedAt)
    if (!Number.isFinite(decidedAt) || decidedAt > now + 60_000 || now - decidedAt > CONSENT_MAX_AGE)
      return null
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: candidate.analytics,
      marketing: candidate.marketing,
      decidedAt: candidate.decidedAt,
    }
  } catch {
    return null
  }
}

export function serializeConsent(state: ConsentState): string {
  return JSON.stringify({
    version: state.version,
    analytics: state.analytics,
    marketing: state.marketing,
    decidedAt: state.decidedAt,
  })
}

export function isDecided(state: ConsentState): boolean {
  return typeof state.decidedAt === 'string' && state.decidedAt.length > 0
}

export function hasOptionalConsent(state: ConsentState): boolean {
  return state.analytics || state.marketing
}

export function googleConsentSignals(state: Pick<ConsentState, 'analytics' | 'marketing'>, publicPage = true) {
  return {
    analytics_storage: publicPage && state.analytics ? 'granted' : 'denied',
    ad_storage: publicPage && state.marketing ? 'granted' : 'denied',
    ad_user_data: publicPage && state.marketing ? 'granted' : 'denied',
    ad_personalization: publicPage && state.marketing ? 'granted' : 'denied',
  } as const
}
