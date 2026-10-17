import { randomBytes } from 'node:crypto'
import { buildContentSecurityPolicy } from '../utils/csp'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    const set = (name: string, value: string) => {
      ;(response.headers ??= {})[name] = value
    }
    set('X-Content-Type-Options', 'nosniff')
    set('X-Frame-Options', 'DENY')
    set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
    )
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
      set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    if (typeof response.body !== 'string') return
    set('Cross-Origin-Opener-Policy', 'same-origin')
    const nonce = randomBytes(24).toString('base64')
    response.body = response.body.replace(
      /<script\b/gi,
      `<script nonce="${nonce}"`,
    )
    set(
      'Content-Security-Policy',
      buildContentSecurityPolicy({
        nonce,
        tourHosts: String(config.tourHosts),
        gtmId: String(config.public.gtmId ?? ''),
        metaPixelId: String(config.public.metaPixelId ?? ''),
        metaViaGtm: String(config.public.metaViaGtm) === 'true',
        upgradeInsecureRequests: String(config.public.siteUrl).startsWith(
          'https://',
        ),
      }),
    )
  })
})
