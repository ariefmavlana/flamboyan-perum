import { boundedBody } from './bounded-body'
import { backendOrigin } from '../../shared/utils/api-routing'

export async function inquiryApi(event: Parameters<typeof getQuery>[0], operation: 'options' | 'context' | 'submit') {
  const method = operation === 'options' ? 'GET' : 'POST'
  const path = operation === 'submit' ? '/api/v1/inquiries' : `/api/v1/inquiries/${operation}`
  setHeader(event, 'Cache-Control', 'no-store')
  const headers = publicHeaders(event, method, path)
  let body: Record<string, unknown> | undefined
  if (method === 'POST') {
    const origin = getRequestHeader(event, 'origin')
    if (!origin || origin !== getRequestURL(event).origin)
      throw createError({ statusCode: 403, statusMessage: 'Asal permintaan tidak diizinkan.' })
    if (!/^application\/json(?:\s*;|$)/i.test(getRequestHeader(event, 'content-type') ?? ''))
      throw createError({ statusCode: 415 })
    const raw = await boundedBody(event, 16 * 1024)
    try { body = JSON.parse(raw.toString('utf8')) }
    catch { throw createError({ statusCode: 422, statusMessage: 'Permintaan tidak valid.' }) }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw createError({ statusCode: 422 })
    headers['Content-Type'] = 'application/json'
    if (operation === 'submit') {
      const key = getRequestHeader(event, 'idempotency-key')
      if (key) headers['Idempotency-Key'] = key
    }
  }
  let origin: string
  try { origin = backendOrigin(String(useRuntimeConfig().apiBase)) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Layanan konsultasi belum tersedia.' }) }
  try {
    const response = await $fetch.raw(`${origin}${path}`, { method, headers, body, timeout: 10_000, redirect: 'error' })
    event.node.res.statusCode = response.status
    return response._data
  } catch (error: unknown) {
    const upstream = error as { statusCode?: number; data?: { errors?: Record<string, string[]> }; response?: { headers?: Headers } }
    const status = upstream.statusCode
    if (status === 429) {
      const retry = upstream.response?.headers?.get('retry-after')
      if (retry && /^\d{1,6}$/.test(retry)) event.node.res.setHeader('Retry-After', retry)
    }
    throw createError({
      statusCode: [403, 409, 413, 422, 429].includes(status ?? 0) ? status : 503,
      statusMessage: status === 422 ? 'Periksa isian permintaan Anda.' : 'Permintaan belum dapat diproses. Silakan coba kembali.',
      ...(status === 422 && upstream.data?.errors ? { data: { errors: upstream.data.errors } } : {}),
    })
  }
}
