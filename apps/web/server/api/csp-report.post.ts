const maxBodyBytes = 16 * 1024
const maxReportsPerMinute = 60
let windowStartedAt = 0
let windowCount = 0

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const [withoutQuery] = value.split('?')
  return (withoutQuery ?? '').slice(0, 200)
}

function collectReports(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body))
    return body
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
  const length = Number(event.node.req.headers['content-length'] ?? 0)
  if (!Number.isFinite(length) || length <= maxBodyBytes) {
    const now = Date.now()
    if (now - windowStartedAt > 60_000) {
      windowStartedAt = now
      windowCount = 0
    }
    windowCount += 1
    if (windowCount <= maxReportsPerMinute) {
      const body = await readBody(event).catch(() => null)
      for (const report of collectReports(body).slice(0, 5)) {
        console.warn(
          'csp_violation',
          JSON.stringify({
            directive: sanitize(
              report['violated-directive'] ??
                report['effective-directive'] ??
                report.effectiveDirective,
            ),
            blocked: sanitize(report['blocked-uri'] ?? report.blockedURL),
            document: sanitize(report['document-uri'] ?? report.documentURL),
          }),
        )
      }
    }
  }
  event.node.res.statusCode = 204

  return null
})
