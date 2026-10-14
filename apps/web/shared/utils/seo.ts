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
