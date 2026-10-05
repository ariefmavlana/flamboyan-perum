import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('Admin monitors sanitized readiness and Marketing cannot read operations', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await page.getByRole('link', { name: 'Kesehatan sistem', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Kesehatan layanan' }),
  ).toBeVisible()
  await expect(
    page.locator('dt').filter({ hasText: 'Job tertunda' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill('marketing@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  await page.goto('/backoffice/operasi')
  await expect(
    page.getByRole('alert').filter({ hasText: '403' }),
  ).not.toBeVisible()
  await expect(
    page.locator('dt').filter({ hasText: 'Job tertunda' }),
  ).not.toBeVisible()
  const denied = await page.evaluate(
    async () =>
      (await fetch('/api/v1/internal/operations', { credentials: 'include' }))
        .status,
  )
  expect(denied).toBe(403)
})

test('production SSR nonce CSP permits hydration, calculator and comparison at 320px without script violations', async ({
  page,
  request,
}) => {
  const origin = process.env.E2E_PRODUCTION_ORIGIN
  test.skip(
    !origin,
    'Requires separately running built SSR acceptance artifact',
  )
  const fixture = await demoProperty(request, origin)
  const violations: string[] = []
  await page.addInitScript(() => {
    window.addEventListener('securitypolicyviolation', (event) => {
      if (event.violatedDirective.startsWith('script-src'))
        document.documentElement.dataset.cspViolation = event.violatedDirective
    })
  })
  page.on('pageerror', (error) => violations.push(error.message))
  await page.setViewportSize({ width: 320, height: 800 })
  const response = await page.goto(`${origin}/properti/${fixture.slug}`)
  expect(response?.status()).toBe(200)
  const csp = response?.headers()['content-security-policy'] ?? ''
  expect(csp).toContain("script-src 'self' 'nonce-")
  expect(csp).not.toContain('unsafe-eval')
  await expect(
    page.getByRole('heading', { name: fixture.title, exact: true }),
  ).toBeVisible()
  await page.getByLabel('Skenario fixed lalu floating').check()
  await page.getByLabel('Asumsi bunga floating (%)').fill('12')
  await expect(page.getByText('Cicilan setelah fixed / bulan')).toBeVisible()
  await page
    .getByRole('button', { name: 'Bandingkan properti', exact: true })
    .click()
  await expect(
    page.getByRole('link', { name: 'Bandingkan 1 properti →' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  expect(
    await page.evaluate(() => document.documentElement.dataset.cspViolation),
  ).toBeUndefined()
  expect(violations).toEqual([])
  const second = await request.get(`${origin}/properti/${fixture.slug}`)
  expect(second.headers()['content-security-policy']).not.toBe(csp)
  const recovery = await request.get(
    `${origin}/reset-password?token=synthetic-test`,
  )
  expect(recovery.headers()['referrer-policy']).toBe('no-referrer')
  const login = await request.get(`${origin}/login`)
  expect(login.headers()['referrer-policy']).toBe('same-origin')
  const publicApi = await request.get(`${origin}/api/v1/properties`)
  expect(publicApi.headers()['x-content-type-options']).toBe('nosniff')
  const invalidHost = await request.get(`${origin}/properti`, {
    headers: { Host: 'untrusted.example.test' },
  })
  expect(invalidHost.status()).toBe(400)
})
