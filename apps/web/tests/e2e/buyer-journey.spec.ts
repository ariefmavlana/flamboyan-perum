import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('buyer can discuss a real public property and safely share its canonical URL', async ({
  page,
  request,
}) => {
  const property = await demoProperty(request)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException('Denied', 'NotAllowedError')
        },
      },
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/properti/${property.slug}`)
  const canonical = await page
    .locator('link[rel=canonical]')
    .getAttribute('href')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https?:\/\//,
  )
  await page.getByRole('button', { name: 'Bagikan rumah' }).click()
  await expect(page.getByLabel('Tautan rumah', { exact: true })).toHaveValue(
    canonical!,
  )
  await expect(page.getByLabel('Tautan rumah', { exact: true })).toBeFocused()
  await page.goto(`/konsultasi?properti=${property.slug}&tujuan=kunjungan`)
  await expect(
    page.getByRole('heading', { name: property.title }),
  ).toBeVisible()
  await expect(page.getByLabel('Topik konsultasi')).toHaveValue('kunjungan')
  await page
    .getByLabel('Pertanyaan Anda')
    .fill('Apakah denah & waktu kunjungan tersedia?')
  const link = page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' })
  await expect(link).toBeVisible()
  const handoff = new URL((await link.getAttribute('href'))!)
  expect(handoff.hostname).toBe('wa.me')
  expect(handoff.searchParams.get('text')).toContain(property.title)
  expect(handoff.searchParams.get('text')).toContain(canonical!)
  expect(handoff.searchParams.get('text')).toContain('denah & waktu kunjungan')
  await expect(
    page.getByText('Jadwal kunjungan belum terkonfirmasi.', { exact: false }),
  ).toBeVisible()
  await page.goto('/konsultasi?tujuan=pembiayaan')
  await expect(page.getByLabel('Topik konsultasi')).toHaveValue('pembiayaan')
  await expect(
    page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' }),
  ).toBeVisible()
  await page.goto('/konsultasi?properti=tidak-ada-fixture-987654')
  await expect(page.getByRole('alert')).toContainText('belum dapat dimuat')
  await expect(
    page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' }),
  ).toHaveCount(0)
})

test('editorial buyer pages are SSR, discoverable, responsive and have real next steps', async ({
  page,
  request,
}) => {
  test.setTimeout(90000)
  const routes = [
    '/bandung-timur',
    '/panduan',
    '/panduan/kunjungan-rumah',
    '/panduan/memilih-lokasi',
    '/panduan/merencanakan-pembiayaan',
    '/konsultasi',
  ]
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      expect(await page.locator('main a[href="#"]').count()).toBe(0)
    }
  }
  const sitemap = await request.get('/sitemaps/pages.xml')
  for (const route of routes) expect(await sitemap.text()).toContain(route)
  const article = await request.get('/panduan/kunjungan-rumah')
  expect(await article.text()).toContain('Mulai dari keseharian Anda')
  const missing = await request.get('/panduan/tidak-ada')
  expect(missing.status()).toBe(404)
})
