import { expect, test } from '@playwright/test'
import {
  developmentPhotos,
  gateDay,
  gateDusk,
  siteplan,
  logo,
} from '../../shared/content/flamboyan-assets'
import type { Property } from '../../shared/types'

const projectPath = '/perumahan/bukit-flamboyan-indah-2'

test('the project publishes every actual photo, both gate illustrations and the siteplan in SSR', async ({
  request,
}) => {
  const response = await request.get(projectPath)
  expect(response.status()).toBe(200)
  const html = await response.text()
  for (const asset of [...developmentPhotos, gateDay, gateDusk, siteplan]) {
    expect(html).toContain(`data-asset-key="${asset.key}"`)
    expect(html).toContain(asset.alt)
  }
  expect(html.match(/data-asset-key=/g)).toHaveLength(20)
  expect(html).toContain('Tipe rumah pada dokumentasi ini dikonfirmasi')
  expect(html).not.toContain('.mp4')
  expect(html).not.toContain('/images/flamboyan-kawasan.webp')
  const sitemap = await request.get('/sitemaps/pages.xml')
  expect(await sitemap.text()).toContain(`${projectPath}</loc>`)
})

test('all project images load and the actual gallery supports arrows, focus trapping and Escape', async ({
  page,
}) => {
  test.setTimeout(120000)
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  await page.goto(projectPath)
  await expect(page.locator('#dokumentasi figure[data-asset-key]')).toHaveCount(
    17,
  )
  await expect(
    page.locator('#rancangan-gerbang figure[data-asset-key]'),
  ).toHaveCount(2)
  await expect(page.locator('#siteplan figure[data-asset-key]')).toHaveCount(1)
  for (const image of await page
    .locator('main figure[data-asset-key] img')
    .all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveJSProperty('complete', true)
    expect(
      await image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    ).toBeGreaterThan(0)
  }
  const opener = page.locator('#dokumentasi figure button').first()
  await opener.click()
  const dialog = page.getByRole('dialog', {
    name: 'Dokumentasi aktual kawasan diperbesar',
  })
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    developmentPhotos[0]!.alt,
  )
  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    developmentPhotos[1]!.alt,
  )
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    developmentPhotos.at(-1)!.alt,
  )
  await dialog.getByRole('button', { name: 'Gambar berikutnya' }).focus()
  await page.keyboard.press('Tab')
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true)
  await expect(
    dialog.getByRole('button', { name: 'Tutup gambar' }),
  ).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(
    dialog.getByRole('button', { name: 'Gambar berikutnya' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(opener).toBeFocused()
  await page.locator('#siteplan figure button').click()
  const plan = page.getByRole('dialog', { name: 'Siteplan kawasan diperbesar' })
  await expect(plan.getByRole('img')).toHaveCSS('object-fit', 'contain')
  await expect(
    plan.getByRole('button', { name: 'Gambar berikutnya' }),
  ).toBeDisabled()
  await expect(
    plan.getByRole('link', { name: 'Buka siteplan ukuran penuh' }),
  ).toHaveAttribute('href', siteplan.sources.at(-1)!.url)
  expect(failures).toEqual([])
})

test('project images, official brand and siteplan remain usable from 320px to desktop', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(projectPath)
    await expect(page.locator('h1')).toContainText('Bukit Flamboyan')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await expect(page.locator('.public-header .brand img')).toHaveAttribute(
      'src',
      logo.src,
    )
    await expect(page.locator('.footer-main .brand img')).toHaveAttribute(
      'src',
      logo.src,
    )
    const siteplanOpener = page.locator('#siteplan figure button')
    expect((await siteplanOpener.boundingBox())!.height).toBeGreaterThan(0)
    await siteplanOpener.click()
    const dialog = page.getByRole('dialog', {
      name: 'Siteplan kawasan diperbesar',
    })
    await expect(dialog).toBeVisible()
    const bounds = (await dialog.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await page.keyboard.press('Escape')
    await page.evaluate(() => scrollTo(0, 0))
    if (width === 320 || width === 1440) {
      await page.screenshot({
        path: testInfo.outputPath(`flamboyan-project-${width}.png`),
        fullPage: true,
      })
    }
  }
})

test('project consultation carries the correct project name and canonical context', async ({
  page,
}) => {
  await page.goto(projectPath)
  await page.getByRole('link', { name: 'Diskusikan Bukit Flamboyan' }).click()
  await expect(
    page.getByRole('heading', { name: 'Bukit Flamboyan Indah 2', exact: true }),
  ).toBeVisible()
  const handoff = page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' })
  await expect(handoff).toBeVisible()
  const url = new URL((await handoff.getAttribute('href'))!)
  expect(url.hostname).toBe('wa.me')
  expect(url.searchParams.get('text')).toContain('Bukit Flamboyan Indah 2')
  expect(url.searchParams.get('text')).toContain(projectPath)
})

test('project cards use API values and reject a slug with a mismatched house type', async ({
  page,
}) => {
  const property: Property = {
    id: 99101,
    slug: 'bukit-flamboyan-indah-2-36-60',
    title: 'Rumah fixture katalog 36/60',
    house_type: '36/60',
    condition: 'NEW',
    certificate: 'Periksa bersama Admin',
    location: 'Lokasi fixture',
    address: 'Alamat fixture',
    description: 'Konten API khusus pengujian.',
    price_idr: '543210000',
    land_area: '60.00',
    building_area: '36.00',
    bedrooms: 2,
    bathrooms: 1,
    availability: 'CHECK_REQUIRED',
    featured: false,
  }
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      json: {
        data: [
          property,
          {
            ...property,
            id: 99102,
            title: 'Tipe yang salah',
            house_type: '69/80',
          },
        ],
        meta: { current_page: 1, last_page: 1, total: 2, per_page: 48 },
        links: { prev: null, next: null },
      },
    }),
  )
  await page.goto('/perumahan')
  await expect(page.locator('.public-header .nav-toggle')).toBeEnabled()
  await page
    .getByRole('link', { name: 'Kenali perumahan', exact: true })
    .click()
  await expect(page.locator('#pilihan-rumah .property-card')).toHaveCount(1)
  await expect(page.locator('#pilihan-rumah')).toContainText(property.title)
  await expect(page.locator('#pilihan-rumah')).toContainText('543.210.000')
  await expect(page.locator('#pilihan-rumah')).not.toContainText(
    'Tipe yang salah',
  )
})

test('a catalog failure leaves the documentation available and presents a retry', async ({
  page,
}) => {
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      status: 503,
      json: { statusMessage: 'Katalog belum dapat dimuat.' },
    }),
  )
  await page.goto('/perumahan')
  await expect(page.locator('.public-header .nav-toggle')).toBeEnabled()
  await page
    .getByRole('link', { name: 'Kenali perumahan', exact: true })
    .click()
  await expect(page.locator('#pilihan-rumah [role="alert"]')).toContainText(
    'Pilihan rumah belum dapat dimuat.',
  )
  await expect(page.locator('#pilihan-rumah .property-card')).toHaveCount(0)
  await expect(
    page.locator('#pilihan-rumah').getByRole('button', { name: 'Coba lagi' }),
  ).toBeVisible()
  await expect(page.locator('figure[data-asset-key]')).toHaveCount(20)
})
