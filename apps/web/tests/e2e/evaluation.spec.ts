import { expect, test } from '@playwright/test'

test('full filters, persistent comparison, floating KPR and factual SEO work on mobile', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/properti')
  await page.evaluate(() =>
    localStorage.setItem(
      'flamboyan-comparison',
      JSON.stringify([999999991, 999999992, 999999993]),
    ),
  )
  await page.reload()
  await page
    .getByRole('button', { name: 'Bandingkan properti', exact: true })
    .first()
    .click()
  await expect(
    page.getByText('Maksimum 3 properti. Hapus satu pilihan terlebih dahulu.'),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Bandingkan 3 properti →' }).click()
  for (const id of [999999991, 999999992, 999999993])
    await page.getByRole('button', { name: `Hapus pilihan #${id}` }).click()
  await page.goto('/properti')
  await page
    .getByText('Filter spesifikasi dan ketersediaan', { exact: true })
    .click()
  await page.getByLabel('Lokasi tepat').fill('Bogor (contoh)')
  await page.getByLabel('Minimum kamar tidur').fill('3')
  await page.getByLabel('Kondisi', { exact: true }).selectOption('NEW')
  await page.getByRole('button', { name: 'Terapkan spesifikasi' }).click()
  await expect(page).toHaveURL(/bedrooms=3/)
  await expect(
    page.getByRole('heading', { name: 'Rumah Taman — Demo' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Bandingkan properti', exact: true })
    .first()
    .click()
  await page.reload()
  await page.getByRole('link', { name: 'Bandingkan 1 properti →' }).click()
  await expect(
    page.getByText(
      'Tambahkan pilihan hingga minimal 2 properti untuk dibandingkan.',
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Rumah Taman — Demo' }),
  ).toBeVisible()
  const property = (
    await (await request.get('/api/v1/properties/rumah-taman-demo')).json()
  ).data as { id: number }
  await page.goto(`/bandingkan?ids=${property.id},999999999`)
  await expect(
    page.getByRole('button', { name: 'Hapus pilihan #999999999' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Hapus pilihan #999999999' }).click()
  await expect(page).not.toHaveURL(/999999999/)
  await page
    .getByRole('link', { name: 'Rumah Taman — Demo', exact: true })
    .click()
  await page.getByLabel('Skenario fixed lalu floating').check()
  await page.getByLabel('Asumsi bunga floating (%)').fill('12')
  await expect(page.getByText('Cicilan setelah fixed / bulan')).toBeVisible()
  await page.getByLabel('Uang muka (IDR)').fill('850000000')
  await expect(
    page
      .locator('dt')
      .filter({ hasText: 'Pokok pinjaman' })
      .locator('..')
      .locator('dd'),
  ).toContainText('0')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const html = await (await request.get('/properti/rumah-taman-demo')).text()
  expect(html).toContain('application/ld+json')
  expect(html).toContain('RealEstateListing')
  expect(html).not.toContain('aggregateRating')
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).toContain('/sitemaps/properties-1.xml')
  expect(
    await (await request.get('/sitemaps/properties-1.xml')).text(),
  ).toContain('/properti/rumah-taman-demo')
  expect((await request.get('/sitemaps/properties-10000.xml')).status()).toBe(
    404,
  )
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Disallow: /backoffice',
  )
  await page.screenshot({
    path: test.info().outputPath('evaluation-mobile.png'),
    fullPage: true,
  })
})

test('Admin curates verified testimonial and location; map stays consent gated', async ({
  page,
  request,
}) => {
  test.setTimeout(60000)
  const name = `Testimonial fixture ${Date.now()}`
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  await page.getByRole('link', { name: 'Konten publik', exact: true }).click()
  await page.getByLabel('Jenis konten baru').selectOption('TESTIMONIAL')
  await page.getByRole('button', { name: 'Tambah konten' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nama publik berizin').fill(name)
  await dialog
    .getByLabel('Testimonial berizin')
    .fill('Konten pengujian terisolasi, bukan testimonial bisnis.')
  await dialog.getByLabel('Keterangan publik').fill('Fixture browser')
  await dialog.getByLabel('Publikasikan', { exact: true }).check()
  await dialog.getByLabel('Saya telah memverifikasi', { exact: false }).check()
  await dialog.getByRole('button', { name: 'Simpan konten' }).click()
  await expect(dialog).not.toBeVisible()
  expect(await (await request.get('/')).text()).toContain(name)
  const row = page.getByRole('row').filter({ hasText: name })
  await row.getByRole('button', { name: /Edit konten/ }).click()
  await dialog.getByLabel('Publikasikan', { exact: true }).uncheck()
  await dialog.getByRole('button', { name: 'Simpan konten' }).click()
  await expect(dialog).not.toBeVisible()
  expect(await (await request.get('/')).text()).not.toContain(name)
  await page.getByRole('link', { name: 'Katalog', exact: true }).click()
  await page.getByLabel('Cari properti', { exact: true }).fill('Rumah Taman')
  await page.getByRole('button', { name: 'Cari / muat ulang' }).click()
  await page
    .getByRole('row')
    .filter({ hasText: 'Rumah Taman — Demo' })
    .getByRole('button', { name: 'Edit properti' })
    .click()
  await dialog.getByLabel('Latitude', { exact: true }).fill('-6.6')
  await dialog.getByLabel('Longitude', { exact: true }).fill('106.8')
  await dialog
    .getByRole('button', { name: 'Simpan lokasi', exact: true })
    .click()
  await expect(
    dialog.getByText('Lokasi dan referensi tersimpan.'),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/properti/rumah-taman-demo')
  expect(await page.locator('iframe').count()).toBe(0)
  await page.route('https://www.openstreetmap.org/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body>Map contract fixture</body></html>',
    }),
  )
  await page.getByRole('button', { name: 'Muat peta OpenStreetMap' }).click()
  await expect(
    page.getByTitle('Peta lokasi properti', { exact: true }),
  ).toBeVisible()
})
