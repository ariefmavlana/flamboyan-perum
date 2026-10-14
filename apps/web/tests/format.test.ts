import { describe, expect, it } from 'vitest'
import {
  formatArea,
  formatDate,
  formatDateRange,
  formatNumber,
  formatPercent,
} from '../shared/utils/format'

describe('Indonesian display formats', () => {
  it('renders ISO dates in Indonesian calendar form', () => {
    expect(formatDate('2026-10-05')).toBe('5 Okt 2026')
    expect(formatDate('2026-10-31')).toBe('31 Okt 2026')
    expect(formatDateRange('2026-10-05', '2026-10-31')).toBe(
      '5 Okt 2026–31 Okt 2026',
    )
  })
  it('keeps missing or unparseable values without inventing dates', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('belum dicantumkan')).toBe('belum dicantumkan')
    expect(formatDateRange('2026-10-05', null)).toBe('5 Okt 2026')
  })
  it('renders decimal values with Indonesian separators', () => {
    expect(formatNumber('2.75')).toBe('2,75')
    expect(formatNumber(1.5)).toBe('1,5')
    expect(formatNumber(90)).toBe('90')
    expect(formatPercent('2.75')).toBe('2,75%')
    expect(formatPercent(11)).toBe('11%')
  })
  it('drops artificial decimals on areas', () => {
    expect(formatArea('90.00')).toBe('90 m²')
    expect(formatArea('56.00')).toBe('56 m²')
    expect(formatArea('122.50')).toBe('122,5 m²')
    expect(formatArea(null)).toBe('')
    expect(formatArea('')).toBe('')
  })
})
