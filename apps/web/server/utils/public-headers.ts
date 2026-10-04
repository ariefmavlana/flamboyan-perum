import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export function publicHeaders(
  event: Parameters<typeof getQuery>[0],
  method: 'GET' | 'POST',
  path: string,
): Record<string, string> {
  const secret = String(useRuntimeConfig().apiProxySecret)
  const ip = String(event.context.publicClientIp ?? '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (secret.length >= 32 && isIP(ip)) {
    const time = String(Math.floor(Date.now() / 1000))
    headers['X-Flamboyan-Client-IP'] = ip
    headers['X-Flamboyan-Proxy-Time'] = time
    headers['X-Flamboyan-Proxy-Signature'] = createHmac('sha256', secret)
      .update(`${method}\n${path}\n${time}\n${ip}`)
      .digest('hex')
  }
  return headers
}
