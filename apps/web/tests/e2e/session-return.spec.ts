import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →', exact: true }).click()
  await expect(page).toHaveURL(/\/backoffice$/)
  await expect(page.locator('.staff-identity')).toContainText(
    email.startsWith('admin') ? 'Administrator' : 'Marketing',
  )
}

for (const role of ['admin', 'marketing']) {
  test(`${role}: active session survives website, footer, reload and direct login in another tab`, async ({
    page,
    context,
  }) => {
    test.setTimeout(60000)
    let loginPosts = 0
    context.on('request', (request) => {
      if (
        new URL(request.url()).pathname === '/auth/login' &&
        request.method() === 'POST'
      )
        loginPosts++
    })
    await login(page, `${role}@example.test`)
    await page.getByRole('link', { name: 'Lihat website', exact: true }).click()
    await expect(page).toHaveURL(/\/properti$/)
    const sessionStatus = await page.evaluate(
      async () =>
        (
          await fetch('/api/v1/me', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
          })
        ).status,
    )
    expect(sessionStatus).toBe(200)
    await page
      .getByRole('link', { name: 'Tim Flamboyan ↗', exact: true })
      .click()
    await expect(page).toHaveURL(/\/backoffice$/)
    await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveCount(0)
    await page.getByRole('link', { name: 'Lihat website', exact: true }).click()
    await expect(page).toHaveURL(/\/properti$/)
    await page.reload()
    await page
      .getByRole('link', { name: 'Tim Flamboyan ↗', exact: true })
      .click()
    await expect(page).toHaveURL(/\/backoffice$/)
    const other = await context.newPage()
    await other.goto('/login')
    await expect(other).toHaveURL(/\/backoffice$/)
    await expect(other.locator('.staff-identity')).toContainText(
      role === 'admin' ? 'Administrator' : 'Marketing',
    )
    if (role === 'marketing')
      await expect(
        other.getByRole('link', { name: 'Akun tim', exact: true }),
      ).toHaveCount(0)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('link', { name: 'Lihat website', exact: true }).click()
    await expect(page).toHaveURL(/\/properti$/)
    await page
      .getByRole('link', { name: 'Tim Flamboyan ↗', exact: true })
      .click()
    await expect(page).toHaveURL(/\/backoffice$/)
    await expect(page.locator('.staff-identity')).toContainText(
      role === 'admin' ? 'Administrator' : 'Marketing',
    )
    await expect(
      page.getByText('Memuat workspace…', { exact: true }),
    ).toHaveCount(0)
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: test.info().outputPath(`${role}-return-mobile.png`),
      fullPage: true,
    })
    expect(loginPosts).toBe(1)
  })
}

test('visitor and expired sessions reach login, while logout in another tab invalidates cached identity', async ({
  page,
  context,
}) => {
  test.setTimeout(60000)
  await page.goto('/')
  await page.getByRole('link', { name: 'Tim Flamboyan ↗', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
  await login(page, 'admin@example.test')
  const other = await context.newPage()
  await other.goto('/backoffice')
  await expect(other.locator('.staff-identity')).toContainText('Administrator')
  await page.getByRole('link', { name: 'Lihat website', exact: true }).click()
  await other.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(other).toHaveURL(/\/login$/)
  await page.getByRole('link', { name: 'Tim Flamboyan ↗', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
  await login(page, 'marketing@example.test')
  await page.getByRole('link', { name: 'Lihat website', exact: true }).click()
  await context.clearCookies()
  await page.getByRole('link', { name: 'Tim Flamboyan ↗', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
})

test('login waits for session validation and offers retry on temporary failure', async ({
  page,
}) => {
  await page.route('**/api/v1/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    await route.fulfill({
      status: 503,
      json: { message: 'Service unavailable' },
    })
  })
  await page.goto('/login')
  await expect(page.locator('.login-panel[role="status"]')).toContainText(
    'Memeriksa sesi',
  )
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    'Sesi belum dapat diperiksa',
  )
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveCount(0)
  await page.unroute('**/api/v1/me')
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
})

test('rejected account reaches guest login without redirect loop', async ({
  page,
}) => {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 403, json: { message: 'Account inactive' } }),
  )
  await page.goto('/backoffice/profil')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
})

test('temporary session-check failure can recover the existing session without credentials', async ({
  page,
}) => {
  await login(page, 'marketing@example.test')
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 503, json: { message: 'Service unavailable' } }),
  )
  await page.goto('/login')
  await expect(page.getByRole('alert')).toContainText(
    'Sesi belum dapat diperiksa',
  )
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveCount(0)
  await page.unroute('**/api/v1/me')
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page).toHaveURL(/\/backoffice$/)
  await expect(page.locator('.staff-identity')).toContainText('Marketing')
})
