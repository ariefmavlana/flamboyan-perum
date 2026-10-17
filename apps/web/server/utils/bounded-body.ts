export async function boundedBody(event: Parameters<typeof getQuery>[0], maxBytes: number): Promise<Buffer> {
  const length = getRequestHeader(event, 'content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes))
    throw createError({ statusCode: 413, statusMessage: 'Ukuran permintaan terlalu besar.' })
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of event.node.req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maxBytes) throw createError({ statusCode: 413, statusMessage: 'Ukuran permintaan terlalu besar.' })
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}
