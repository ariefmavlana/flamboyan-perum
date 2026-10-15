import { expect, test } from '@playwright/test'

const adminPages = [
  {
    path: '/backoffice/operasi',
    heading: 'Kesehatan layanan',
    api: 'operations',
  },
  { path: '/backoffice/privasi', heading: 'Kandidat retensi', api: 'privacy' },
]

for (const target of adminPages) {
  test(`Marketing direct URL ${target.path} returns to assigned workspace`, async ({
    page,
  }) => {
    await page.goto('/login')
    await page
      .getByLabel('Email', { exact: true })
      .fill('marketing@example.test')
    await page
      .getByLabel('Kata sandi', { exact: true })
      .fill(process.env.DEMO_PASSWORD ?? '')
    await page.getByRole('button', { name: 'Masuk →', exact: true }).click()
    await expect(page).toHaveURL(/\/backoffice$/)
    const adminRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === `/api/v1/internal/${target.api}`)
        adminRequests.push(request.url())
    })
    await page.goto(target.path, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/backoffice$/)
    await expect(
      page.getByRole('heading', { name: target.heading }),
    ).toHaveCount(0)
    await expect(page.locator('.staff-identity')).toContainText('Marketing')
    expect(adminRequests).toEqual([])
    const denied = await page.evaluate(
      async (api) =>
        (
          await fetch(`/api/v1/internal/${api}`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          })
        ).status,
      target.api,
    )
    expect(denied).toBe(403)
  })

  test(`Visitor direct URL ${target.path} reaches login`, async ({ page }) => {
    await page.goto(target.path, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
    await expect(
      page.getByRole('heading', { name: target.heading }),
    ).toHaveCount(0)
  })

  test(`Admin ${target.path} waits for session and retries a temporary failure`, async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
    await page
      .getByLabel('Kata sandi', { exact: true })
      .fill(process.env.DEMO_PASSWORD ?? '')
    await page.getByRole('button', { name: 'Masuk →', exact: true }).click()
    await expect(page).toHaveURL(/\/backoffice$/)
    await page.route('**/api/v1/me', (route) =>
      route.fulfill({ status: 503, json: { message: 'Service unavailable' } }),
    )
    await page.goto(target.path, { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: target.heading }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Coba lagi', exact: true }),
    ).toBeVisible()
    await page.unroute('**/api/v1/me')
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: target.heading }),
    ).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`${target.path}$`))
  })
}

