const allowed = new Set(['content', 'compare', 'sitemap'])
export async function publicApi(
  event: Parameters<typeof getQuery>[0],
  path: string,
) {
  if (!allowed.has(path)) throw createError({ statusCode: 404 })
  try {
    return await $fetch(`${useRuntimeConfig().apiBase}/api/v1/${path}`, {
      query: getQuery(event),
      headers: publicHeaders(event, 'GET', `/api/v1/${path}`),
      timeout: 5000,
    })
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode
    throw createError({
      statusCode: status === 422 ? 422 : 503,
      statusMessage: 'Dapatkan informasi kembali beberapa saat lagi.',
    })
  }
}
