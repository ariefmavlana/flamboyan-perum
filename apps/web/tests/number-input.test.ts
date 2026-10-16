import { expect, it } from 'vitest'
import {
  displayNumberInput,
  parseNumberInput,
  numberInputError,
} from '../shared/utils/number-input'

it('groups typed and pasted rupiah without changing the canonical amount', () => {
  for (const [typed, display, raw] of [
    ['1000', '1.000', '1000'],
    ['1000000', '1.000.000', '1000000'],
    ['Rp 1.000.000', '1.000.000', '1000000'],
    ['0', '0', '0'],
    ['', '', ''],
  ]) {
    expect(parseNumberInput(typed!)).toEqual({ text: display, raw, error: '' })
  }
  expect(displayNumberInput('456700000')).toBe('456.700.000')
  expect(displayNumberInput(null)).toBe('')
  expect(parseNumberInput('1.0000', true)).toEqual({
    text: '10.000',
    raw: '10000',
    error: '',
  })
  expect(parseNumberInput('1000.000', true)).toEqual({
    text: '1.000.000',
    raw: '1000000',
    error: '',
  })
})

it('supports Indonesian decimal input, trailing comma, and negative coordinates', () => {
  expect(parseNumberInput('8,5')).toEqual({
    text: '8,5',
    raw: '8.5',
    error: '',
  })
  expect(parseNumberInput('1000,00')).toEqual({
    text: '1.000,00',
    raw: '1000',
    error: '',
  })
  expect(parseNumberInput('8,')).toEqual({ text: '8,', raw: '8', error: '' })
  expect(parseNumberInput('0001000').raw).toBe('1000')
  expect(parseNumberInput('-6,9123456').raw).toBe('-6.9123456')
  expect(displayNumberInput('-6.9123456')).toBe('-6,9123456')
})

it('rejects ambiguous decimal dots, foreign separators, exponent notation and unsafe values', () => {
  for (const value of [
    '8.5',
    '1,000,000',
    '1e6',
    '1.000abc',
    '1.00',
    '9007199254740992',
  ]) {
    expect(parseNumberInput(value).error).not.toBe('')
    expect(parseNumberInput(value).raw).toBe('')
  }
})

it('preserves min, max and step validation including decimal coordinates', () => {
  expect(numberInputError('1000', 1, 1000000000000)).toBe('')
  expect(numberInputError('0', 1)).toContain('minimum 1')
  expect(numberInputError('1000001', 0, 1000000)).toContain(
    'maksimum 1.000.000',
  )
  expect(numberInputError('8.55', 0, 30, '0.01')).toBe('')
  expect(numberInputError('8.555', 0, 30, '0.01')).toContain('maksimal 2')
  expect(numberInputError('8.5500', 0, 30, '0.01')).toBe('')
  expect(numberInputError('999999999999.99999', 0, 1000000000000, 1)).toContain(
    'bilangan bulat',
  )
  expect(numberInputError('-6.9123456', -90, 90, '0.0000001')).toBe('')
  expect(numberInputError('12.5', 0, 30)).not.toBe('')
})
