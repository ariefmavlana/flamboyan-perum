export const ATTRIBUTION_STORAGE_KEY = 'flamboyan-attribution-v1'
export const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60 * 1000

export interface AcquisitionTouch {
  source: string
  medium: string
  campaign: string
  content?: string
  term?: string
  captured_at: string
}

export interface AcquisitionContext {
  version: 1
  first_touch: AcquisitionTouch
  last_touch: AcquisitionTouch
}

export function campaignValue(value: unknown, words = false): string | undefined {
  if (typeof value !== 'string') return undefined
  const clean = value.trim().slice(0, 120)
  if (!clean || /@|https?:|(?:\+?\d[\s().-]*){8,}/i.test(clean) ||
    Array.from(clean).some((character) => (character.codePointAt(0) ?? 0) < 32 || character.codePointAt(0) === 127))
    return undefined
  const pattern = words ? /^[\p{L}\p{N} _./-]+$/u : /^[a-z][a-z0-9_-]{0,119}$/
  return pattern.test(clean) ? clean : undefined
}

export function acquisitionTouch(
  query: Record<string, unknown>,
  now = Date.now(),
): AcquisitionTouch | null {
  const source = campaignValue(query.utm_source)
  const medium = campaignValue(query.utm_medium)
  const campaign = campaignValue(query.utm_campaign)
  if (!source || !medium || !campaign) return null
  const content = campaignValue(query.utm_content)
  const term = campaignValue(query.utm_term, true)
  return {
    source,
    medium,
    campaign,
    ...(content ? { content } : {}),
    ...(term ? { term } : {}),
    captured_at: new Date(now).toISOString(),
  }
}

export function parseAcquisitionContext(
  raw: string | null,
  now = Date.now(),
): AcquisitionContext | null {
  if (!raw) return null
  try {
    const input = JSON.parse(raw) as Partial<AcquisitionContext>
    if (input.version !== 1 || !input.first_touch || !input.last_touch) return null
    const validate = (touch: AcquisitionTouch) => {
      const date = Date.parse(touch.captured_at)
      if (!Number.isFinite(date) || date > now + 60_000 || now - date > ATTRIBUTION_MAX_AGE)
        return null
      return acquisitionTouch(
        {
          utm_source: touch.source,
          utm_medium: touch.medium,
          utm_campaign: touch.campaign,
          utm_content: touch.content,
          utm_term: touch.term,
        },
        date,
      )
    }
    const first = validate(input.first_touch)
    const last = validate(input.last_touch)
    return first && last && Date.parse(last.captured_at) >= Date.parse(first.captured_at)
      ? { version: 1, first_touch: first, last_touch: last }
      : null
  } catch {
    return null
  }
}

export function nextAcquisitionContext(
  previous: AcquisitionContext | null,
  touch: AcquisitionTouch | null,
): AcquisitionContext | null {
  if (!touch) return previous
  return {
    version: 1,
    first_touch: previous?.first_touch ?? touch,
    last_touch: touch,
  }
}

export function isPublicAcquisitionPath(path: string): boolean {
  return /^(?:\/(?:properti(?:\/[a-z0-9-]+)?|perumahan(?:\/[a-z0-9-]+)?|panduan(?:\/[a-z0-9-]+)?|bandung-timur|konsultasi|bandingkan|privasi)?\/?$)/.test(path)
}

export function cleanPageLocation(origin: string, path: string): string | null {
  const clean = path.split(/[?#]/, 1)[0] ?? '/'
  if (!isPublicAcquisitionPath(clean)) return null
  try {
    const url = new URL(origin)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      return null
    return new URL(clean, url.origin).href
  } catch {
    return null
  }
}
