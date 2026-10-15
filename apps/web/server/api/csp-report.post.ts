import type { IncomingMessage, ServerResponse } from 'node:http'
import { createError, defineEventHandler, setResponseStatus } from 'h3'

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

// Nitro supplies a Node HTTP adapter. Its H3 runtime can differ from CLI H3 types.
interface NodeReportEvent {
  node?: { req?: IncomingMessage; res?: ServerResponse }
  web?: { request?: Request }
  _requestBody?: BodyInit
}

export async function readReportBody(event: unknown): Promise<unknown> {
  const adapter = event as NodeReportEvent | null | undefined
  const candidateReq = adapter?.node?.req
  const candidateRes = adapter?.node?.res
  if (
    !candidateReq ||
    !candidateRes ||
    typeof candidateReq.pause !== 'function' ||
    typeof candidateReq.on !== 'function'
  )
    throw createError({
      statusCode: 503,
      statusMessage: 'Unsupported report adapter',
    })
  // Definite aliases keep the validated contract inside callbacks and hoisted functions.
  const req: IncomingMessage = candidateReq
  const res: ServerResponse = candidateRes
  function tooLarge() {
    // Close the connection after the error response rather than consuming an unbounded stream.
    req.pause()
    res.shouldKeepAlive = false
    return createError({ statusCode: 413, statusMessage: 'Payload Too Large' })
  }
  if (Number(req.headers['content-length']) > maxBodyBytes) throw tooLarge()
  const chunks: Buffer[] = []
  let size = 0
  function accept(value: Uint8Array | string) {
    const bytes =
      typeof value === 'string' ? Buffer.byteLength(value) : value.byteLength
    if (size + bytes > maxBodyBytes) throw tooLarge()
    size += bytes
    chunks.push(Buffer.from(value))
  }
  // Nitro's serverless adapters may provide an already materialized body or a Web stream.
  const incoming = req as typeof req & {
    rawBody?: unknown
    body?: unknown
    [key: symbol]: unknown
  }
  const supplied =
    adapter?.web?.request?.body ??
    adapter?._requestBody ??
    incoming[Symbol.for('h3RawBody')] ??
    incoming.rawBody ??
    incoming.body
  if (supplied != null) {
    const body = await supplied
    if (body instanceof ReadableStream) {
      const reader = body.getReader()
      try {
        while (true) {
          const part = await reader.read()
          if (part.done) break
          accept(part.value)
        }
      } catch (error) {
        void reader.cancel().catch(() => {})
        throw error
      } finally {
        reader.releaseLock()
      }
    } else if (typeof body === 'string' || body instanceof Uint8Array) {
      accept(body)
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid report body',
      })
    }
  } else if (!req.readableEnded) {
    await new Promise<void>((resolve, reject) => {
      function cleanup() {
        req.off('data', data)
        req.off('end', end)
        req.off('error', fail)
        req.off('aborted', aborted)
      }
      function data(chunk: Buffer) {
        try {
          accept(chunk)
        } catch (error) {
          cleanup()
          reject(error)
        }
      }
      function end() {
        cleanup()
        resolve()
      }
      function fail(error: Error) {
        cleanup()
        reject(error)
      }
      function aborted() {
        fail(
          createError({
            statusCode: 400,
            statusMessage: 'Incomplete report body',
          }),
        )
      }
      req
        .on('data', data)
        .once('end', end)
        .once('error', fail)
        .once('aborted', aborted)
    })
  }
  try {
    return JSON.parse(Buffer.concat(chunks, size).toString('utf8'))
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const now = Date.now()
  if (now - windowStartedAt > 60_000) {
    windowStartedAt = now
    windowCount = 0
  }
  if (windowCount >= maxReportsPerMinute) {
    // Reject before reading/parsing; do not drain an unbounded request stream.
    const adapter = event as unknown as NodeReportEvent
    adapter.node?.req?.pause()
    if (adapter.node?.res) adapter.node.res.shouldKeepAlive = false
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }
  windowCount += 1
  const body = await readReportBody(event)
  if (windowCount <= maxReportsPerMinute) {
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
