import { buyerGuides } from '#shared/content/buyer-guides'
import { xmlEscape, sitemapOrigin } from '../../utils/sitemap'
export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  const origin = sitemapOrigin()
  let entries: { url: string; updated?: string }[]
  if (file === 'pages.xml')
    entries = [
      { url: origin },
      { url: `${origin}/properti` },
      { url: `${origin}/privasi` },
      ...[
        '/perumahan',
        '/perumahan/banjaran',
        '/bandung-timur',
        '/panduan',
        '/konsultasi',
        ...buyerGuides.map((guide) => `/panduan/${guide.slug}`),
      ].map((path) => ({ url: origin + path })),
    ]
  else {
    const match = /^properties-([1-9]\d{0,3}|10000)\.xml$/.exec(file)
    if (!match) throw createError({ statusCode: 404 })
    const page = Number(match[1])
    let response: {
      data: { slug: string; updated_at: string }[]
      last_page: number
    }
    try {
      response = await $fetch<
        { data: { slug: string; updated_at: string }[]; last_page: number },
        string
      >(`${useRuntimeConfig().apiBase}/api/v1/sitemap`, {
        query: { page },
        headers: publicHeaders(event, 'GET', '/api/v1/sitemap'),
        timeout: 5000,
      })
    } catch {
      throw createError({ statusCode: 503 })
    }
    if (page > response.last_page) throw createError({ statusCode: 404 })
    entries = response.data.map((property) => ({
      url: `${origin}/properti/${encodeURIComponent(property.slug)}`,
      updated: property.updated_at,
    }))
  }
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-store')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((entry) => `<url><loc>${xmlEscape(entry.url)}</loc>${entry.updated ? `<lastmod>${xmlEscape(entry.updated)}</lastmod>` : ''}</url>`).join('')}</urlset>`
})
