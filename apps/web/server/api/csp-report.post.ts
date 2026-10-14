import {
  assertBodySize,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from 'h3'

const maxBodyBytes = 16 * 1024
const maxReportsPerMinute = 60
const directives = new Set([
  'base-uri',
  'child-src',
  'connect-src',
  'default-src',
  'font-src',
  'form-action',
  'frame-ancestors',
  'frame-src',
  'img-src',
  'manifest-src',
  'media-src',
  'object-src',
  'script-src',
  'script-src-attr',
  'script-src-elem',
  'style-src',
  'style-src-attr',
  'style-src-elem',
  'worker-src',
])
let windowStartedAt = 0
let windowCount = 0

function directive(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim().split(/\s+/, 1)[0] ?? ''
  return directives.has(name) ? name : null
}

function origin(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  if (['inline', 'eval', 'self', 'data', 'blob'].includes(value)) return value
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) &&
      url.origin.length <= 200
      ? url.origin
      : null
  } catch {
    return null
  }
}

function collectReports(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body))
    return body
      .slice(0, 5)
      .map((entry) =>
        entry && typeof entry === 'object' && 'body' in entry
          ? (entry as { body?: unknown }).body
          : null,
      )
      .filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object',
      )
  if (body && typeof body === 'object') {
    const report = (body as Record<string, unknown>)['csp-report']
    if (report && typeof report === 'object')
      return [report as Record<string, unknown>]
  }
  return []
}

export default defineEventHandler(async (event) => {
  // H3 wraps the request stream: missing/chunked Content-Length cannot bypass it.
  assertBodySize(event, maxBodyBytes)
  const now = Date.now()
  if (now - windowStartedAt > 60_000) {
    windowStartedAt = now
    windowCount = 0
  }
  windowCount += 1
  if (windowCount <= maxReportsPerMinute) {
    let body: unknown
    try {
      body = await readBody(event)
    } catch (error) {
      const status =
        error && typeof error === 'object'
          ? Number(
              (error as { statusCode?: number; status?: number }).statusCode ??
                (error as { status?: number }).status,
            )
          : 0
      if (status === 413 || status === 400) throw error
      body = null
    }
    for (const report of collectReports(body)) {
      console.warn(
        'csp_violation',
        JSON.stringify({
          directive: directive(
            report['effective-directive'] ??
              report.effectiveDirective ??
              report['violated-directive'],
          ),
          blocked: origin(report['blocked-uri'] ?? report.blockedURL),
          document: origin(report['document-uri'] ?? report.documentURL),
        }),
      )
    }
  }
  setResponseStatus(event, 204)
  return null
})
