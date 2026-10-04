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
} as const
