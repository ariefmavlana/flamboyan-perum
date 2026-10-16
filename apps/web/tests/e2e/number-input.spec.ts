import { expect, test } from '@playwright/test'
import { demoProperty } from './helpers'

test('rupiah typing, middle editing and decimal rates retain numeric meaning', async ({
  page,
  request,
}) => {
  const property = await demoProperty(request)
  await page.goto(`/properti/${property.slug}`)
  const dp = page.getByRole('textbox', { name: 'Uang muka (IDR)', exact: true })
  await expect(dp).toBeEnabled()
  await dp.fill('')
  await dp.pressSequentially('1000000')
  await expect(dp).toHaveValue('1.000.000')
  await expect(page.locator('.mortgage-input-summary')).toContainText(
    '1.000.000',
  )
  const rate = page.getByRole('textbox', {
    name: 'Bunga efektif tahunan awal (%)',
    exact: true,
  })
  await rate.fill('8,5')
  expect(
    await rate.evaluate((el) => (el as HTMLInputElement).validity.valid),
  ).toBe(true)
  await dp.press('Home')
  await dp.press('ArrowRight')
  await dp.press('Delete')
  await expect(dp).toHaveValue('100.000')
  await rate.fill('8.5')
  expect(
    await rate.evaluate((el) => (el as HTMLInputElement).validationMessage),
  ).toContain('koma desimal')
})

test('catalog submits canonical amounts while displaying grouped rupiah after reload', async ({
  page,
}) => {
  await page.goto('/properti')
  const minimum = page.getByRole('textbox', {
    name: 'Harga minimum',
    exact: true,
  })
  await expect(minimum).toBeEnabled()
  await minimum.fill('1000000')
  await expect(minimum).toHaveValue('1.000.000')
  await page.getByRole('button', { name: 'Terapkan', exact: true }).click()
  await expect(page).toHaveURL(/min_price=1000000/)
  await page.reload()
  await expect(minimum).toHaveValue('1.000.000')
})
