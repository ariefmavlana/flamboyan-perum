import { describe, expect, it } from 'vitest'
import type { Property } from '../shared/types'
import {
  breadcrumbSchema,
  jsonLdText,
  realEstateListingSchema,
  websiteSchema,
} from '../shared/utils/structured-data'

const property: Property = {
  id: 7,
  slug: 'tipe-56-90',
  title: 'Bukit Flamboyan Indah 2 · Tipe 56/90',
  house_type: '56/90',
  condition: 'NEW',
  certificate: 'Belum dicantumkan dalam brosur',
  location: 'Cibiru Wetan, Bandung Timur',
  address: 'Jl. Cikoneng, Ciguruwik, Cibiru Wetan, Kabupaten Bandung',
  description: 'Ilustrasi hunian tipe 56/90.',
  price_idr: '690700000',
  land_area: '90.00',
  building_area: '56.00',
  bedrooms: 3,
  bathrooms: 2,
  availability: 'CHECK_REQUIRED',
  featured: true,
}

describe('Structured data', () => {
  it('describes the site without inventing an organisation', () => {
    const schema = websiteSchema('https://flamboyan.example/')
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Flamboyan Perum',
      url: 'https://flamboyan.example',
      inLanguage: 'id-ID',
    })
  })
  it('numbers breadcrumb items in order', () => {
    const schema = breadcrumbSchema([
      { name: 'Beranda', url: 'https://flamboyan.example' },
      { name: 'Jelajahi properti', url: 'https://flamboyan.example/properti' },
    ])
    expect(schema.itemListElement).toHaveLength(2)
    expect(schema.itemListElement[0]!.position).toBe(1)
    expect(schema.itemListElement[1]!.position).toBe(2)
  })
  it('omits unverified availability and adds an image only when provided', () => {
    const withoutImage = realEstateListingSchema(property, {
      url: 'https://flamboyan.example/properti/tipe-56-90',
    })
    expect(withoutImage).not.toHaveProperty('image')
    expect(withoutImage.offers).not.toHaveProperty('availability')
    const withImage = realEstateListingSchema(
      { ...property, availability: 'AVAILABLE' },
      {
        url: 'https://flamboyan.example/properti/tipe-56-90',
        image: 'https://flamboyan.example/media/1/1920',
      },
    )
    expect(withImage.image).toBe('https://flamboyan.example/media/1/1920')
    expect(withImage.offers.availability).toBe(
      'https://schema.org/InStock',
    )
    expect(withImage.offers.itemOffered.floorSize.unitCode).toBe('MTK')
  })
  it('escapes closing tags inside serialized JSON-LD', () => {
    const text = jsonLdText({ name: '</script><script>alert(1)</script>' })
    expect(text).not.toContain('</script>')
    expect(text).toContain('\\u003c')
    expect(JSON.parse(text).name).toContain('alert(1)')
  })
})
