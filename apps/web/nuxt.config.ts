export default defineNuxtConfig({
  compatibilityDate: '2026-10-03',
  ssr: true,
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/main.css'],
  typescript: { strict: true },
  nitro: {
    devProxy: {
      '/api/v1/realtime': {
        target: 'http://127.0.0.1:8000/api/v1/realtime',
        changeOrigin: true,
      },
      '/media/': { target: 'http://127.0.0.1:8000/media/', changeOrigin: true },
      '/auth/': { target: 'http://127.0.0.1:8000/auth/', changeOrigin: true },
      '/sanctum/': {
        target: 'http://127.0.0.1:8000/sanctum/',
        changeOrigin: true,
      },
      '/api/v1/me': {
        target: 'http://127.0.0.1:8000/api/v1/me',
        changeOrigin: true,
      },
      '/api/v1/leads': {
        target: 'http://127.0.0.1:8000/api/v1/leads',
        changeOrigin: true,
      },
      '/api/v1/notifications': {
        target: 'http://127.0.0.1:8000/api/v1/notifications',
        changeOrigin: true,
      },
      '/api/v1/internal/': {
        target: 'http://127.0.0.1:8000/api/v1/internal/',
        changeOrigin: true,
      },
    },
  },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:8000',
    public: {
      siteUrl: 'http://localhost:3000',
      whatsappNumber: '6287776734038',
      analyticsEnabled: false,
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
  app: { head: { htmlAttrs: { lang: 'id' }, title: 'Flamboyan Perum' } },
})
