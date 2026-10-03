import { describe, expect, it } from 'vitest'
import { trustedClientIp } from '../shared/utils/client-ip'

describe('trusted edge client identification', () => {
  it('ignores spoofed headers on direct connections', () => {
    expect(trustedClientIp('::ffff:127.0.0.1', '203.0.113.8', [])).toBe(
      '127.0.0.1',
    )
  })
  it('walks only explicitly trusted hops from the right', () => {
    expect(
      trustedClientIp('127.0.0.1', 'spoofed, 203.0.113.8, 10.0.0.1', [
        '127.0.0.1',
        '10.0.0.1',
      ]),
    ).toBe('203.0.113.8')
    expect(
      trustedClientIp('127.0.0.1', Array(20).fill('203.0.113.8').join(','), [
        '127.0.0.1',
      ]),
    ).toBe('127.0.0.1')
  })
})
