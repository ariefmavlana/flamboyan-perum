import { expect, test } from '@playwright/test'
import { formatArea } from '../../shared/utils/format'
import { demoProperty } from './helpers'

test('WhatsApp CTAs preserve the property preview across SSR, SPA and consultation', async ({
  page,
  request,
}) => {
  const property = await demoProperty(request)
  const path = `/properti/${property.slug}`
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/properti?q=${encodeURIComponent(property.title)}`)
  const cardLink = await page
    .locator('.property-card')
    .filter({ hasText: property.title })
    .getByRole('link', { name: 'WhatsApp Admin', exact: true })
    .getAttribute('href')
  expect(new URL(cardLink!).searchParams.get('text')).toContain(path)
  await page.goto(`${path}?utm_source=preview-test#galeri`)
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute('href')
  expect(canonical).toBeTruthy()
  const ctas = page.locator('a[href^="https://wa.me/"]')
  expect(await ctas.count()).toBeGreaterThanOrEqual(3)
  for (const href of await ctas.evaluateAll((links) =>
    links.map((link) => link.href),
  )) {
    const message = new URL(href).searchParams.get('text')!
    expect(message).toContain(canonical!)
    expect(message).not.toContain('preview-test')
    expect(message).not.toContain('#galeri')
  }

  // Parse a new HTTP document, rather than hydrated metadata a crawler never sees.
  const response = await request.get(path)
  expect(response.status()).toBe(200)
  const html = await response.text()
  const meta = html.match(/<meta\b[^>]*property="og:image"[^>]*>/g) ?? []
  expect(meta).toHaveLength(1)
  const image = meta[0]!
    .match(/content="([^"]+)"/)?.[1]
    ?.replaceAll('&amp;', '&')
  expect(image).toBeTruthy()
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    (await page.locator('.property-gallery img').first().getAttribute('alt')) ??
      '',
  )
  const photo = await request.get(image!)
  expect(photo.status()).toBe(200)
  expect(photo.headers()['content-type']).toMatch(/^image\//)

  await page
    .getByRole('link', { name: 'Rencanakan kunjungan', exact: true })
    .click()
  await expect(page).toHaveURL(/\/konsultasi\?properti=/)
  await expect(
    page.getByRole('link', { name: 'Lanjutkan ke WhatsApp', exact: true }),
  ).toBeVisible()
  for (const href of await ctas.evaluateAll((links) =>
    links.map((link) => link.href),
  ))
    expect(new URL(href).searchParams.get('text')).toContain(canonical!)

  const options = (
    await (await request.get('/api/v1/inquiries/options')).json()
  ).data as { property_id: number; title: string; canonical_path: string }[]
  const other = options.find((option) => option.property_id !== property.id)!
  expect(other).toBeTruthy()
  await page
    .getByRole('combobox', { name: 'Tipe rumah yang diminati', exact: true })
    .selectOption(String(other.property_id))
  const changed = await page
    .getByRole('link', { name: 'Lanjutkan ke WhatsApp', exact: true })
    .getAttribute('href')
  const changedMessage = new URL(changed!).searchParams.get('text')!
  expect(changedMessage).toContain(other.title)
  expect(changedMessage).toContain(other.canonical_path)
  expect(changedMessage).not.toContain(path)
  // Only the unowned WhatsApp destination is blocked; local analytics uses the real API.
  await page.route('https://wa.me/**', (route) => route.abort())
  const recordedClick = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/analytics') &&
      response.request().postDataJSON()?.event === 'whatsapp_click',
  )
  await page
    .getByRole('link', { name: 'Lanjutkan ke WhatsApp', exact: true })
    .click()
  const clickResponse = await recordedClick
  expect(clickResponse.status()).toBe(202)
  expect(clickResponse.request().postDataJSON().property_id).toBe(
    other.property_id,
  )

  await page
    .getByRole('navigation', { name: 'Navigasi footer' })
    .getByRole('link', { name: 'Banjaran · mendatang', exact: true })
    .click()
  await expect(page).toHaveURL(/\/perumahan\/banjaran$/)
  for (const href of await ctas.evaluateAll((links) =>
    links.map((link) => link.href),
  ))
    expect(new URL(href).searchParams.get('text')).toContain(
      '/perumahan/banjaran',
    )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /editorial-garden-1920\.webp$/,
  )
})

test('property specifications and canonical are present in SSR HTML', async ({
  request,
  page,
}) => {
  const fixture = await demoProperty(request)
  const response = await request.get(`/properti/${fixture.slug}`)
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain(fixture.title)
  expect(html).toContain(formatArea(fixture.land_area))
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
  await page.getByRole('button', { name: 'Cari properti', exact: true }).click()
  await expect(page).toHaveURL(/properti\?q=/)
  expect(new URL(page.url()).searchParams.get('q')).toBe(fixture.title)
  await expect(
    page.getByRole('heading', {
      name: 'Temukan rumah yang tepat.',
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
  await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click()
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await page.getByRole('button', { name: 'Sembunyikan kata sandi' }).click()
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute(
    'type',
    'password',
  )
  await page.getByRole('button', { name: 'Masuk' }).click()
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
    .getByRole('button', { name: 'Buka detail' })
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
