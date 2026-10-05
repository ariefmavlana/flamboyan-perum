import { expect, test, type Page } from '@playwright/test'
import type { LeadSummary } from '../../shared/utils/leads'

async function login(page: Page, role = 'admin') {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(`${role}@example.test`)
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(
    page.getByRole('heading', { name: 'Mulai dari sini' }),
  ).toBeVisible()
  await expect(page.locator('.work-queue').first()).toBeEnabled()
}

test('public navigation, sourced visuals and neutral focus work on desktop and mobile', async ({
  page,
}) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
    await expect(
      nav.getByRole('link', { name: 'Bandung Timur', exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Mulai mencari hunian' }),
    ).toBeVisible()
    await page.locator('img').evaluateAll(async (images) => {
      for (const image of images) image.loading = 'eager'
      await Promise.all(
        images.map((image) => image.decode().catch(() => undefined)),
      )
    })
    expect(
      await page
        .locator('img')
        .evaluateAll((images) =>
          images
            .filter((image) => !image.naturalWidth)
            .map((image) => image.src),
        ),
    ).toEqual([])
    const input = page.getByLabel('Cari lokasi atau nama properti')
    await input.fill('Bandung')
    await expect(input).toBeFocused()
    expect(
      await input.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('none')
    expect(
      await input.evaluate((element) => getComputedStyle(element).boxShadow),
    ).toContain('69, 85, 78')
    await page.keyboard.press('Tab')
    expect(
      await page
        .getByRole('button', { name: 'Jelajahi →' })
        .evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('solid')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: test.info().outputPath(`public-${width}.png`),
      fullPage: true,
    })
  }
  expect(errors).toEqual([])
})

test('Admin sees complete queue totals, URL filters survive reload, and notifications open', async ({
  page,
}) => {
  await login(page)
  const summary = await page.evaluate(
    async () =>
      (await (await fetch('/api/v1/leads/summary')).json()).data as LeadSummary,
  )
  await expect(
    page
      .locator('.work-queue')
      .filter({ hasText: 'Belum ditugaskan' })
      .locator('strong'),
  ).toHaveText(String(summary.work.unassigned))
  await page
    .locator('.work-queue')
    .filter({ hasText: 'Belum ditugaskan' })
    .click()
  await expect(page).toHaveURL(/work=unassigned/)
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  const filtered = await page.evaluate(
    async () =>
      (await (await fetch('/api/v1/leads?work=unassigned')).json()).meta
        .total as number,
  )
  expect(filtered).toBe(summary.work.unassigned)
  await page.reload()
  await expect(
    page.locator('.work-queue').filter({ hasText: 'Belum ditugaskan' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page
    .locator('.stage-filters')
    .getByRole('button', { name: 'Pembelian selesai' })
    .click()
  await expect(page).toHaveURL(/status=DEAL/)
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.goBack()
  await expect(page).toHaveURL(/work=unassigned/)
  await page.getByRole('link', { name: /^Notifikasi,/ }).click()
  await expect(page.locator('#notifications')).toHaveAttribute('open', '')
})

test('Marketing workspace has scoped actions, readable mobile records and guarded closure', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, 'marketing')
  await expect(
    page.getByRole('button', { name: 'Catat lead baru' }),
  ).toHaveCount(0)
  await expect(page.locator('.work-queue')).toHaveCount(3)
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await expect(
    page.getByRole('button', { name: 'Buka detail →' }).first(),
  ).toBeEnabled()
  let releaseContact = () => {}
  const contactGate = new Promise<void>((resolve) => {
    releaseContact = resolve
  })
  await page.route('**/api/v1/leads?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('work') === 'contact')
      await contactGate
    await route.continue()
  })
  try {
    await page
      .locator('.work-queue')
      .filter({ hasText: 'Perlu dihubungi' })
      .click()
    await expect(page.locator('.crm-results')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(
      page.getByRole('button', { name: 'Buka detail →' }).first(),
    ).toBeDisabled()
  } finally {
    releaseContact()
  }
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  // Reapplying the same queue must reload instead of remaining busy forever.
  await page
    .locator('.work-queue')
    .filter({ hasText: 'Perlu dihubungi' })
    .click()
  await expect(page.locator('.crm-results')).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.getByRole('button', { name: 'Buka detail →' }).first().click()
  const drawer = page.getByRole('dialog')
  await expect(
    drawer.getByRole('heading', { name: 'Hubungi calon pembeli' }),
  ).toBeVisible()
  await expect(
    drawer.getByText('Penanggung jawab Marketing', { exact: true }),
  ).toHaveCount(0)
  await drawer.getByLabel('Tahap berikutnya').selectOption('LOST')
  await expect(
    drawer.getByRole('button', { name: 'Simpan status' }),
  ).toBeDisabled()
  await drawer
    .getByLabel('Catatan / alasan')
    .fill('Contoh alasan penutupan untuk validasi UI')
  await expect(
    drawer.getByRole('button', { name: 'Simpan status' }),
  ).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: test.info().outputPath('marketing-mobile.png'),
    fullPage: true,
  })
})

test('catalog sections and content purposes isolate the task being edited', async ({
  page,
}) => {
  await login(page)
  await page
    .getByRole('link', { name: 'Katalog properti', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Foto & media', exact: true })
    .first()
    .click()
  const drawer = page.getByRole('dialog')
  await expect(drawer.getByLabel('File media', { exact: true })).toBeVisible()
  await expect(drawer.getByLabel('Judul', { exact: true })).not.toBeVisible()
  await drawer
    .getByRole('button', { name: 'Informasi utama', exact: true })
    .click()
  await expect(drawer.getByLabel('Judul', { exact: true })).toBeVisible()
  await expect(
    drawer.getByLabel('File media', { exact: true }),
  ).not.toBeVisible()
  await drawer
    .getByRole('button', { name: 'Harga & pembayaran', exact: true })
    .click()
  await expect(drawer.getByLabel('Judul', { exact: true })).not.toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'Konten publik', exact: true }).click()
  await page
    .locator('.content-purpose-grid')
    .getByRole('button', { name: /Kawasan & kontak/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Kawasan & kontak', exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('Jenis konten baru')).toHaveValue('DEVELOPMENT')
  await page.screenshot({
    path: test.info().outputPath('admin-content.png'),
    fullPage: true,
  })
})

test('failed summary is not shown as zero work and can be retried', async ({
  page,
}) => {
  await page.route('**/api/v1/leads/summary', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"unavailable"}',
    }),
  )
  await login(page)
  await expect(
    page.getByText('Ringkasan belum dapat dimuat.', { exact: false }),
  ).toBeVisible()
  await expect(page.locator('.work-queue strong').first()).toHaveText('—')
  await expect(
    page.getByRole('button', { name: 'Buka detail →' }).first(),
  ).toBeVisible()
  await page.unroute('**/api/v1/leads/summary')
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.locator('.work-queue strong').first()).not.toHaveText('—')
})
