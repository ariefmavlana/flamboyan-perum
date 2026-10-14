import { describe, expect, it } from 'vitest'
import { absoluteUrl, canonicalUrl, siteOrigin } from '../shared/utils/seo'

describe('SEO URL helpers', () => {
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
    expect(
      canonicalUrl('https://flamboyan.example', '/properti/rumah-1'),
    ).toBe('https://flamboyan.example/properti/rumah-1')
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
