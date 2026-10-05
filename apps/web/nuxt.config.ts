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
  css: ['~/assets/main.css', '~/assets/editorial.css', '~/assets/workspace.css'],
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
  app: { head: { htmlAttrs: { lang: 'id' }, title: 'Flamboyan Perum' } },
})
