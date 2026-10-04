import { describe, expect, it } from 'vitest'
import { propertyUrl, consultationLink } from '../shared/utils/catalog'
describe('Buyer handoff', () => {
  it('keeps a stable canonical URL with trailing slash configuration', () => {
    expect(propertyUrl('https://flamboyan.example///', 'rumah-1')).toBe(
      'https://flamboyan.example/properti/rumah-1',
    )
  })
  it('encodes visit intentions without pretending a booking is confirmed', () => {
    const link = consultationLink(
      '628123456789',
      'Kunjungan rumah',
      'Rumah & taman',
      'https://flamboyan.example/properti/rumah-1',
    )
    const message = new URL(link!).searchParams.get('text')!
    expect(message).toMatch(/kunjungan rumah/i)
    expect(message).toContain('Rumah & taman')
    expect(message).toContain('https://flamboyan.example/properti/rumah-1')
    expect(message).not.toMatch(/terkonfirmasi|berhasil dipesan/i)
    expect(consultationLink('', 'Kunjungan rumah', '', '')).toBeNull()
  })
})
