export type ApiRouteKind = 'public' | 'private' | 'media' | 'health' | 'local'

const id = '[1-9]\\d{0,18}'
const rules: { path: RegExp; methods: string[]; kind: ApiRouteKind }[] = [
  { path: /^\/api\/csp-report$/, methods: ['POST'], kind: 'local' },
  { path: /^\/api\/v1\/(content|compare|sitemap|properties)$/, methods: ['GET', 'HEAD'], kind: 'public' },
  { path: new RegExp(`^/api/v1/content/${id}/logo$`), methods: ['GET', 'HEAD'], kind: 'public' },
  { path: /^\/api\/v1\/properties\/[a-z0-9-]{1,160}$/, methods: ['GET', 'HEAD'], kind: 'public' },
  { path: /^\/api\/v1\/analytics$/, methods: ['POST'], kind: 'public' },
  { path: /^\/api\/v1\/inquiries\/options$/, methods: ['GET', 'HEAD'], kind: 'public' },
  { path: /^\/api\/v1\/inquiries(?:\/context)?$/, methods: ['POST'], kind: 'public' },
  { path: /^\/auth\/(login|logout|forgot-password|reset-password)$/, methods: ['POST'], kind: 'private' },
  { path: /^\/sanctum\/csrf-cookie$/, methods: ['GET', 'HEAD'], kind: 'private' },
  { path: /^\/api\/v1\/me$/, methods: ['GET', 'HEAD', 'PATCH'], kind: 'private' },
  { path: /^\/api\/v1\/realtime$/, methods: ['GET', 'HEAD'], kind: 'private' },
  { path: /^\/api\/v1\/realtime\/auth$/, methods: ['POST'], kind: 'private' },
  { path: /^\/api\/v1\/internal\/users$/, methods: ['GET', 'HEAD', 'POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/users/${id}$`), methods: ['PATCH'], kind: 'private' },
  { path: /^\/api\/v1\/internal\/(audit|reports|privacy|operations|inquiries)$/, methods: ['GET', 'HEAD'], kind: 'private' },
  { path: /^\/api\/v1\/internal\/content$/, methods: ['GET', 'HEAD', 'POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/content/${id}$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/content/${id}/logo$`), methods: ['POST'], kind: 'private' },
  { path: /^\/api\/v1\/internal\/properties$/, methods: ['GET', 'HEAD', 'POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}$`), methods: ['GET', 'HEAD', 'PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}/(location|commercial)$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}/owner$`), methods: ['POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}/media$`), methods: ['GET', 'HEAD', 'POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}/media/process$`), methods: ['POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/properties/${id}/media/${id}$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/media/${id}/(640|1280|1920|download)$`), methods: ['GET', 'HEAD'], kind: 'private' },
  { path: /^\/api\/v1\/leads$/, methods: ['GET', 'HEAD', 'POST'], kind: 'private' },
  { path: /^\/api\/v1\/leads\/summary$/, methods: ['GET', 'HEAD'], kind: 'private' },
  { path: new RegExp(`^/api/v1/leads/${id}(/history)?$`), methods: ['GET', 'HEAD'], kind: 'private' },
  { path: new RegExp(`^/api/v1/leads/${id}/(contact|status)$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/leads/${id}/(assignment|notes)$`), methods: ['POST'], kind: 'private' },
  { path: /^\/api\/v1\/notifications$/, methods: ['GET', 'HEAD'], kind: 'private' },
  { path: /^\/api\/v1\/notifications\/[0-9a-f-]{36}\/read$/, methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/inquiries/${id}/resolve$`), methods: ['POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/leads/${id}/outcomes$`), methods: ['GET', 'HEAD'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/leads/${id}/qualification$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/leads/${id}/attribution$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/leads/${id}/(visits|akad-confirmation)$`), methods: ['POST'], kind: 'private' },
  { path: new RegExp(`^/api/v1/internal/leads/${id}/visits/${id}$`), methods: ['PATCH'], kind: 'private' },
  { path: new RegExp(`^/media/${id}/(640|1280|1920|download)$`), methods: ['GET', 'HEAD'], kind: 'media' },
  { path: /^\/(up|ready)$/, methods: ['GET', 'HEAD'], kind: 'health' },
]

export function apiRoute(path: string, method: string): { kind?: ApiRouteKind; error?: 404 | 405 } | null {
  if (!/^\/(?:api(?:\/|$)|auth(?:\/|$)|sanctum(?:\/|$)|media(?:\/|$)|up$|ready$)/.test(path)) return null
  if (/%(?:2e|2f|5c|25)|\\|\/\//i.test(path)) return { error: 404 }
  const rule = rules.find((item) => item.path.test(path))
  if (!rule) return { error: 404 }
  return rule.methods.includes(method.toUpperCase()) ? { kind: rule.kind } : { error: 405 }
}

export function backendOrigin(value: string): string {
  const url = new URL(value)
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')))
    throw new Error('Origin backend harus HTTPS tanpa path atau kredensial.')
  return url.origin
}
