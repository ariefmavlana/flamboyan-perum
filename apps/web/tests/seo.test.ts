import { describe, expect, it } from 'vitest'
import { absoluteUrl, canonicalUrl, siteOrigin } from '../shared/utils/seo'
import { whatsappContextUrl } from '../shared/utils/catalog'

describe('SEO URL helpers', () => {
  it('shares only public page context and recognized consultation references', () => {
    const origin = 'https://flamboyan.example'
    expect(
      whatsappContextUrl(origin, '/properti/rumah-1?email=private#secret'),
    ).toBe(`${origin}/properti/rumah-1`)
    expect(
      whatsappContextUrl(
        origin,
        '/konsultasi/',
        {
          properti: 'rumah-1',
          message: 'private',
        },
        'rumah-1',
      ),
    ).toBe(`${origin}/properti/rumah-1`)
    expect(
      whatsappContextUrl(origin, '/konsultasi', {
        properti: ['rumah-1'],
        kawasan: 'banjaran',
      }),
    ).toBe(`${origin}/perumahan/banjaran`)
    expect(
      whatsappContextUrl(origin, '/konsultasi', {
        properti: 'https://other.example',
        kawasan: 'unknown',
      }),
    ).toBe(`${origin}/properti`)
    expect(whatsappContextUrl(origin, '/reset-password?token=private')).toBe(
      origin,
    )
    expect(
      whatsappContextUrl(origin, '/konsultasi', { properti: '081234567890' }),
    ).toBe(`${origin}/properti`)
    expect(
      whatsappContextUrl(
        origin,
        '/konsultasi',
        { properti: 'unknown' },
        'rumah-1',
      ),
    ).toBe(`${origin}/properti`)
  })
  it('normalizes trailing slashes to a single origin', () => {
    expect(siteOrigin('https://flamboyan.example///')).toBe(
      'https://flamboyan.example',
    )
    expect(siteOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })
  it('builds canonical URLs without duplicating or dropping slashes', () => {
    expect(canonicalUrl('https://flamboyan.example///')).toBe(
      'https://flamboyan.example',
    )
    expect(canonicalUrl('https://flamboyan.example/', '/properti')).toBe(
      'https://flamboyan.example/properti',
    )
    expect(canonicalUrl('https://flamboyan.example', '/properti/rumah-1')).toBe(
      'https://flamboyan.example/properti/rumah-1',
    )
  })
  it('resolves absolute asset URLs against the configured origin', () => {
    expect(absoluteUrl('https://flamboyan.example/', '/media/1/640')).toBe(
      'https://flamboyan.example/media/1/640',
    )
    expect(
      absoluteUrl('https://flamboyan.example', 'https://cdn.example/x.webp'),
    ).toBe('https://cdn.example/x.webp')
  })
})
