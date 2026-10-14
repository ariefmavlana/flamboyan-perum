import type { Property } from '../types'
import { siteOrigin } from './seo'

export function jsonLdText(schema: Record<string, unknown>): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export function websiteSchema(siteUrl: string, name = 'Flamboyan Perum') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteOrigin(siteUrl),
    inLanguage: 'id-ID',
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

const availabilityMap = {
  AVAILABLE: 'InStock',
  BOOKED: 'Reserved',
  SOLD_OUT: 'SoldOut',
} as const

export function realEstateListingSchema(
  property: Property,
  options: { url: string; image?: string | null },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: options.url,
    ...(options.image ? { image: options.image } : {}),
    offers: {
      '@type': 'Offer',
      price: property.price_idr,
      priceCurrency: 'IDR',
      ...(property.availability === 'CHECK_REQUIRED'
        ? {}
        : {
            availability: `https://schema.org/${availabilityMap[property.availability]}`,
          }),
      itemOffered: {
        '@type': 'House',
        name: property.title,
        address: {
          '@type': 'PostalAddress',
          streetAddress: property.address,
          addressLocality: property.location,
          addressCountry: 'ID',
        },
        floorSize: {
          '@type': 'QuantitativeValue',
          value: Number(property.building_area),
          unitCode: 'MTK',
        },
        numberOfBedrooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
      },
    },
  }
}
