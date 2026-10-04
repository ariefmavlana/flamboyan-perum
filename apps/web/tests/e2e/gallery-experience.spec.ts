import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from '@playwright/test'
import type { PublicMedia } from '../../shared/types'
import { demoProperty } from './helpers'

const image = (
  id: number,
  kind: 'PHOTO' | 'FLOOR_PLAN',
  alt: string,
): PublicMedia => ({
  id,
  kind,
  alt,
  position: id,
  url: null,
  width: kind === 'PHOTO' ? 1200 : 600,
  height: kind === 'PHOTO' ? 800 : 1400,
  sources: [
    {
      url: `/__gallery-fixture__/${id}.svg`,
      width: kind === 'PHOTO' ? 1200 : 600,
      height: kind === 'PHOTO' ? 800 : 1400,
    },
  ],
})
const media: PublicMedia[] = [
  image(91001, 'PHOTO', 'Taman rumah fixture'),
  image(91002, 'PHOTO', 'Ruang keluarga fixture'),
  image(91003, 'FLOOR_PLAN', 'Denah vertikal fixture'),
  {
    id: 91004,
    kind: 'VIDEO',
    alt: 'Video hunian fixture',
    position: 3,
    url: 'https://www.youtube-nocookie.com/embed/fixture',
    width: null,
    height: null,
    sources: [],
  },
  {
    id: 91005,
    kind: 'TOUR',
    alt: 'Tur hunian fixture',
    position: 4,
    url: 'https://my.matterport.com/show/?m=fixture',
    width: null,
    height: null,
    sources: [],
  },
]

async function openGallery(
  page: Page,
  request: APIRequestContext,
  fixtureMedia = media,
) {
  const property = await demoProperty(request)
  await page.route('**/__gallery-fixture__/*.svg', async (route) => {
    const portrait = route.request().url().includes('91003')
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 600 : 1200}" height="${portrait ? 1400 : 800}"><rect width="100%" height="100%" fill="#ddd4c6"/><rect x="10" y="10" width="90%" height="90%" fill="none" stroke="#4b4338" stroke-width="8"/></svg>`,
    })
  })
  await page.route(`**/api/v1/properties/${property.slug}`, (route) =>
    route.fulfill({ json: { data: { ...property, media: fixtureMedia } } }),
  )
  await page.goto('/properti?sort=price_asc')
  await expect(
    page
      .getByRole('button', { name: 'Bandingkan properti', exact: true })
      .first(),
  ).toBeEnabled()
  await page.locator(`a[href="/properti/${property.slug}"]`).first().click()
  await expect(
    page.getByRole('button', { name: 'Perbesar gambar properti' }),
  ).toBeEnabled()
}

test('gallery groups photos and uncropped floor plans; dialog arrows and Escape retain focus', async ({
  page,
  request,
}) => {
  await openGallery(page, request)
  await page.getByRole('button', { name: 'Foto (2)', exact: true }).click()
  const opener = page.getByRole('button', { name: 'Perbesar gambar properti' })
  await opener.click()
  const dialog = page.getByRole('dialog', {
    name: 'Gambar properti diperbesar',
  })
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    'Taman rumah fixture',
  )
  await page.keyboard.press('ArrowRight')
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    'Ruang keluarga fixture',
  )
  await expect(dialog.getByText('2 / 2', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Gambar sebelumnya' }).click()
  await expect(dialog.getByRole('img')).toHaveAttribute(
    'alt',
    'Taman rumah fixture',
  )
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(opener).toBeFocused()
  await page.getByRole('button', { name: 'Denah (1)', exact: true }).click()
  await expect(opener.getByRole('img')).toHaveAttribute(
    'alt',
    'Denah vertikal fixture',
  )
  await expect(opener.getByRole('img')).toHaveCSS('object-fit', 'contain')
  await opener.click()
  await expect(
    dialog.getByRole('button', { name: 'Gambar berikutnya' }),
  ).toBeDisabled()
  await expect(dialog.getByRole('img')).toHaveCSS('object-fit', 'contain')
})

test('video and tour requests wait for separate consent and retain iframe restrictions', async ({
  page,
  request,
}) => {
  const requested: string[] = []
  await page.route(
    /https:\/\/(www\.youtube-nocookie\.com|my\.matterport\.com)\//,
    async (route) => {
      requested.push(route.request().url())
      await route.fulfill({
        contentType: 'text/html',
        body: '<p>Fixture provider loaded</p>',
      })
    },
  )
  await openGallery(page, request)
  await expect(
    page.locator('#video-properti iframe, #tur-properti iframe'),
  ).toHaveCount(0)
  expect(requested).toEqual([])
  await page
    .locator('#video-properti')
    .getByRole('button', { name: 'Muat video' })
    .click()
  await expect(page.locator('#video-properti iframe')).toHaveAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-presentation',
  )
  await expect.poll(() => requested.length).toBe(1)
  await expect(page.locator('#tur-properti iframe')).toHaveCount(0)
  await page
    .locator('#tur-properti')
    .getByRole('button', { name: 'Muat tour' })
    .click()
  await expect.poll(() => requested.length).toBe(2)
  await expect(page.locator('#tur-properti iframe')).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  )
})

test('a single floor plan has no empty photo group and remains usable on a narrow screen', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await openGallery(
    page,
    request,
    media.filter((item) => item.kind === 'FLOOR_PLAN'),
  )
  await expect(page.getByRole('button', { name: /^Foto \(/ })).toHaveCount(0)
  await expect(
    page.locator('#video-properti, #tur-properti, #brosur-properti'),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Perbesar gambar properti' }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Gambar properti diperbesar',
  })
  await expect(dialog.getByRole('img')).toHaveCSS('object-fit', 'contain')
  await expect(
    dialog.getByRole('button', { name: 'Tutup gambar' }),
  ).toBeVisible()
  const bounds = await dialog.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
})
