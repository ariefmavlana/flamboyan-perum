import { apiRoute, backendOrigin } from '../../shared/utils/api-routing'
import { boundedBody } from './bounded-body'

export async function apiBridge(event: Parameters<typeof getQuery>[0]) {
  const url = getRequestURL(event)
  const rawPath = (event.node.req.url ?? '').split('?', 1)[0] ?? ''
  const route = apiRoute(rawPath || url.pathname, event.method)
  if (!route) return
  if (route.error) throw createError({ statusCode: route.error })
  if (route.kind === 'public' || route.kind === 'local') return
  let origin: string
  try { origin = backendOrigin(String(useRuntimeConfig().apiBase)) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Konfigurasi layanan belum tersedia.' }) }
  const config = useRuntimeConfig()
  let preview: Record<string, string>
  try { preview = await protectedPreviewHeaders(config) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Akses preview belum tersedia.' }) }
  const headers: Record<string, string> = { accept: 'application/json', ...preview }
  if (route.kind === 'private') {
    for (const name of ['cookie', 'origin', 'referer', 'x-xsrf-token', 'content-type']) {
      const value = getRequestHeader(event, name)
      if (value) headers[name] = value
    }
    const ip = String(event.context.publicClientIp ?? '')
    if (ip) headers['x-forwarded-for'] = ip
    headers['x-forwarded-proto'] = url.protocol.replace(':', '')
    headers['x-forwarded-host'] = url.host
  }
  const body = ['POST', 'PATCH', 'PUT'].includes(event.method)
    ? await boundedBody(event, /\/(?:media|logo)(?:\/|$)/.test(url.pathname) ? 12 * 1024 * 1024 : 64 * 1024)
    : undefined
  if (route.kind !== 'media') setHeader(event, 'Cache-Control', 'no-store')
  return sendProxy(event, `${origin}${url.pathname}${url.search}`, {
    fetchOptions: { method: event.method, headers, body: body ? new Uint8Array(body) : undefined, redirect: 'manual', signal: AbortSignal.timeout(15_000) },
    onResponse: (_event, response) => {
      if (route.kind !== 'media') setHeader(event, 'Cache-Control', 'no-store')
      if (response.status >= 300 && response.status < 400)
        throw createError({ statusCode: 502, statusMessage: 'Pengalihan layanan tidak diizinkan.' })
    },
  })
}
