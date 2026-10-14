import { expect, test } from '@playwright/test'

const trackingHosts = ['googletagmanager.com', 'connect.facebook.net']

test('no optional tracking request happens before a visitor decides', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (trackingHosts.some((host) => request.url().includes(host)))
      requests.push(request.url())
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(requests).toEqual([])
})

test('consent banner gates GTM and remembers the choice', async ({ page }) => {
  await page.route('**://www.googletagmanager.com/**', (route) => route.abort())
  const gtmRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com'))
      gtmRequests.push(request.url())
  })
  await page.goto('/')
  const banner = page.getByRole('region', { name: 'Pilihan privasi' })
  const configured = await banner
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false)
  test.skip(
    !configured,
    'NUXT_PUBLIC_GTM_ID tidak diset pada server yang diuji.',
  )
  expect(gtmRequests).toEqual([])
  await banner.getByRole('button', { name: 'Tolak opsional' }).click()
  await expect(banner).toBeHidden()
  await page.waitForTimeout(300)
  expect(gtmRequests).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Pilihan privasi' }),
  ).toBeHidden()
  expect(gtmRequests).toEqual([])
  await page.getByRole('button', { name: 'Pilihan privasi' }).click()
  await expect(banner).toBeVisible()
  await banner.getByRole('button', { name: 'Atur pilihan' }).focus()
  await page.keyboard.press('Enter')
  const analyticsToggle = banner.getByRole('checkbox', {
    name: /Analitik/,
  })
  await expect(analyticsToggle).toBeVisible()
  await expect(analyticsToggle).not.toBeChecked()
  await banner.getByRole('button', { name: 'Terima semua' }).click()
  await expect
    .poll(() => gtmRequests.length, { timeout: 5000 })
    .toBeGreaterThan(0)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Pilihan privasi' }),
  ).toBeHidden()
})
