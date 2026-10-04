import { expect, test, type Page } from '@playwright/test'
import type {
  EditorialContent,
  InternalMedia,
  Paginated,
  PublicContent,
  InternalProperty,
} from '../../shared/types'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
}
async function staff<T>(
  page: Page,
  path: string,
  method = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  return page.evaluate(
    async ({ path, method, body }) => {
      if (method !== 'GET')
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' })
      const xsrf = decodeURIComponent(
        document.cookie
          .split('; ')
          .find((item) => item.startsWith('XSRF-TOKEN='))
          ?.split('=')
          .slice(1)
          .join('=') ?? '',
      )
      const response = await fetch(path, {
        method,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrf,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      if (!response.ok)
        throw new Error(
          `Staff test API ${response.status}: ${await response.text()}`,
        )
      return response.json()
    },
    { path, method, body },
  ) as Promise<T>
}
async function findContent(
  page: Page,
  kind: EditorialContent['kind'],
  id: number,
) {
  let next = 1
  while (next) {
    const result = await staff<Paginated<EditorialContent>>(
      page,
      `/api/v1/internal/content?kind=${kind}&page=${next}`,
    )
    const record = result.data.find((item) => item.id === id)
    if (record) return record
    next = result.meta.current_page < result.meta.last_page ? next + 1 : 0
  }
  throw new Error('Fixture content not found')
}
async function saveContent(
  page: Page,
  record: EditorialContent,
  changes: Record<string, unknown>,
) {
  return staff<{ data: EditorialContent }>(
    page,
    `/api/v1/internal/content/${record.id}`,
    'PATCH',
    {
      kind: record.kind,
      payload: record.payload,
      position: record.position,
      published: record.published,
      verified: true,
      version: record.version,
      ...changes,
    },
  )
}

test('CMS photo selection updates SSR hero and video stays consent gated', async ({
  page,
  request,
}) => {
  test.setTimeout(90000)
  page.setDefaultTimeout(10000)
  await login(page)
  const content = (await (await request.get('/api/v1/content')).json())
    .data as PublicContent
  if (!content.hero?.property_id)
    throw new Error('Requires isolated seeded hero property')
  const original = await findContent(page, 'HERO', content.hero.id)
  const propertyId = content.hero.property_id
  const media = await staff<Paginated<InternalMedia>>(
    page,
    `/api/v1/internal/properties/${propertyId}/media`,
  )
  const photo = media.data.find(
    (item) => item.kind === 'PHOTO' && item.state === 'READY' && item.published,
  )
  if (!photo) throw new Error('Requires ready demo photo')
  let createdVideoId: number | undefined
  try {
    const publishedChoices = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/internal/properties?') &&
        new URL(response.url()).searchParams.get('publication') === 'PUBLISHED',
    )
    await page.goto('/backoffice/konten')
    const choices = (await (await publishedChoices).json())
      .data as InternalProperty[]
    expect(choices.every((item) => item.publication === 'PUBLISHED')).toBe(true)
    await page
      .getByRole('button', { name: `Edit konten #${original.id}`, exact: true })
      .click()
    const editor = page.getByRole('dialog')
    await editor
      .getByRole('combobox', { name: 'Foto atau video hero', exact: true })
      .selectOption(String(photo.id))
    await editor
      .getByLabel('Saya telah memverifikasi sumber', { exact: false })
      .check()
    await editor
      .getByRole('button', { name: 'Simpan konten', exact: true })
      .click()
    await expect(editor).not.toBeVisible()
    const changed = (await (await request.get('/api/v1/content')).json())
      .data as PublicContent
    expect(changed.hero?.media?.id).toBe(photo.id)
    const html = await (await request.get('/')).text()
    expect(html).toContain(changed.hero!.media!.sources.at(-1)!.url)
    await page.goto('/')
    await expect(page.locator('.editorial-hero-photo')).toHaveAttribute(
      'alt',
      photo.alt,
    )
    let video = media.data.find(
      (item) =>
        item.kind === 'VIDEO' && item.state === 'READY' && item.published,
    )
    if (!video) {
      const property = await staff<{ data: InternalProperty }>(
        page,
        `/api/v1/internal/properties/${propertyId}`,
      )
      const created = await staff<{
        data: InternalMedia
        property_version: number
      }>(page, `/api/v1/internal/properties/${propertyId}/media`, 'POST', {
        version: property.data.version,
        kind: 'VIDEO',
        alt: 'Video fixture pengujian CMS',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })
      createdVideoId = created.data.id
      await staff(
        page,
        `/api/v1/internal/properties/${propertyId}/media/${createdVideoId}`,
        'PATCH',
        { version: created.property_version, published: true },
      )
      video = { ...created.data, published: true }
    }
    const current = await findContent(page, 'HERO', original.id)
    await saveContent(page, current, {
      payload: { ...current.payload, media_id: video.id },
    })
    let externalRequests = 0
    await page.route('https://www.youtube-nocookie.com/**', (route) => {
      externalRequests++
      return route.fulfill({
        contentType: 'text/html',
        body: '<html><body>Video contract fixture</body></html>',
      })
    })
    await page.goto('/')
    await expect(page.locator('.hero-video-dialog iframe')).toHaveCount(0)
    expect(externalRequests).toBe(0)
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const control = await page.locator('.hero-video-control').boundingBox()
      const headline = await page.locator('h1').boundingBox()
      expect(control).not.toBeNull()
      expect(headline).not.toBeNull()
      expect(control!.y + control!.height).toBeLessThanOrEqual(headline!.y)
    }
    await page.getByRole('button', { name: 'Putar video hunian' }).click()
    await expect(
      page
        .getByRole('dialog', { name: 'Video hunian', exact: true })
        .locator('iframe'),
    ).toBeVisible()
    await expect.poll(() => externalRequests).toBeGreaterThan(0)
    await page.keyboard.press('Escape')
    await expect(page.locator('.hero-video-dialog iframe')).toHaveCount(0)
    const last = await findContent(page, 'HERO', original.id)
    await saveContent(page, last, { published: false })
    const unpublished = (await (await request.get('/api/v1/content')).json())
      .data as PublicContent
    expect(unpublished.hero?.id).not.toBe(original.id)
  } finally {
    const current = await findContent(page, 'HERO', original.id)
    await saveContent(page, current, {
      payload: original.payload,
      published: original.published,
      position: original.position,
      verified: Boolean(original.verified_at),
    })
    if (createdVideoId) {
      const property = await staff<{ data: InternalProperty }>(
        page,
        `/api/v1/internal/properties/${propertyId}`,
      )
      await staff(
        page,
        `/api/v1/internal/properties/${propertyId}/media/${createdVideoId}`,
        'PATCH',
        { version: property.data.version, archived: true },
      )
    }
  }
})

test('verified bank logo uploads, publishes and disappears when unpublished', async ({
  page,
  request,
}) => {
  test.setTimeout(60000)
  await login(page)
  const name = `Bank fixture CMS ${Date.now()}`
  let contentId: number | undefined
  try {
    await page.goto('/backoffice/konten')
    await page.getByLabel('Jenis konten baru').selectOption('BANK_PARTNER')
    await page
      .getByRole('button', { name: 'Tambah konten', exact: true })
      .click()
    const editor = page.getByRole('dialog')
    await editor.getByLabel('Nama bank mitra', { exact: true }).fill(name)
    await editor
      .getByLabel('Situs resmi bank HTTPS', { exact: true })
      .fill('https://example.com')
    const createdResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/internal/content') &&
        response.request().method() === 'POST',
    )
    await editor
      .getByRole('button', { name: 'Simpan konten', exact: true })
      .click()
    const created = (await (await createdResponse).json())
      .data as EditorialContent
    contentId = created.id
    await expect(editor.getByLabel('File logo bank')).toBeVisible()
    await editor.getByLabel('File logo bank').setInputFiles({
      name: 'fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        await page.evaluate(() => {
          const canvas = document.createElement('canvas')
          canvas.width = 120
          canvas.height = 48
          const context = canvas.getContext('2d')!
          context.fillStyle = '#873f2d'
          context.fillRect(0, 0, 120, 48)
          return canvas.toDataURL('image/png').split(',')[1]!
        }),
        'base64',
      ),
    })
    await editor
      .getByLabel('Saya telah memverifikasi izin logo', { exact: false })
      .check()
    await editor
      .getByRole('button', { name: 'Unggah logo bank', exact: true })
      .click()
    await expect(
      editor.getByText('Logo sudah diunggah.', { exact: false }),
    ).toBeVisible()
    expect(await (await request.get('/')).text()).not.toContain(name)
    await editor.getByLabel('Publikasikan', { exact: true }).check()
    await editor
      .getByLabel('Saya telah memverifikasi sumber', { exact: false })
      .check()
    await editor
      .getByRole('button', { name: 'Simpan konten', exact: true })
      .click()
    await expect(
      editor.getByText('Konten tersimpan.', { exact: true }),
    ).toBeVisible()
    expect(await (await request.get('/')).text()).toContain(name)
    const logo = await request.get(`/api/v1/content/${contentId}/logo`)
    expect(logo.ok()).toBe(true)
    expect(logo.headers()['content-type']).toContain('image/webp')
    await editor.getByLabel('Publikasikan', { exact: true }).uncheck()
    await editor
      .getByRole('button', { name: 'Simpan konten', exact: true })
      .click()
    await expect
      .poll(async () =>
        (await request.get(`/api/v1/content/${contentId}/logo`)).status(),
      )
      .toBe(404)
    expect(await (await request.get('/')).text()).not.toContain(name)
  } finally {
    if (contentId) {
      const current = await findContent(page, 'BANK_PARTNER', contentId)
      if (current.published)
        await saveContent(page, current, { published: false })
    }
  }
})
