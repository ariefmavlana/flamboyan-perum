export const ANALYTICS_EVENTS = [
  'view_property',
  'select_property',
  'compare_property',
  'calculate_mortgage',
  'click_whatsapp',
  'request_visit',
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

export interface AnalyticsContext {
  property_id?: number
  property_type?: string
  page_type?: string
  content_group?: string
  lead_channel?: string
  traffic_source?: string
  traffic_medium?: string
  campaign_id?: string
}

const CONTEXT_KEYS = [
  'property_id',
  'property_type',
  'page_type',
  'content_group',
  'lead_channel',
  'traffic_source',
  'traffic_medium',
  'campaign_id',
] as const

const MAX_VALUE_LENGTH = 120

function sanitize(value: string | number): string | number | undefined {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined
  const clean = Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0
      return code >= 32 && code !== 127
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_VALUE_LENGTH)
    .trim()
  return clean || undefined
}

export function buildAnalyticsEvent(
  event: AnalyticsEvent,
  context: AnalyticsContext = {},
): Record<string, string | number> {
  const payload: Record<string, string | number> = { event }
  for (const key of CONTEXT_KEYS) {
    const value = context[key]
    if (value === undefined) continue
    const clean = sanitize(value)
    if (clean !== undefined) payload[key] = clean
  }
  return payload
}

export function analyticsDedupeKey(
  event: AnalyticsEvent,
  context: AnalyticsContext = {},
): string {
  return `${event}:${context.property_id ?? '-'}:${context.page_type ?? '-'}`
}

export function campaignContext(
  query: Record<string, unknown>,
): AnalyticsContext {
  const read = (key: string) =>
    typeof query[key] === 'string' ? (query[key] as string) : undefined
  return {
    traffic_source: read('utm_source'),
    traffic_medium: read('utm_medium'),
    campaign_id: read('utm_campaign'),
  }
}
