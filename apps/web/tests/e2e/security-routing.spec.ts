import { expect, test } from '@playwright/test'

test('CSP reports stay in Nuxt while Laravel v1 keeps its authentication boundary', async ({
  request,
}) => {
  const report = await request.post('/api/csp-report', {
    data: {
      'csp-report': {
        'effective-directive': 'script-src',
        'blocked-uri': 'inline',
      },
    },
  })
  expect(report.status()).toBe(204)
  const oversized = await request.post('/api/csp-report', {
    data: Buffer.alloc(16 * 1024 + 1, 'x'),
    headers: { 'Content-Type': 'application/csp-report' },
  })
  expect(oversized.status()).toBe(413)
  const privateApi = await request.get('/api/v1/me')
  expect(privateApi.status()).toBe(401)
})
