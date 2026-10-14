import { siteOrigin } from '#shared/utils/seo'

export const xmlEscape = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[character]!,
  )
export const sitemapOrigin = () =>
  siteOrigin(String(useRuntimeConfig().public.siteUrl))
