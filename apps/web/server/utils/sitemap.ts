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
  useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
