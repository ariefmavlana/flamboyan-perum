import { describe, expect, it } from 'vitest'
import { previewHeaders } from '../server/utils/preview-headers'

describe('server-only protected preview access', () => {
  const token = 'a'.repeat(32)+'.'+'b'.repeat(32)+'.'+'c'.repeat(32)
  const host = 'flamboyan-immutable-fixture.vercel.app'
  it('does not add credentials without an explicitly configured token', () => {
    expect(previewHeaders('', 'production', 'https://example.test', '')).toEqual({})
  })
  it('only sends the configured token to the exact immutable preview origin', () => {
    expect(previewHeaders(token, 'preview', `https://${host}`, host)).toEqual({ 'x-vercel-trusted-oidc-idp-token': token })
  })
  it.each([
    [token, 'production', `https://${host}`, host],
    [token, '', `https://${host}`, host],
    [token, 'preview', 'https://other.vercel.app', host],
    [token, 'preview', `http://${host}`, host],
    [token, 'preview', `https://${host}/?secret=x`, host],
    [token, 'preview', 'https://fixture-git-main.vercel.app', 'fixture-git-main.vercel.app'],
    [token, 'preview', 'https://evil.vercel.app.example.test', 'evil.vercel.app.example.test'],
    ['a\r\nx-secret: value', 'preview', `https://${host}`, host],
  ])('fails closed for invalid or non-preview configuration', (value, platform, base, target) => {
    expect(() => previewHeaders(value!, platform!, base!, target!)).toThrow()
  })
})
