export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[1-9]\d{0,18}$/.test(id)) throw createError({ statusCode: 404 })
  const path = `/api/v1/content/${id}/logo`
  try {
    const response = await $fetch.raw<ArrayBuffer>(
      `${useRuntimeConfig().apiBase}${path}`,
      {
        headers: publicHeaders(event, 'GET', path),
        responseType: 'arrayBuffer',
        timeout: 5000,
        redirect: 'error',
      },
    )
    if (
      response.headers.get('content-type')?.split(';')[0] !== 'image/webp' ||
      !response._data ||
      response._data.byteLength > 2 * 1024 * 1024
    )
      throw createError({ statusCode: 503 })
    setHeader(event, 'Content-Type', 'image/webp')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'Cache-Control', 'no-store')
    setHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
    return Buffer.from(response._data)
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    throw createError({
      statusCode: status === 404 ? 404 : status === 429 ? 429 : 503,
      statusMessage: 'Logo belum tersedia',
    })
  }
})
