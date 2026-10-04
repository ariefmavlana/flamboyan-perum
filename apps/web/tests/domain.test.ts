import { describe, expect, it } from 'vitest'
import { whatsappLink } from '../shared/utils/catalog'
import { simulateMortgage, estimateBankFees } from '../shared/utils/mortgage'

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
  it('recalculates multiple fixed phases and subsequent floating without losing principal', () => {
    const changes = [
      { afterMonths: 36, annualRate: 7.99 },
      { afterMonths: 72, annualRate: 9.99 },
      { afterMonths: 120, annualRate: 11 },
    ]
    const result = simulateMortgage(456700000, 0, 20, 4, undefined, changes)
    for (const change of changes) {
      const remaining = result.schedule[change.afterMonths - 1]!.balance
      const r = change.annualRate / 1200
      expect(result.schedule[change.afterMonths]!.payment).toBeCloseTo(
        (remaining * r) / (1 - (1 + r) ** -(240 - change.afterMonths)),
        2,
      )
    }
    expect(
      result.schedule.reduce((sum, row) => sum + row.principal, 0),
    ).toBeCloseTo(456700000, 2)
    expect(result.schedule.at(-1)?.balance).toBe(0)
    expect(() =>
      simulateMortgage(456700000, 0, 10, 4, undefined, changes),
    ).toThrow(RangeError)
    expect(() =>
      simulateMortgage(456700000, 0, 20, 4, undefined, [
        changes[1]!,
        changes[0]!,
      ]),
    ).toThrow(RangeError)
  })
  it('uses published bank fee floors and caps and preserves unknown costs', () => {
    const terms = {
      provision_percent: 1,
      admin_percent: 0.1,
      admin_min_idr: 500000,
      admin_max_idr: 3000000,
      appraisal_min_idr: 1100000,
      appraisal_max_idr: 1500000,
    }
    expect(estimateBankFees(456700000, terms)).toEqual({
      provision: 4567000,
      administration: 500000,
      appraisalMin: 1100000,
      appraisalMax: 1500000,
    })
    expect(estimateBankFees(1000000000, terms).administration).toBe(1000000)
    expect(estimateBankFees(4000000000, terms).administration).toBe(3000000)
    expect(estimateBankFees(456700000, {}).provision).toBeNull()
  })
  it('recalculates floating payments from the remaining balance and term', () => {
    const result = simulateMortgage(500000000, 100000000, 20, 5, {
      afterMonths: 36,
      annualRate: 12,
    })
    const beforeReset = result.schedule[35]!
    const reset = result.schedule[36]!
    const r = 12 / 1200
    expect(reset.payment).toBeCloseTo(
      (beforeReset.balance * r) / (1 - (1 + r) ** -(240 - 36)),
      2,
    )
    expect(reset.payment).toBeGreaterThan(result.monthlyPayment)
    expect(result.schedule.at(-1)?.balance).toBe(0)
    expect(
      result.schedule.reduce((sum, row) => sum + row.principal, 0),
    ).toBeCloseTo(result.principal, 2)
    expect(result.totalPayment).toBeCloseTo(
      result.schedule.reduce((sum, row) => sum + row.payment, 0),
      2,
    )
  })
  it('handles floating zero rate, full DP and rejects invalid reset months', () => {
    const zero = simulateMortgage(120000000, 0, 10, 0, {
      afterMonths: 12,
      annualRate: 0,
    })
    expect(zero.schedule[12]?.payment).toBeCloseTo(1000000, 2)
    expect(
      simulateMortgage(120000000, 120000000, 10, 5, {
        afterMonths: 12,
        annualRate: 20,
      }).totalPayment,
    ).toBe(0)
    for (const afterMonths of [0, 120, 1.5, NaN])
      expect(() =>
        simulateMortgage(100000000, 0, 10, 5, { afterMonths, annualRate: 12 }),
      ).toThrow(RangeError)
  })
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
