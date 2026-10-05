import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('generated demo is live database data: Admin edit changes SSR and survives reload', async ({
  page,
  request,
}) => {
  const fixture = await demoProperty(request)
  const title = `Rumah Demo Live ${Date.now()}`
  let changed = false
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  try {
    await page.getByRole('link', { name: 'Katalog properti', exact: true }).click()
    await page.getByLabel('Cari properti', { exact: true }).fill(fixture.title)
    await page.getByRole('button', { name: 'Cari / muat ulang' }).click()
    await page
      .getByRole('row')
      .filter({ hasText: fixture.title })
      .getByRole('button', { name: 'Edit properti' })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Judul', { exact: true }).fill(title)
    await dialog
      .getByLabel('Harga (Rp)', { exact: true })
      .fill(String(Number(fixture.price_idr) + 1000000))
    await dialog
      .getByRole('button', { name: 'Simpan properti', exact: true })
      .click()
    await expect(dialog).not.toBeVisible()
    changed = true
    const live = (
      await (await request.get(`/api/v1/properties/${fixture.slug}`)).json()
    ).data
    expect(live.title).toBe(title)
    expect(live.price_idr).toBe(String(Number(fixture.price_idr) + 1000000))
    const html = await (await request.get(`/properti/${fixture.slug}`)).text()
    expect(html).toContain(title)
    await page.goto(`/properti/${fixture.slug}`)
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
  } finally {
    if (changed) {
      const restored = await page.evaluate(async (original) => {
        const current = (
          await (
            await fetch(`/api/v1/internal/properties/${original.id}`, {
              credentials: 'include',
            })
          ).json()
        ).data
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' })
        const token = document.cookie
          .split('; ')
          .find((value) => value.startsWith('XSRF-TOKEN='))
          ?.slice('XSRF-TOKEN='.length)
        return (
          await fetch(`/api/v1/internal/properties/${original.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-XSRF-TOKEN': decodeURIComponent(token ?? ''),
            },
            body: JSON.stringify({
              version: current.version,
              title: original.title,
              price_idr: original.price_idr,
            }),
          })
        ).ok
      }, fixture)
      expect(restored).toBe(true)
    }
  }
})
