import { expect, test } from '@playwright/test'

test('property specifications and canonical are present in SSR HTML', async ({
  request,
  page,
}) => {
  const response = await request.get('/properti/rumah-taman-demo')
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain('Rumah Taman')
  expect(html).toContain('90.00 m²')
  expect(html).toContain('rel="canonical"')
  await page.goto('/properti/rumah-taman-demo')
  await expect(
    page.getByRole('heading', { name: 'Rumah Taman — Demo' }),
  ).toBeVisible()
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
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByLabel('Cari lokasi atau nama properti').fill('Rumah Taman')
  await page.getByRole('button', { name: 'Jelajahi →' }).click()
  await expect(page).toHaveURL(/properti\?q=Rumah/)
  await expect(
    page.getByRole('heading', {
      name: 'Rumah yang selaras dengan rencana Anda.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Rumah Taman — Demo' }),
  ).toBeVisible()
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
  await expect(page.getByText('Prospek Demo', { exact: true })).toBeVisible()
  await page
    .getByRole('row')
    .filter({ hasText: 'Prospek Demo' })
    .getByRole('button', { name: 'Lihat histori →' })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: 'Prospek Demo' }),
  ).toBeVisible()
  await expect(
    dialog.getByText('Assignment demo', { exact: true }),
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
