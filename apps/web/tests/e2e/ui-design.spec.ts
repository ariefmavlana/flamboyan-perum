import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('public navigation, responsive pages and comparison stay usable at 320, 768 and 1440px', async ({
  page,
  request,
}) => {
  test.setTimeout(180000)
  const fixture = await demoProperty(request)
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  await expect(nav).not.toBeVisible()
  await menu.click()
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: 'Jelajahi properti' }).focus()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(nav).not.toBeVisible()
  await menu.click()
  await nav.getByRole('link', { name: 'Jelajahi properti' }).click()
  await expect(page).toHaveURL(/\/properti$/)
  await expect(nav).not.toBeVisible()
  const paths = [
    '/',
    '/properti',
    `/properti/${fixture.slug}`,
    '/bandingkan',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/privasi',
  ]
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of paths) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main input:disabled')).toHaveCount(0)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} overflow at ${width}`,
      ).toBe(true)
      if (
        ['/', '/properti', `/properti/${fixture.slug}`, '/login'].includes(path)
      ) {
        await page.screenshot({
          path: test
            .info()
            .outputPath(
              `public-${path === '/' ? 'home' : path.split('/').pop()}-${width}.png`,
            ),
          fullPage: false,
        })
      }
    }
  }
  expect(failures).toEqual([])
})

test('staff menu, all workspace pages and modal remain accessible on small screens', async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      '/backoffice',
      '/backoffice/properti',
      '/backoffice/konten',
      '/backoffice/akun',
      '/backoffice/laporan',
      '/backoffice/privasi',
      '/backoffice/operasi',
      '/backoffice/profil',
    ]) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main input:disabled')).toHaveCount(0)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} overflow at ${width}`,
      ).toBe(true)
      await page.screenshot({
        path: test
          .info()
          .outputPath(`staff-${path.split('/').pop()}-${width}.png`),
        fullPage: false,
      })
    }
  }
  await page.setViewportSize({ width: 320, height: 800 })
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  await menu.click()
  const nav = page.getByRole('navigation', { name: 'Workspace tim' })
  await nav.getByRole('link', { name: 'Katalog', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(nav).not.toBeVisible()
  await menu.click()
  await nav.getByRole('link', { name: 'Katalog', exact: true }).click()
  await expect(nav).not.toBeVisible()
  await page.getByRole('button', { name: 'Tambah properti' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  )
  await page.screenshot({
    path: test.info().outputPath('staff-property-editor-320.png'),
    fullPage: false,
  })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Tambah properti' }),
  ).toBeFocused()
})

test('missing property shows a branded 404 and a working recovery action', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const response = await page.goto('/properti/ui-redesign-missing-property')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'Halaman tidak ditemukan.' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Kembali ke beranda' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/')
  await expect(page.getByLabel('Cari lokasi atau nama properti')).toBeEnabled()
})
