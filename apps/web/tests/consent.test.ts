import { describe, expect, it } from 'vitest'
import {
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  hasOptionalConsent,
  isDecided,
  parseConsent,
  serializeConsent,
} from '../shared/utils/consent'

describe('Consent state', () => {
  it('starts undecided with every optional technology denied', () => {
    expect(isDecided(DEFAULT_CONSENT)).toBe(false)
    expect(hasOptionalConsent(DEFAULT_CONSENT)).toBe(false)
    expect(DEFAULT_CONSENT.necessary).toBe(true)
  })
  it('round-trips a decision with its version', () => {
    const serialized = serializeConsent({
      version: CONSENT_VERSION,
      necessary: true,
      analytics: true,
      marketing: false,
      decidedAt: '2026-10-14T00:00:00.000Z',
    })
    const parsed = parseConsent(serialized)
    expect(parsed).not.toBeNull()
    expect(parsed!.analytics).toBe(true)
    expect(parsed!.marketing).toBe(false)
    expect(isDecided(parsed!)).toBe(true)
    expect(hasOptionalConsent(parsed!)).toBe(true)
  })
  it('rejects corrupted, stale, or undecided stored values', () => {
    expect(parseConsent(null)).toBeNull()
    expect(parseConsent('not-json')).toBeNull()
    expect(parseConsent('[]')).toBeNull()
    expect(
      parseConsent(
        JSON.stringify({
          version: CONSENT_VERSION + 1,
          analytics: true,
          marketing: true,
          decidedAt: '2026-10-14T00:00:00.000Z',
        }),
      ),
    ).toBeNull()
    expect(
      parseConsent(
        JSON.stringify({ version: CONSENT_VERSION, analytics: 'yes' }),
      ),
    ).toBeNull()
    expect(
      parseConsent(
        JSON.stringify({
          version: CONSENT_VERSION,
          analytics: true,
          marketing: true,
          decidedAt: null,
        }),
      ),
    ).toBeNull()
  })
})
