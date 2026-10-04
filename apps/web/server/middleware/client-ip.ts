import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { trustedClientIp } from '../../shared/utils/client-ip'

export default defineEventHandler((event) => {
  event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
  event.node.res.setHeader('X-Frame-Options', 'DENY')
  event.node.res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  event.node.res.setHeader('Referrer-Policy', 'no-referrer')
  const config = useRuntimeConfig()
  const secret = String(config.apiProxySecret)
  const remote = event.node.req.socket?.remoteAddress
  const now = Math.floor(Date.now() / 1000)
  if (remote) {
    const trusted = String(config.trustedProxyIps)
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)
    const ip = trustedClientIp(
      remote,
      String(event.node.req.headers['x-forwarded-for'] ?? ''),
      trusted,
    )
    event.context.publicClientIp = isIP(ip) ? ip : remote
    // Internal SSR requestFetch forwards this private signed metadata, never cookies to Laravel public API.
    if (secret.length >= 32) {
      event.node.req.headers['x-flamboyan-ssr-ip'] = String(
        event.context.publicClientIp,
      )
      event.node.req.headers['x-flamboyan-ssr-time'] = String(now)
      event.node.req.headers['x-flamboyan-ssr-signature'] = createHmac(
        'sha256',
        secret,
      )
        .update(`${now}\n${event.context.publicClientIp}`)
        .digest('hex')
    }
  } else if (secret.length >= 32) {
    const ip = String(event.node.req.headers['x-flamboyan-ssr-ip'] ?? '')
    const time = String(event.node.req.headers['x-flamboyan-ssr-time'] ?? '')
    const supplied = String(
      event.node.req.headers['x-flamboyan-ssr-signature'] ?? '',
    )
    const expected = createHmac('sha256', secret)
      .update(`${time}\n${ip}`)
      .digest('hex')
    if (
      isIP(ip) &&
      /^\d+$/.test(time) &&
      Math.abs(now - Number(time)) <= 30 &&
      /^[a-f0-9]{64}$/.test(supplied) &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
    )
      event.context.publicClientIp = ip
  }
  const host = String(event.node.req.headers.host ?? '')
    .split(':')[0]
    ?.toLowerCase()
  const allowed = String(config.allowedHosts)
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
  if (!import.meta.dev && remote && (!host || !allowed.includes(host)))
    throw createError({
      statusCode: 400,
      statusMessage: 'Host tidak diizinkan',
    })
})
