import { randomBytes } from 'node:crypto'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    const set = (name: string, value: string) => {
      ;(response.headers ??= {})[name] = value
    }
    set('X-Content-Type-Options', 'nosniff')
    set('X-Frame-Options', 'DENY')
    set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    const path = event.node?.req?.url?.split('?')[0] ?? ''
    set(
      'Referrer-Policy',
      /^\/(forgot-password|reset-password)(\/|$)/.test(path)
        ? 'no-referrer'
        : /^\/(login|backoffice)(\/|$)/.test(path)
          ? 'same-origin'
          : 'strict-origin-when-cross-origin',
    )
    if (import.meta.dev) return
    const config = useRuntimeConfig()
    if (String(config.public.siteUrl).startsWith('https://'))
      set('Strict-Transport-Security', 'max-age=31536000')
    if (typeof response.body !== 'string') return
    const nonce = randomBytes(24).toString('base64')
    response.body = response.body.replace(
      /<script\b/gi,
      `<script nonce="${nonce}"`,
    )
    set(
      'Content-Security-Policy',
      `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' wss://*.pusher.com https://*.pusher.com; frame-src https://www.youtube-nocookie.com https://www.openstreetmap.org ${String(
        config.tourHosts,
      )
        .split(',')
        .map((host) => host.trim())
        .filter((host) => /^[a-z0-9.-]+$/.test(host))
        .map((host) => `https://${host}`)
        .join(' ')}; form-action 'self'`,
    )
  })
})
