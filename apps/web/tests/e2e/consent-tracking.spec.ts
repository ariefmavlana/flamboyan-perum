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

test('Google event context follows public SPA pages and clears a revoked referrer chain', async ({ page }) => {
  test.skip(!/^GTM-[A-Z0-9]+$/.test(process.env.NUXT_PUBLIC_GTM_ID ?? ''), 'Run server and test with an explicit NUXT_PUBLIC_GTM_ID.')
  // The vendor is external; this checks the application's real Google command
  // interface, not whether a published third-party container honors it.
  await page.route('**://www.googletagmanager.com/**', (route) => route.abort())
  const gtmRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) gtmRequests.push(request.url())
  })
  await page.goto('/?privacy_probe=synthetic-test#ignored')
  const banner = page.getByRole('region', { name: 'Pilihan privasi' })
  await expect(banner).toBeVisible()
  expect(gtmRequests).toEqual([])
  await banner.getByRole('button', { name: 'Terima semua' }).click()
  await expect.poll(() => gtmRequests.length).toBe(1)
  const latestContext = () => page.evaluate(() => {
    const commands = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []
    return commands.filter((command) => command[0] === 'set' &&
      typeof command[1] === 'object' && command[1] !== null &&
      'page_location' in command[1]).at(-1)?.[1]
  })
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  const origin = new URL(canonical!).origin
  await expect.poll(latestContext).toEqual({
    page_location: `${origin}/`, page_referrer: '', send_page_view: false,
  })
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Panduan', exact: true }).click()
  await expect(page).toHaveURL(/\/panduan$/)
  await expect.poll(latestContext).toEqual({
    page_location: `${origin}/panduan`, page_referrer: `${origin}/`, send_page_view: false,
  })
  await page.getByRole('button', { name: 'Pilihan privasi', exact: true }).click()
  await banner.getByRole('button', { name: 'Tolak opsional' }).click()
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Bandingkan', exact: true }).click()
  await expect(page).toHaveURL(/\/bandingkan$/)
  await page.getByRole('button', { name: 'Pilihan privasi', exact: true }).click()
  await banner.getByRole('button', { name: 'Terima semua' }).click()
  await expect.poll(latestContext).toEqual({
    page_location: `${origin}/bandingkan`, page_referrer: '', send_page_view: false,
  })
})
