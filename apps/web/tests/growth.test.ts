import { describe, expect, it } from 'vitest'
import {
  jakartaPreferenceToIso,
  freshIdempotencyKey,
  normalizeWhatsappInput,
  submissionFingerprint,
  type InquirySubmission,
} from '../shared/utils/inquiries'
import { workspaceNavigation } from '../shared/utils/workspace'
import { staffGuide } from '../shared/content/staff-guide'

describe('public inquiry helpers', () => {
  it('uses sixteen fully random bytes for a 128-bit retry key', () => {
    const first = freshIdempotencyKey()
    expect(first).toMatch(/^[a-f0-9]{32}$/)
    expect(freshIdempotencyKey()).not.toBe(first)
  })
  it('normalizes contact input without storing or deriving identity', () => {
    expect(normalizeWhatsappInput('+62 812-3456-7890')).toBe('6281234567890')
    expect(normalizeWhatsappInput('0812 34 56')).toBe('08123456')
  })

  it('converts an explicit Jakarta preference to UTC', () => {
    expect(jakartaPreferenceToIso('2026-10-20T14:30')).toBe(
      '2026-10-20T07:30:00.000Z',
    )
    expect(jakartaPreferenceToIso('20-10-2026 14:30')).toBeNull()
  })

  it('creates a stable retry fingerprint and changes it with payload edits', () => {
    const base: InquirySubmission = {
      name: 'Contoh Pengunjung',
      whatsapp_number: '6281234567890',
      property_id: 11,
      purpose: 'CONSULTATION',
      privacy_notice_version: '2026-10-16',
      marketing_opt_in: false,
    }
    expect(submissionFingerprint(base)).toBe(submissionFingerprint({ ...base }))
    expect(submissionFingerprint(base)).not.toBe(
      submissionFingerprint({ ...base, purpose: 'VISIT_REQUEST' }),
    )
  })
})

describe('growth workspace scope', () => {
  it('shows raw inquiries only to Admin and outcome work to both roles', () => {
    const admin = workspaceNavigation('ADMIN')
      .flatMap((group) => group.links)
      .map((link) => link.to)
    const marketing = workspaceNavigation('MARKETING')
      .flatMap((group) => group.links)
      .map((link) => link.to)
    expect(admin).toContain('/backoffice/permintaan')
    expect(marketing).not.toContain('/backoffice/permintaan')
    expect(admin).toContain('/backoffice/hasil')
    expect(marketing).toContain('/backoffice/hasil')
    expect(staffGuide('ADMIN').map((topic) => topic.id)).toContain('permintaan')
    expect(staffGuide('MARKETING').map((topic) => topic.id)).not.toContain(
      'permintaan',
    )
  })
})
