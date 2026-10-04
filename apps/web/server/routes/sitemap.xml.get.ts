import { xmlEscape, sitemapOrigin } from '../utils/sitemap'
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  let lastPage: number
  try {
    lastPage = (
      await $fetch<{ last_page: number }>(`${config.apiBase}/api/v1/sitemap`, {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      })
    ).last_page
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Sitemap belum dapat dimuat',
    })
  }
  if (!Number.isInteger(lastPage) || lastPage < 1 || lastPage > 10000)
    throw createError({ statusCode: 503 })
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-store')
  const origin = sitemapOrigin()
  const files = [
    'pages.xml',
    ...Array.from(
      { length: lastPage },
      (_, index) => `properties-${index + 1}.xml`,
    ),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${files.map((file) => `<sitemap><loc>${xmlEscape(`${origin}/sitemaps/${file}`)}</loc></sitemap>`).join('')}</sitemapindex>`
})
