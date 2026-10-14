import { H3 } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let app: H3
let warning: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  vi.resetModules()
  warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const handler = (await import('../server/api/csp-report.post')).default
  app = new H3().post('/report', handler)
})
afterEach(() => vi.restoreAllMocks())

function request(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request('http://localhost/report', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', ...headers },
    duplex: 'half',
  } as RequestInit)
}
describe('public CSP report boundary', () => {
  it('rejects an oversized declared body before parsing or logging', async () => {
    const response = await app.fetch(
      request('x'.repeat(17000), { 'content-length': '17000' }),
    )
    expect(response.status).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it('rejects oversized chunked bodies without Content-Length', async () => {
    const bytes = new TextEncoder().encode('x'.repeat(17000))
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 8000))
        controller.enqueue(bytes.slice(8000))
        controller.close()
      },
    })
    const response = await app.fetch(
      request(stream, { 'transfer-encoding': 'chunked' }),
    )
    expect(response.status).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it('bounds actual UTF-8 bytes even when Content-Length understates them', async () => {
    const response = await app.fetch(
      request('🙂'.repeat(4200), { 'content-length': '1' }),
    )
    expect(response.status).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it.each(['legacy', 'reporting'])(
    'logs only directive and origins for %s format',
    async (format) => {
      const report = {
        'effective-directive': 'script-src',
        'violated-directive': "script-src 'nonce-private-fixture'",
        'blocked-uri':
          'https://user:private-fixture@blocked.example.test/path?contact=private#private',
        'document-uri':
          'https://user:private-fixture@site.example.test/reset/private?token=private#private',
      }
      const body =
        format === 'legacy'
          ? { 'csp-report': report }
          : [
              {
                body: {
                  effectiveDirective: report['effective-directive'],
                  blockedURL: report['blocked-uri'],
                  documentURL: report['document-uri'],
                },
              },
            ]
      expect((await app.fetch(request(JSON.stringify(body)))).status).toBe(204)
      expect(warning).toHaveBeenCalledTimes(1)
      expect(JSON.parse(String(warning.mock.calls[0]?.[1]))).toEqual({
        directive: 'script-src',
        blocked: 'https://blocked.example.test',
        document: 'https://site.example.test',
      })
      expect(JSON.stringify(warning.mock.calls)).not.toContain('private')
    },
  )
})
