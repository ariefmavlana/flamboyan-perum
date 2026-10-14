import { describe, expect, it } from 'vitest'
import {
  analyticsDedupeKey,
  buildAnalyticsEvent,
  campaignContext,
} from '../shared/utils/analytics'

describe('Analytics payloads', () => {
  it('keeps only allowlisted context keys', () => {
    const payload = buildAnalyticsEvent('view_property', {
      property_id: 12,
      property_type: '56/90',
      page_type: 'property',
      content_group: 'katalog',
    })
    expect(payload).toEqual({
      event: 'view_property',
      property_id: 12,
      property_type: '56/90',
      page_type: 'property',
      content_group: 'katalog',
    })
    expect(Object.keys(payload)).not.toContain('phone')
    expect(Object.keys(payload)).not.toContain('name')
  })
  it('never forwards personal or oversized values', () => {
    const payload = buildAnalyticsEvent('click_whatsapp', {
      property_type: '  tipe  '.repeat(40),
      lead_channel: 'whatsapp',
    })
    expect(String(payload.property_type).length).toBeLessThanOrEqual(120)
    expect(payload.property_type).not.toMatch(/^\s|\s$/)
    expect(
      buildAnalyticsEvent('select_property', { property_id: Number.NaN })
        .property_id,
    ).toBeUndefined()
  })
  it('builds stable dedupe keys per event and property', () => {
    expect(analyticsDedupeKey('view_property', { property_id: 3 })).toBe(
      'view_property:3:-',
    )
    expect(analyticsDedupeKey('view_property', { property_id: 3 })).toBe(
      analyticsDedupeKey('view_property', { property_id: 3 }),
    )
    expect(analyticsDedupeKey('view_property', { property_id: 4 })).not.toBe(
      analyticsDedupeKey('view_property', { property_id: 3 }),
    )
  })
  it('reads campaign attribution from UTM parameters only', () => {
    expect(
      campaignContext({
        utm_source: 'instagram',
        utm_medium: 'paid_social',
        utm_campaign: 'flamboyan_launch',
        properti: 'rumah-1',
      }),
    ).toEqual({
      traffic_source: 'instagram',
      traffic_medium: 'paid_social',
      campaign_id: 'flamboyan_launch',
    })
    expect(campaignContext({})).toEqual({
      traffic_source: undefined,
      traffic_medium: undefined,
      campaign_id: undefined,
    })
  })
})
