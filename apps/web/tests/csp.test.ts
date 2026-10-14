import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  tourFrameSources,
} from '../server/utils/csp'

const baseline =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'nonce-TEST'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' wss://*.pusher.com https://*.pusher.com; frame-src https://www.youtube-nocookie.com https://www.openstreetmap.org https://my.matterport.com; form-action 'self'"

describe('Content Security Policy builder', () => {
  it('reproduces the current policy exactly when no tracking is configured', () => {
    expect(
      buildContentSecurityPolicy({
        nonce: 'TEST',
        tourHosts: 'my.matterport.com',
      }),
    ).toBe(baseline)
  })
  it('adds only Google hosts and strict-dynamic when GTM is configured', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'TEST',
      tourHosts: 'my.matterport.com',
      gtmId: 'GTM-TEST0',
    })
    expect(policy).toContain(
      "script-src 'self' 'nonce-TEST' 'strict-dynamic' https://www.googletagmanager.com",
    )
    expect(policy).toContain('https://www.google-analytics.com')
    expect(policy).toContain('https://*.analytics.google.com')
    expect(policy).toContain('https://td.doubleclick.net')
    expect(policy).not.toContain('connect.facebook.net')
    expect(policy).toContain(
      'frame-src https://www.youtube-nocookie.com https://www.openstreetmap.org https://my.matterport.com https://td.doubleclick.net',
    )
  })
  it('allows Meta hosts only for a directly configured pixel', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'TEST',
      tourHosts: 'my.matterport.com',
      metaPixelId: '1234567890',
    })
    expect(policy).toContain('https://connect.facebook.net')
    expect(policy).toContain('https://www.facebook.com')
    expect(policy).not.toContain('googletagmanager')
  })
  it('drops entries that are not bare hostnames instead of widening the policy', () => {
    expect(
      tourFrameSources('my.matterport.com, *, https://evil.example, a b'),
    ).toEqual(['https://my.matterport.com'])
    expect(
      buildContentSecurityPolicy({ nonce: 'TEST', tourHosts: '' }).endsWith(
        "frame-src https://www.youtube-nocookie.com https://www.openstreetmap.org; form-action 'self'",
      ),
    ).toBe(true)
  })
})
