import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export async function publicHeaders(
  event: Parameters<typeof getQuery>[0],
  method: 'GET' | 'POST',
  path: string,
): Promise<Record<string, string>> {
  const config = useRuntimeConfig()
  const secret = String(config.apiProxySecret)
  const ip = String(event.context.publicClientIp ?? '')
  let preview: Record<string, string>
  try { preview = await protectedPreviewHeaders(config) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Akses preview belum tersedia.' }) }
  const headers: Record<string, string> = { Accept: 'application/json', ...preview }
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
