import { afterEach, describe, expect, it, vi } from 'vitest'
import { getVercelOidcToken } from '@vercel/oidc'
import { protectedPreviewHeaders } from '../server/utils/protected-preview-headers'

vi.mock('@vercel/oidc', () => ({ getVercelOidcToken: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks() })
describe('runtime preview identity', () => {
  const host = 'flamboyan-immutable-fixture.vercel.app'
  const config = { apiPreviewOidc: true, apiBase: `https://${host}`, apiPreviewHost: host }
  it('never reads a platform identity when the feature is off', async () => {
    expect(await protectedPreviewHeaders({ ...config, apiPreviewOidc: false })).toEqual({})
    expect(getVercelOidcToken).not.toHaveBeenCalled()
  })
  it('rejects production before requesting an identity', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(protectedPreviewHeaders(config)).rejects.toThrow()
    expect(getVercelOidcToken).not.toHaveBeenCalled()
  })
  it('fails closed when the runtime identity is missing', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.mocked(getVercelOidcToken).mockResolvedValue('')
    await expect(protectedPreviewHeaders(config)).rejects.toThrow()
  })
  it('forwards only the server runtime identity to the pinned origin', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.mocked(getVercelOidcToken).mockResolvedValue('header.payload.signature')
    expect(await protectedPreviewHeaders(config)).toEqual({ 'x-vercel-trusted-oidc-idp-token': 'header.payload.signature' })
  })
})
