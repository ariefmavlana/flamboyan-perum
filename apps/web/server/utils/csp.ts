const GTM_SCRIPT_SOURCES = ['https://www.googletagmanager.com']
const GTM_CONNECT_SOURCES = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://*.analytics.google.com',
  'https://googleads.g.doubleclick.net',
  'https://www.googleadservices.com',
  'https://td.doubleclick.net',
]
const GTM_IMAGE_SOURCES = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://googleads.g.doubleclick.net',
  'https://www.googleadservices.com',
]
const GTM_FRAME_SOURCES = ['https://td.doubleclick.net']
const META_SCRIPT_SOURCES = ['https://connect.facebook.net']
const META_CONNECT_SOURCES = [
  'https://connect.facebook.net',
  'https://www.facebook.com',
]
const META_IMAGE_SOURCES = ['https://www.facebook.com']

export interface CspOptions {
  nonce: string
  tourHosts: string
  gtmId?: string
  metaPixelId?: string
  metaViaGtm?: boolean
  upgradeInsecureRequests?: boolean
}

export function tourFrameSources(tourHosts: string): string[] {
  return tourHosts
    .split(',')
    .map((host) => host.trim())
    .filter((host) => /^[a-z0-9.-]+$/.test(host))
    .map((host) => `https://${host}`)
}

export function buildContentSecurityPolicy(options: CspOptions): string {
  const gtm = Boolean(options.gtmId)
  const meta = Boolean(options.metaPixelId) || (gtm && options.metaViaGtm === true)
  const dynamic = gtm || meta
  const script = [
    `'self'`,
    `'nonce-${options.nonce}'`,
    'https://www.youtube.com/iframe_api',
    'https://www.youtube.com/s/player/',
    ...(dynamic ? [`'strict-dynamic'`] : []),
    ...(gtm ? GTM_SCRIPT_SOURCES : []),
    ...(meta ? META_SCRIPT_SOURCES : []),
  ]
  const connect = [
    `'self'`,
    'wss://*.pusher.com',
    'https://*.pusher.com',
    ...(gtm ? GTM_CONNECT_SOURCES : []),
    ...(meta ? META_CONNECT_SOURCES : []),
  ]
  const image = [
    `'self'`,
    'data:',
    ...(gtm ? GTM_IMAGE_SOURCES : []),
    ...(meta ? META_IMAGE_SOURCES : []),
  ]
  const frame = [
    'https://www.youtube-nocookie.com',
    'https://www.openstreetmap.org',
    ...tourFrameSources(options.tourHosts),
    ...(gtm ? GTM_FRAME_SOURCES : []),
  ]
  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `script-src ${script.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${image.join(' ')}`,
    `font-src 'self'`,
    `connect-src ${connect.join(' ')}`,
    `frame-src ${frame.join(' ')}`,
    `form-action 'self'`,
    `worker-src 'none'`,
    `manifest-src 'self'`,
    `report-uri /api/csp-report`,
    ...(options.upgradeInsecureRequests ? [`upgrade-insecure-requests`] : []),
  ].join('; ')
}
