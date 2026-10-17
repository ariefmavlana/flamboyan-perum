import { sitemapOrigin } from '../utils/sitemap'
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  if (String(useRuntimeConfig().public.indexable) === 'false') return 'User-agent: *\nDisallow: /\n'
  return `User-agent: *\nDisallow: /backoffice\nDisallow: /login\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /bandingkan\nDisallow: /api/\nDisallow: /auth/\nDisallow: /sanctum/\nSitemap: ${sitemapOrigin()}/sitemap.xml\n`
})
