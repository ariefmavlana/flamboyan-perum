export function siteOrigin(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '')
}

export function canonicalUrl(siteUrl: string, path = '/'): string {
  const clean = path.replace(/^\/+/, '')
  return clean ? `${siteOrigin(siteUrl)}/${clean}` : siteOrigin(siteUrl)
}

export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteOrigin(siteUrl)}/`).href
}

const trackingParameters = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'])

export function catalogSeo(siteUrl: string, query: Record<string, unknown>) {
  const keys = Object.keys(query)
  const pageValue = query.page
  const validPage = pageValue === undefined || (typeof pageValue === 'string' && /^[1-9]\d{0,5}$/.test(pageValue))
  const filtered = keys.some((key) => key !== 'page' && !trackingParameters.has(key))
  const page = validPage && pageValue ? Number(pageValue) : 1
  return {
    canonical: `${canonicalUrl(siteUrl, '/properti')}${!filtered && validPage && page > 1 ? `?page=${page}` : ''}`,
    robots: filtered || !validPage ? 'noindex, follow' : 'index, follow',
    page,
  }
}
