import { expect, test } from '@playwright/test'

test('Admin reports cohort metrics and read-only retention; Marketing is denied', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await page.getByRole('link', { name: 'Laporan', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Hasil penjualan' }),
  ).toBeVisible()
  await expect(
    page.getByText('Rincian tahap calon pembeli dalam periode', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Tanggal awal', { exact: true }).fill('2024-01-01')
  await page.getByRole('button', { name: 'Tampilkan laporan' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Rentang laporan maksimal' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Privasi kontak', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Kandidat retensi lead' }),
  ).toBeVisible()
  await expect(
    page.getByText('Belum ada kandidat retensi.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill('marketing@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  await page.goto('/backoffice/laporan')
  await expect(
    page.getByText('Laporan hanya tersedia untuk Admin.', { exact: true }),
  ).toBeVisible()
  await page.goto('/privasi')
  await expect(
    page.getByRole('heading', { name: 'Informasi privasi', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Penghitung interaksi katalog belum diaktifkan.', {
      exact: false,
    }),
  ).toBeVisible()
})
