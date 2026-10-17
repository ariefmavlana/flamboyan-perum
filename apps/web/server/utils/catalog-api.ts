import type { Paginated, Property } from '../../shared/types'

export async function catalogApi(
  event: Parameters<typeof getQuery>[0],
  path: string,
): Promise<Paginated<Property> | { data: Property }> {
  const config = useRuntimeConfig()
  try {
    return await $fetch<Paginated<Property> | { data: Property }>(
      `${config.apiBase}/api/v1/properties${path}`,
      {
        query: getQuery(event),
        headers: publicHeaders(event, 'GET', `/api/v1/properties${path}`),
        timeout: 5000,
        redirect: 'error',
      },
    )
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
