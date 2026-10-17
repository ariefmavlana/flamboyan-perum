// The same bounded Nitro bridge serves local, Vercel and a future Node host.
// Production builds require an explicit backend; credentials stay server-side.
if (process.env.NODE_ENV === 'production' && !process.env.NUXT_API_BASE)
  throw new Error(
    'NUXT_API_BASE wajib diset pada build produksi agar proxy same-origin berfungsi.',
  )

const publicSiteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/+$/, '')

if (
  process.env.VERCEL_ENV === 'production' &&
  /\.vercel\.app$/.test(publicSiteUrl)
)
  console.warn(
    '[flamboyan] NUXT_PUBLIC_SITE_URL masih memakai hostname Vercel. Canonical dan sitemap produksi menunggu domain resmi disetujui.',
  )

export default defineNuxtConfig({
  compatibilityDate: '2026-10-03',
  ssr: true,
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: [
    '~/assets/main.css',
    '~/assets/editorial.css',
    '~/assets/residences.css',
    '~/assets/workspace.css',
    '~/assets/public-experience.css',
  ],
  typescript: { strict: true },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:8000',
    apiProxySecret: '',
    apiPreviewBypass: '',
    apiPreviewHost: '',
    trustedProxyIps: '',
    allowedHosts: 'localhost,127.0.0.1',
    tourHosts: 'my.matterport.com',
    public: {
      siteUrl: 'http://localhost:3000',
      whatsappNumber: '6282214795024',
      analyticsEnabled: false,
      gtmId: '',
      metaPixelId: '',
      metaViaGtm: false,
      attributionEnabled: false,
      indexable: process.env.VERCEL_ENV !== 'preview',
      instagramUrl: '',
    },
  },
  routeRules: {
    '/forgot-password': {
      ssr: false,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    },
    '/reset-password': {
      ssr: false,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    },
    '/backoffice/**': {
      ssr: false,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    },
    '/login': {
      ssr: false,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Flamboyan Perum',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/brand/flamboyan-mark.png',
        },
        { rel: 'apple-touch-icon', href: '/images/brand/flamboyan-mark.png' },
      ],
      meta: [
        {
          name: 'description',
          content:
            'Jelajahi pilihan rumah Bukit Flamboyan Indah 2 di Bandung Timur. Bandingkan harga, spesifikasi, simulasi KPR, dan rencanakan kunjungan.',
        },
        { property: 'og:site_name', content: 'Flamboyan Perum' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },
})
