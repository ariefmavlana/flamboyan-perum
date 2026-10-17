import { expect, test } from '@playwright/test'

for (const role of ['admin', 'marketing']) {
  test(`${role} has role guidance and an accessible mobile workspace drawer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/login')
    await page.getByLabel('Email', { exact: true }).fill(`${role}@example.test`)
    await page
      .getByLabel('Kata sandi', { exact: true })
      .fill(process.env.DEMO_PASSWORD ?? '')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    const menu = page.getByRole('button', { name: 'Menu', exact: true })
    await expect(menu).toBeEnabled()
    await menu.click()
    const drawer = page.getByRole('dialog', {
      name: 'Menu ruang kerja',
      exact: true,
    })
    await expect(drawer).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Tutup menu', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(
      drawer.getByRole('button', { name: 'Keluar', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      drawer.getByRole('button', { name: 'Tutup menu', exact: true }),
    ).toBeFocused()
    const navigation = drawer.getByRole('navigation', {
      name: 'Ruang kerja tim',
    })
    await expect(
      navigation.getByRole('link', { name: 'Konten publik', exact: true }),
    ).toHaveCount(role === 'admin' ? 1 : 0)
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
    await expect(menu).toBeFocused()
    await menu.click()
    await navigation
      .getByRole('link', { name: 'Panduan kerja', exact: true })
      .click()
    await expect(drawer).not.toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Panduan kerja tim', exact: true }),
    ).toBeVisible()
    await expect(page.locator('#kpr')).toHaveCount(role === 'admin' ? 1 : 0)
    await expect(
      page.getByRole('navigation', { name: 'Daftar isi panduan' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page
      .getByRole('navigation', { name: 'Daftar isi panduan' })
      .getByRole('link', { name: 'Mengatasi kendala umum', exact: true })
      .click()
    await expect(page).toHaveURL(/#kendala$/)
    await expect(
      page.getByRole('heading', {
        name: 'Mengatasi kendala umum',
        exact: true,
      }),
    ).toBeInViewport()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(menu).not.toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Ruang kerja tim' })
        .getByRole('link', { name: 'Panduan kerja', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  })
}
