import { describe, expect, it } from 'vitest'
import { whatsappLink } from '../shared/utils/catalog'
import { simulateMortgage } from '../shared/utils/mortgage'

describe('WhatsApp handoff', () => {
  it('includes the property context safely', () => {
    const url = new URL(
      whatsappLink(
        '628123456789',
        'Rumah & Taman',
        'https://example.com/properti/rumah',
      )!,
    )
    expect(url.hostname).toBe('wa.me')
    expect(url.searchParams.get('text')).toContain(
      'Rumah & Taman. https://example.com/properti/rumah',
    )
  })
  it('hides invalid or missing configuration', () => {
    expect(whatsappLink('', 'Rumah', 'https://example.com')).toBeNull()
    expect(whatsappLink('javascript:alert(1)', '', '')).toBeNull()
  })
})
describe('Mortgage kernel', () => {
  it('handles zero interest and full down payment', () => {
    expect(simulateMortgage(120000000, 0, 10, 0).monthlyPayment).toBe(1000000)
    expect(simulateMortgage(120000000, 120000000, 10, 12).totalPayment).toBe(0)
  })
  it('amortizes fully and preserves total principal', () => {
    const result = simulateMortgage(500000000, 100000000, 20, 8)
    expect(result.monthlyPayment).toBeCloseTo(3345760.28, 1)
    expect(result.schedule.at(-1)?.balance).toBe(0)
    expect(
      result.schedule.reduce((sum, row) => sum + row.principal, 0),
    ).toBeCloseTo(400000000, 2)
    expect(result.totalInterest).toBeGreaterThan(0)
  })
  it('rejects invalid bounds and nonfinite numbers', () => {
    for (const values of [
      [0, 0, 1, 0],
      [100, 101, 1, 1],
      [100, 0, 31, 1],
      [100, 0, 2, -1],
      [NaN, 0, 1, 1],
    ]) {
      expect(() =>
        simulateMortgage(...(values as [number, number, number, number])),
      ).toThrow(RangeError)
    }
  })
})
