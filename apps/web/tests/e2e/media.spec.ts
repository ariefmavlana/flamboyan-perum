import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('private upload is processed by the real worker, SSR gallery serves sanitized images and archive revokes access', async ({
  page,
  request,
}) => {
  test.setTimeout(60000)
  const fixture = await demoProperty(request)
  const alt = `Gambar fixture ${Date.now()}`
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  await page.getByRole('link', { name: 'Katalog properti', exact: true }).click()
  await page.getByLabel('Cari properti', { exact: true }).fill(fixture.title)
  await page.getByRole('button', { name: 'Cari / muat ulang' }).click()
  await page
    .getByRole('row')
    .filter({ hasText: fixture.title })
    .getByRole('button', { name: 'Foto & media', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Deskripsi gambar / media', { exact: true }).fill(alt)
  await dialog
    .getByLabel('File media', { exact: true })
    .setInputFiles(
      process.env.E2E_MEDIA_FILE ?? '../../.tools/browser-photo.jpg',
    )
  await dialog
    .getByRole('button', { name: 'Tambah media', exact: true })
    .click()
  const item = dialog.locator('.media-editor').filter({ hasText: alt })
  await expect(item.getByRole('img')).toBeVisible({ timeout: 20000 })
  await page.keyboard.press('Escape')
  const publicData = await request.get(`/api/v1/properties/${fixture.slug}`)
  const property = (await publicData.json()).data as {
    media: { id: number; alt: string; sources: { url: string }[] }[]
  }
  const media = property.media.find((value) => value.alt === alt)
  expect(media).toBeDefined()
  const image = await request.get(media!.sources[0]!.url)
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toContain('image/webp')
  expect(image.headers()['x-content-type-options']).toBe('nosniff')
  const html = await (await request.get(`/properti/${fixture.slug}`)).text()
  expect(html).toContain(alt)
  expect(html).not.toContain('marketing@example.test')
  await page.goto(`/properti/${fixture.slug}`)
  await page
    .getByRole('button', { name: 'Perbesar gambar properti' })
    .first()
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Gambar properti diperbesar' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/backoffice/properti')
  await page.getByLabel('Cari properti', { exact: true }).fill(fixture.title)
  await page.getByRole('button', { name: 'Cari / muat ulang' }).click()
  await page
    .getByRole('row')
    .filter({ hasText: fixture.title })
    .getByRole('button', { name: 'Foto & media', exact: true })
    .click()
  await page
    .locator('.media-editor')
    .filter({ hasText: alt })
    .getByRole('button', { name: 'Arsipkan media' })
    .click()
  await expect(
    page.locator('.media-editor').filter({ hasText: alt }),
  ).toHaveCount(0)
  expect((await request.get(media!.sources[0]!.url)).status()).toBe(404)
})
