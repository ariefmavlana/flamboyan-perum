import { backendOrigin } from '../../shared/utils/api-routing'

export function previewHeaders(token: string, platform: string, base: string, host: string): Record<string, string> {
  if (!token) return {}
  if (platform !== 'preview' || token.length > 16000 || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(token) ||
    !/^[a-z0-9-]+\.vercel\.app$/.test(host) || host.includes('-git-') ||
    backendOrigin(base) !== `https://${host}`)
    throw new Error('Konfigurasi akses preview tidak valid.')
  return { 'x-vercel-trusted-oidc-idp-token': token }
}
