// The demo deployment serves the web project and the API project on different
// Vercel hosts. Staff auth uses Sanctum cookies, so the API paths must be
// reachable same-origin; Nitro proxies them at runtime. Local development keeps
// using devProxy below, and the guard turns a missing NUXT_API_BASE into a
// build failure instead of a silently broken deployment.
const apiOrigin = process.env.NUXT_API_BASE || 'http://127.0.0.1:8000'

if (process.env.VERCEL === '1' && !process.env.NUXT_API_BASE)
  throw new Error(
    'NUXT_API_BASE wajib diset pada build Vercel agar proxy same-origin berfungsi.',
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

const sameOriginProxy =
  process.env.VERCEL === '1'
    ? Object.fromEntries(
        ['/api/**', '/auth/**', '/sanctum/**', '/media/**', '/up'].map(
          (path) => [path, { proxy: `${apiOrigin}${path}` }],
        ),
      )
    : {}

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
  ],
  typescript: { strict: true },
  nitro: {
    devProxy: {
      '/api/v1/realtime': {
        target: `${apiOrigin}/api/v1/realtime`,
        changeOrigin: true,
      },
      '/media/': { target: `${apiOrigin}/media/`, changeOrigin: true },
      '/auth/': { target: `${apiOrigin}/auth/`, changeOrigin: true },
      '/sanctum/': {
        target: `${apiOrigin}/sanctum/`,
        changeOrigin: true,
      },
      '/api/v1/me': {
        target: `${apiOrigin}/api/v1/me`,
        changeOrigin: true,
      },
      '/api/v1/leads': {
        target: `${apiOrigin}/api/v1/leads`,
        changeOrigin: true,
      },
      '/api/v1/notifications': {
        target: `${apiOrigin}/api/v1/notifications`,
        changeOrigin: true,
      },
      '/api/v1/internal/': {
        target: `${apiOrigin}/api/v1/internal/`,
        changeOrigin: true,
      },
    },
  },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:8000',
    apiProxySecret: '',
    trustedProxyIps: '',
    allowedHosts: 'localhost,127.0.0.1',
    tourHosts: 'my.matterport.com',
    public: {
      siteUrl: 'http://localhost:3000',
      whatsappNumber: '62895375894848',
      analyticsEnabled: false,
      gtmId: '',
      metaPixelId: '',
      instagramUrl: '',
    },
  },
  routeRules: {
    ...sameOriginProxy,
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
      meta: [
        {
          name: 'description',
          content:
            'Jelajahi pilihan rumah Bukit Flamboyan Indah 2 di Cibiru Wetan, Bandung Timur. Bandingkan harga, spesifikasi, simulasi KPR, dan rencanakan kunjungan.',
        },
        { property: 'og:site_name', content: 'Flamboyan Perum' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-32.png',
          sizes: '32x32',
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/icon-192.png',
          sizes: '192x192',
        },
        {
          rel: 'apple-touch-icon',
          href: '/apple-touch-icon.png',
          sizes: '180x180',
        },
      ],
    },
  },
})
