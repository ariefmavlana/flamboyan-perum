export async function catalogApi(
  event: Parameters<typeof getQuery>[0],
  path: string,
) {
  const config = useRuntimeConfig()
  try {
    return await $fetch(`${config.apiBase}/api/v1/properties${path}`, {
      query: getQuery(event),
      headers: { Accept: 'application/json' },
      timeout: 5000,
    })
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode
    throw createError({
      statusCode: status === 404 ? 404 : status === 422 ? 422 : 503,
      statusMessage:
        status === 404
          ? 'Properti tidak ditemukan'
          : 'Katalog belum dapat dimuat. Silakan coba lagi.',
    })
  }
}
