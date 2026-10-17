import { afterEach, describe, expect, it, vi } from 'vitest'
import { acquisitionTouch, campaignValue, cleanPageLocation, nextAcquisitionContext, parseAcquisitionContext } from '../shared/utils/acquisition'
import { apiRoute, backendOrigin } from '../shared/utils/api-routing'
import { freshIdempotencyKey, jakartaPreferenceToIso, normalizeWhatsappInput } from '../shared/utils/inquiries'
import { CONSENT_MAX_AGE, CONSENT_VERSION, googleConsentSignals, parseConsent } from '../shared/utils/consent'
import { catalogSeo } from '../shared/utils/seo'

afterEach(() => vi.unstubAllGlobals())

describe('acquisition boundaries', () => {
  const now = Date.parse('2026-10-17T00:00:00Z')
  const touch = acquisitionTouch({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'bfi2_bandung', utm_term: 'rumah bandung', gclid: 'discard-me' }, now)!
  it('keeps first and last non-direct touches and rejects expired/reversed context', () => {
    expect(touch.term).toBe('rumah bandung')
    expect(touch).not.toHaveProperty('gclid')
    const first = nextAcquisitionContext(null, touch)!
    expect(nextAcquisitionContext(first, null)).toEqual(first)
    const last = { ...touch, source: 'instagram', captured_at: new Date(now + 1000).toISOString() }
    const updated = nextAcquisitionContext(first, last)!
    expect(updated.first_touch.source).toBe('google')
    expect(updated.last_touch.source).toBe('instagram')
    expect(parseAcquisitionContext(JSON.stringify(updated), now + 2000)).toEqual(updated)
    expect(parseAcquisitionContext(JSON.stringify(updated), now + 31 * 86400000)).toBeNull()
    expect(parseAcquisitionContext(JSON.stringify({ ...updated, first_touch: last, last_touch: touch }), now + 2000)).toBeNull()
  })
  it('drops PII, URLs, arrays and private page locations', () => {
    for (const value of ['budi@example.com', '0812-3456-7890', 'https://example.com', ['google']]) expect(campaignValue(value)).toBeUndefined()
    expect(cleanPageLocation('https://example.com', '/konsultasi?email=private#secret')).toBe('https://example.com/konsultasi')
    expect(cleanPageLocation('https://example.com', '/backoffice/hasil?lead=1')).toBeNull()
    expect(cleanPageLocation('https://example.com', '/reset-password')).toBeNull()
  })
  it('fails closed without random crypto and rejects invalid calendar/contact input', () => {
    vi.stubGlobal('crypto', undefined)
    expect(() => freshIdempotencyKey()).toThrow('HTTPS')
    expect(jakartaPreferenceToIso('2026-02-31T12:00')).toBeNull()
    expect(jakartaPreferenceToIso('2026-10-20T25:00')).toBeNull()
    expect(normalizeWhatsappInput('Budi08123456789')).toBe('')
  })
})

describe('portable route allowlist', () => {
  it('bounds methods, auth paths and traversal attempts', () => {
    expect(apiRoute('/api/v1/internal/inquiries/1/resolve', 'POST')).toEqual({ kind: 'private' })
    expect(apiRoute('/api/v1/inquiries', 'POST')).toEqual({ kind: 'public' })
    expect(apiRoute('/api/v1/internal/leads/12/attribution', 'PATCH')).toEqual({ kind: 'private' })
    expect(apiRoute('/api/v1/internal/inquiries/1/resolve', 'GET')).toEqual({ error: 405 })
    for (const path of ['/api/v1/admin', '/api/v1/../admin', '/api/v1/%252e%252e', '/api//v1/leads', '/api/v1/leads/1/erase']) expect(apiRoute(path, 'POST')).toEqual({ error: 404 })
    expect(apiRoute('/properti', 'GET')).toBeNull()
    expect(backendOrigin('https://api.example.com')).toBe('https://api.example.com')
    for (const origin of ['http://api.example.com', 'https://user:pass@api.example.com', 'https://api.example.com/path', 'https://api.example.com?target=other']) expect(() => backendOrigin(origin)).toThrow()
  })
})

describe('consent lifetime and independent storage signals', () => {
  it('expires stale consent and denies all signals on private pages', () => {
    const now = Date.now()
    const state = { version: CONSENT_VERSION, necessary: true as const, analytics: true, marketing: false, decidedAt: new Date(now).toISOString() }
    expect(googleConsentSignals(state).analytics_storage).toBe('granted')
    expect(googleConsentSignals(state).ad_user_data).toBe('denied')
    expect(googleConsentSignals(state, false).analytics_storage).toBe('denied')
    expect(parseConsent(JSON.stringify({ ...state, decidedAt: new Date(now - CONSENT_MAX_AGE - 1000).toISOString() }))).toBeNull()
  })
})

describe('catalog canonical matrix', () => {
  it('keeps pagination distinct while stripping tracking and noindexing filters', () => {
    expect(catalogSeo('https://example.com', { page: '2', utm_source: 'google' }).canonical).toBe('https://example.com/properti?page=2')
    expect(catalogSeo('https://example.com', { utm_campaign: 'bfi2', gclid: 'private' }).robots).toBe('index, follow')
    expect(catalogSeo('https://example.com', { location: 'Bandung' }).robots).toBe('noindex, follow')
    expect(catalogSeo('https://example.com', { email: 'private@example.com' }).canonical).not.toContain('private')
  })
})
