import type { InquiryPurpose } from '../growth-types'

export interface InquirySubmission {
  name: string
  whatsapp_number: string
  property_id: number
  purpose: InquiryPurpose
  preferred_visit_at?: string
  message?: string
  privacy_notice_version: string
  marketing_opt_in: boolean
  attribution_token?: string
}

export function normalizeWhatsappInput(value: string) {
  if (!/^\+?[0-9 ()-]+$/.test(value)) return ''
  return value.replace(/[ ()-]/g, '').replace(/^\+/, '')
}

export function jakartaPreferenceToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const [date, time] = value.split('T')
  const [year, month, day] = date!.split('-').map(Number)
  const [hour, minute] = time!.split(':').map(Number)
  if (year! < 2000 || year! > 2100 || month! < 1 || month! > 12 || hour! > 23 || minute! > 59 || day! < 1) return null
  const calendar = new Date(Date.UTC(year!, month! - 1, day!))
  if (calendar.getUTCMonth() !== month! - 1 || calendar.getUTCDate() !== day) return null
  const timestamp = Date.UTC(year!, month! - 1, day!, hour! - 7, minute!)
  if (!Number.isFinite(timestamp)) return null
  const parsed = new Date(timestamp)
  return parsed.toISOString()
}

export function submissionFingerprint(body: InquirySubmission) {
  return JSON.stringify(body, Object.keys(body).sort())
}

export function freshIdempotencyKey() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Pembuatan referensi aman tidak tersedia. Gunakan HTTPS dan coba kembali.')
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}
