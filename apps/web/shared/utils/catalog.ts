import { cleanPageLocation } from './acquisition'

export function whatsappContextUrl(
  siteUrl: string,
  path: string,
  query: Record<string, unknown> = {},
  verifiedPropertySlug?: string,
): string {
  let contextPath = (path.split(/[?#]/, 1)[0] || '/').replace(/\/+$/, '') || '/'
  if (contextPath === '/konsultasi') {
    const slug = query.properti
    if (
      typeof slug === 'string' &&
      slug === verifiedPropertySlug &&
      /^[a-z0-9-]{1,160}$/.test(slug)
    )
      contextPath = `/properti/${slug}`
    else if (
      query.kawasan === 'banjaran' ||
      query.kawasan === 'bukit-flamboyan-indah-2'
    )
      contextPath = `/perumahan/${query.kawasan}`
    else contextPath = '/properti'
  }
  return cleanPageLocation(siteUrl, contextPath) ?? new URL(siteUrl).origin
}

export function formatIdr(value: string | number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
export function whatsappLink(
  number: string,
  title: string,
  propertyUrl: string,
): string | null {
  if (!/^[1-9]\d{7,14}$/.test(number)) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(`Halo Admin Flamboyan, saya tertarik dengan ${title}. ${propertyUrl}`)}`
}
export const availabilityLabels = {
  AVAILABLE: 'Tersedia',
  BOOKED: 'Dipesan',
  SOLD_OUT: 'Terjual',
  CHECK_REQUIRED: 'Konfirmasi unit',
} as const
export function propertyUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/properti/${encodeURIComponent(slug)}`
}
export function consultationLink(
  number: string,
  intent: string,
  title: string,
  url: string,
): string | null {
  if (!/^[1-9]\d{7,14}$/.test(number)) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(`Halo Admin Flamboyan, saya ingin berdiskusi tentang ${intent.toLowerCase()}${title ? ` untuk ${title}` : ' di Bandung Timur'}. Mohon informasi dan konfirmasi langkah berikutnya. ${url}`)}`
}
