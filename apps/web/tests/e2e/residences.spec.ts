import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('residences are discoverable and distinguish the Banjaran concept from the catalog', async ({
  page,
  request,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await request.get('/perumahan/banjaran')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('Hidup lebih pelan.')
  expect(await response.text()).toContain('belum merupakan')
  const sitemap = await request.get('/sitemaps/pages.xml')
  expect(await sitemap.text()).toContain('/perumahan/banjaran</loc>')
  expect((await request.get('/perumahan/tidak-ada')).status()).toBe(404)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: 'Perumahan', exact: true })
    .click()
  await expect(page).toHaveURL(/\/perumahan$/)
  await expect(
    page.getByRole('navigation', { name: 'Navigasi utama' }),
  ).not.toBeVisible()
  await page.getByRole('link', { name: 'Jelajahi konsep Banjaran' }).click()
  await expect(page.locator('h1')).toContainText('Hidup lebih pelan.')
  const question = page.getByText(
    'Apakah visual ini menunjukkan rumah yang dijual?',
    { exact: true },
  )
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Belum. Seluruh visual Banjaran', { exact: false }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Bicarakan Banjaran', exact: true })
    .click()
  await expect(page).toHaveURL(/konsultasi\?kawasan=banjaran$/)
  await expect(
    page.getByRole('heading', { name: 'Banjaran · hunian mendatang' }),
  ).toBeVisible()
  await page
    .getByLabel('Pertanyaan Anda')
    .fill('Saya tertarik dengan rencana Banjaran.')
  const contact = page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' })
  await expect(contact).toBeVisible()
  const url = new URL((await contact.getAttribute('href'))!)
  expect(url.hostname).toBe('wa.me')
  expect(url.searchParams.get('text')).toContain(
    'Rencana hunian Banjaran — Flamboyan',
  )
  expect(url.searchParams.get('text')).toContain('/perumahan/banjaran')
  expect(url.searchParams.get('text')).toContain(
    'Saya tertarik dengan rencana Banjaran.',
  )
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Banjaran · hunian mendatang' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('residence layouts and reduced motion work across mobile, tablet and desktop', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/perumahan', '/perumahan/banjaran']) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect(image).toHaveJSProperty('complete', true)
        expect(
          await image.evaluate(
            (element: HTMLImageElement) => element.naturalWidth,
          ),
        ).toBeGreaterThan(0)
      }
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({
        path: testInfo.outputPath(
          `${route.endsWith('banjaran') ? 'banjaran' : 'residences'}-${width}.png`,
        ),
        fullPage: true,
      })
    }
  }
  expect(
    await page
      .locator('.banjaran-hero-copy')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none')
})

test('consultation preserves published property priority and ignores unknown areas', async ({
  page,
  request,
}) => {
  const property = await demoProperty(request)
  await page.goto(`/konsultasi?kawasan=banjaran&properti=${property.slug}`)
  await expect(
    page.getByRole('heading', { name: property.title }),
  ).toBeVisible()
  const contact = page.getByRole('link', { name: 'Lanjutkan ke WhatsApp' })
  await expect(contact).toBeVisible()
  let url = new URL((await contact.getAttribute('href'))!)
  expect(url.searchParams.get('text')).toContain(property.title)
  expect(url.searchParams.get('text')).not.toContain('Rencana hunian Banjaran')
  await page.goto('/konsultasi?kawasan=banjaran&properti=tidak-ada-banjaran')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(contact).toHaveCount(0)
  await page.goto('/konsultasi?kawasan=lokasi-palsu')
  await expect(contact).toBeVisible()
  url = new URL((await contact.getAttribute('href'))!)
  expect(url.searchParams.get('text')).not.toContain('lokasi-palsu')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  )
})
