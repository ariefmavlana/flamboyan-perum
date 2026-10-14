const JAKARTA_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function toDate(value: string): Date {
  const match = JAKARTA_CALENDAR_DATE.exec(value)
  if (match)
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
    )
  return new Date(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  if (!from || !to) return formatDate(from) || formatDate(to)
  return `${formatDate(from)}–${formatDate(to)}`
}

export function formatNumber(
  value: string | number,
  maximumFractionDigits = 2,
): string {
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value ?? '')
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(
    number,
  )
}

export function formatArea(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  return `${formatNumber(value)} m²`
}

export function formatPercent(
  value: string | number,
  maximumFractionDigits = 2,
): string {
  return `${formatNumber(value, maximumFractionDigits)}%`
}
