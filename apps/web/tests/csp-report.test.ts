import { createServer, request as httpRequest, type Server } from 'node:http'
import { Readable } from 'node:stream'
import { createApp, createEvent, toNodeListener } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let server: Server
let port: number
let warning: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  vi.resetModules()
  warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const handler = (await import('../server/api/csp-report.post')).default
  server = createServer(toNodeListener(createApp().use('/report', handler)))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw Error('Missing test listener')
  port = address.port
})
afterEach(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  vi.restoreAllMocks()
})
async function report(chunks: string[], headers: Record<string, string> = {}) {
  return new Promise<number>((resolve, reject) => {
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port,
        path: '/report',
        method: 'POST',
        headers: { 'content-type': 'application/csp-report', ...headers },
      },
      (res) => {
        res.resume()
        res.on('end', () => resolve(res.statusCode ?? 0))
      },
    )
    req.on('error', reject)
    for (const chunk of chunks) req.write(chunk)
    req.end()
  })
}
describe('CSP report on the actual Nitro H3 listener', () => {
  it('rejects oversized declared bodies without logging', async () => {
    expect(
      await report(['x'.repeat(17000)], { 'content-length': '17000' }),
    ).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it('bounds chunked requests with no Content-Length', async () => {
    expect(await report(['x'.repeat(8000), 'x'.repeat(9000)])).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it('bounds actual UTF-8 bytes on chunked requests', async () => {
    expect(await report(['🙂'.repeat(4200)])).toBe(413)
    expect(warning).not.toHaveBeenCalled()
  })
  it('does not trust understated headers on a serverless buffered body', async () => {
    const { readReportBody } = await import('../server/api/csp-report.post')
    const req = Readable.from([]) as unknown as Parameters<
      typeof createEvent
    >[0] & { rawBody: Buffer }
    req.headers = { 'content-length': '1' }
    req.rawBody = Buffer.from('🙂'.repeat(4200))
    const event = createEvent(req, { shouldKeepAlive: true } as Parameters<
      typeof createEvent
    >[1])
    await expect(readReportBody(event)).rejects.toMatchObject({
      statusCode: 413,
    })
  })
  it.each(['legacy', 'reporting'])(
    'logs only directives and origins for %s',
    async (format) => {
      const value = {
        'effective-directive': 'script-src',
        'violated-directive': "script-src 'nonce-private-fixture'",
        'blocked-uri':
          'https://user:private-fixture@blocked.example.test/path?contact=private#private',
        'document-uri':
          'https://user:private-fixture@site.example.test/reset/private?token=private#private',
      }
      const body =
        format === 'legacy'
          ? { 'csp-report': value }
          : [
              {
                body: {
                  effectiveDirective: value['effective-directive'],
                  blockedURL: value['blocked-uri'],
                  documentURL: value['document-uri'],
                },
              },
            ]
      expect(await report([JSON.stringify(body)])).toBe(204)
      expect(warning).toHaveBeenCalledTimes(1)
      expect(JSON.parse(String(warning.mock.calls[0]?.[1]))).toEqual({
        directive: 'script-src',
        blocked: 'https://blocked.example.test',
        document: 'https://site.example.test',
      })
      expect(JSON.stringify(warning.mock.calls)).not.toContain('private')
    },
  )
  it('still rejects oversized requests after the logging quota', async () => {
    for (let i = 0; i < 61; i++) expect(await report(['{}'])).toBe(204)
    expect(await report(['x'.repeat(17000)])).toBe(413)
  })
})
