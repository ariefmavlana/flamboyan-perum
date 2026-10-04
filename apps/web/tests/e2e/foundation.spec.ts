import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('property specifications and canonical are present in SSR HTML', async ({
  request,
  page,
}) => {
  const fixture = await demoProperty(request)
  const response = await request.get(`/properti/${fixture.slug}`)
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain(fixture.title)
  expect(html).toContain(fixture.land_area + ' m²')
  expect(html).toContain('rel="canonical"')
  await page.goto(`/properti/${fixture.slug}`)
  await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible()
  const missing = await request.get('/properti/tidak-ada')
  expect(missing.status()).toBe(404)
  const withoutCsrf = await request.post('/auth/login', {
    data: { email: 'marketing@example.test', password: 'not-a-valid-password' },
  })
  expect(withoutCsrf.status()).toBe(419)
  await page.screenshot({
    path: test.info().outputPath('detail-desktop.png'),
    fullPage: true,
  })
})

test('discovery filters preserve URL and mobile layout does not overflow', async ({
  page,
  request,
}) => {
  const fixture = await demoProperty(request)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByLabel('Cari lokasi atau nama properti').fill(fixture.title)
  await page.getByRole('button', { name: 'Jelajahi →' }).click()
  await expect(page).toHaveURL(/properti\?q=/)
  expect(new URL(page.url()).searchParams.get('q')).toBe(fixture.title)
  await expect(
    page.getByRole('heading', {
      name: 'Rumah yang selaras dengan rencana Anda.',
    }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: test.info().outputPath('catalog-mobile.png'),
    fullPage: true,
  })
})

test('session CSRF login, scoped lead drawer, notes, and logout', async ({
  page,
}) => {
  await page.goto('/backoffice')
  await expect(page).toHaveURL(/login/)
  await page.getByLabel('Email', { exact: true }).fill('marketing@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  const lead = await page.evaluate(
    async () =>
      (
        await (
          await fetch('/api/v1/leads?per_page=1', { credentials: 'include' })
        ).json()
      ).data[0] as { id: number; name: string },
  )
  await expect(page.getByText(lead.name, { exact: true })).toBeVisible()
  await page
    .getByRole('row')
    .filter({ hasText: lead.name })
    .getByRole('button', { name: 'Lihat histori →' })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: lead.name })).toBeVisible()
  const history = await page.evaluate(
    async (id) =>
      (
        await (
          await fetch(`/api/v1/leads/${id}/history`, {
            credentials: 'include',
          })
        ).json()
      ).data as { actor: { name: string } }[],
    lead.id,
  )
  expect(history.length).toBeGreaterThan(0)
  await expect(dialog.locator('.timeline time')).toHaveCount(history.length)
  await expect(
    dialog.getByText(history[0]!.actor.name, { exact: true }).first(),
  ).toBeVisible()
  const note = `Catatan pengujian ${Date.now()}`
  await dialog.getByLabel('Catatan / alasan').fill(note)
  await dialog.getByRole('button', { name: 'Tambah catatan' }).click()
  await expect(dialog.getByText(note, { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page).toHaveURL(/login/)
})
