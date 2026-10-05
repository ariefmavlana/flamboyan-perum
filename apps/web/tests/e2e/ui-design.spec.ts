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
  await expect(page.getByText(/calon pembeli.*Halaman/)).toBeVisible()
  const primaryRequest: Record<string, string> = {
    '/backoffice': '/api/v1/leads',
    '/backoffice/properti': '/api/v1/internal/properties',
    '/backoffice/konten': '/api/v1/internal/content',
    '/backoffice/akun': '/api/v1/internal/users',
    '/backoffice/laporan': '/api/v1/internal/reports',
    '/backoffice/privasi': '/api/v1/internal/privacy',
    '/backoffice/operasi': '/api/v1/internal/operations',
    '/backoffice/profil': '/api/v1/me',
  }
  const apiFailures: number[] = []
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/') && response.status() >= 400)
      apiFailures.push(response.status())
  })
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
      if (new URL(page.url()).pathname !== path) {
        const ready = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === primaryRequest[path] &&
            response.request().method() === 'GET',
        )
        if (width <= 900)
          await page.getByRole('button', { name: 'Menu', exact: true }).click()
        await page
          .getByRole('navigation', { name: 'Workspace tim' })
          .locator('a[href="' + path + '"]')
          .click()
        await expect(page).toHaveURL('http://127.0.0.1:3000' + path)
        const response = await ready
        expect(response.ok()).toBe(true)
        await response.finished()
      }
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main input:disabled')).toHaveCount(0)
      await expect(page.locator('main h1')).toBeVisible()
      if (path === '/backoffice') {
        await expect(
          page.getByText(/calon pembeli.*Halaman/),
        ).toBeVisible()
        await expect(
          page.getByText('Memuat workspace…', { exact: true }),
        ).not.toBeVisible()
      } else if (
        [
          '/backoffice/properti',
          '/backoffice/konten',
          '/backoffice/akun',
        ].includes(path)
      ) {
        await expect(page.locator('main tbody tr').first()).toBeVisible()
      } else if (path === '/backoffice/laporan') {
        await expect(page.locator('.report-metrics')).toBeVisible()
      } else if (path === '/backoffice/privasi') {
        await expect(
          page.getByText('Kandidat tanpa data kontak', { exact: true }),
        ).toBeVisible()
      } else if (path === '/backoffice/operasi') {
        await expect(page.locator('main .spec-grid').first()).toBeVisible()
      } else {
        await expect(page.getByLabel('Nama', { exact: true })).not.toHaveValue(
          '',
        )
      }
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
  await nav.getByRole('link', { name: 'Katalog properti', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(nav).not.toBeVisible()
  await menu.click()
  await nav.getByRole('link', { name: 'Katalog properti', exact: true }).click()
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
  expect(apiFailures).toEqual([])
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

test('applied filters can be removed independently and restored with browser back', async ({
  page,
  request,
}) => {
  const fixture = await demoProperty(request)
  const query = new URLSearchParams({
    location: fixture.location,
    bedrooms: String(fixture.bedrooms),
    condition: fixture.condition,
    sort: 'price_asc',
    page: '2',
  })
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto(`/properti?${query}`)
  await page
    .getByRole('link', {
      name: 'Hapus filter Minimum kamar tidur',
      exact: true,
    })
    .click()
  await expect(page).not.toHaveURL(/bedrooms=/)
  const current = new URL(page.url()).searchParams
  expect(current.get('location')).toBe(fixture.location)
  expect(current.get('condition')).toBe(fixture.condition)
  expect(current.get('sort')).toBe('price_asc')
  expect(current.has('page')).toBe(false)
  await expect(
    page.getByLabel('Minimum kamar tidur', { exact: true }),
  ).toHaveValue('')
  await page.goBack()
  await expect(
    page.getByRole('link', {
      name: 'Hapus filter Minimum kamar tidur',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByLabel('Minimum kamar tidur', { exact: true }),
  ).toHaveValue(String(fixture.bedrooms))
  await page.getByRole('link', { name: 'Reset filter', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/properti')
  await expect(page.locator('.filter-chip')).toHaveCount(0)
  await expect(page.getByLabel('Urutkan')).toHaveValue('newest')
})

test('mobile detail places price and contact before description and location', async ({
  page,
  request,
}) => {
  const fixture = await demoProperty(request)
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto(`/properti/${fixture.slug}`)
  await page.waitForLoadState('networkidle')
  const contact = page.getByRole('link', {
    name: 'Hubungi Admin melalui WhatsApp ↗',
  })
  await expect(contact).toBeVisible()
  const contactBox = await contact.boundingBox()
  const aboutBox = await page
    .getByRole('heading', { name: 'Tentang rumah ini' })
    .boundingBox()
  expect(contactBox!.y + contactBox!.height).toBeLessThan(aboutBox!.y)
  const summary = page.locator('.detail-summary')
  await summary.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: test.info().outputPath('mobile-price-contact.png'),
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('editorial images load and testimonial blocks do not overlap across viewports', async ({
  page,
}) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    // Hero now comes from verified CMS media; its caption is not a fixed stock asset.
    const hero = page.locator('.editorial-hero-photo')
    await expect(hero).toBeVisible()
    await expect(hero).toHaveAttribute('alt', /\S+/)
    for (const photo of await page.locator('main img').all()) {
      await photo.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          photo.evaluate((element) => {
            const image = element as HTMLImageElement
            return image.complete && image.naturalWidth > 0
          }),
        )
        .toBe(true)
    }
    const quotes = page.locator('.testimonials figure')
    const boxes = await quotes.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      }),
    )
    expect(boxes.length).toBeGreaterThan(1)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!
        const b = boxes[j]!
        expect(
          a.x + a.width <= b.x + 1 ||
            b.x + b.width <= a.x + 1 ||
            a.y + a.height <= b.y + 1 ||
            b.y + b.height <= a.y + 1,
        ).toBe(true)
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: test.info().outputPath(`editorial-full-${width}.png`),
      fullPage: true,
    })
  }
})
