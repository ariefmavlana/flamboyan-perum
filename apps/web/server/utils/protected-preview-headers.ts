import { getVercelOidcToken } from '@vercel/oidc'
import { previewHeaders } from './preview-headers'

export async function protectedPreviewHeaders(config: { apiPreviewOidc: unknown; apiBase: unknown; apiPreviewHost: unknown }): Promise<Record<string, string>> {
  if (String(config.apiPreviewOidc) !== 'true') return {}
  if (process.env.VERCEL_ENV !== 'preview') throw new Error('Akses OIDC hanya untuk preview.')
  const token = await getVercelOidcToken()
  if (!token) throw new Error('Identitas preview tidak tersedia.')
  return previewHeaders(token, 'preview', String(config.apiBase), String(config.apiPreviewHost))
}
