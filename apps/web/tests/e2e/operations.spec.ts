import { expect, test } from '@playwright/test'

test('Admin creates catalog, records and assigns lead; Marketing processes assigned work', async ({
  page,
  browser,
}) => {
  test.setTimeout(60000)
  const suffix = Date.now().toString()
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(page).toHaveURL(/backoffice/)
  await page.getByRole('link', { name: 'Katalog', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah properti' }).click()
  const property = page.getByRole('dialog')
  await property
    .getByLabel('Judul', { exact: true })
    .fill(`Rumah Operasi ${suffix}`)
  await property.getByLabel('Slug URL').fill(`rumah-operasi-${suffix}`)
  await property.getByLabel('Tipe rumah').fill('Tipe 60')
  await property.getByLabel('Sertifikat', { exact: true }).fill('SHM')
  await property.getByLabel('Lokasi', { exact: true }).fill('Bogor')
  await property.getByLabel('Harga (Rp)').fill('900000000')
  await property.getByLabel('Luas tanah (m²)').fill('90')
  await property.getByLabel('Luas bangunan (m²)').fill('60')
  await property.getByLabel('Kamar tidur').fill('3')
  await property.getByLabel('Kamar mandi').fill('2')
  await property
    .getByLabel('Alamat', { exact: true })
    .fill('Alamat fixture browser')
  await property
    .getByLabel('Deskripsi', { exact: true })
    .fill('Data pengujian terisolasi, bukan penawaran.')
  await property
    .getByLabel('Pemilik properti', { exact: true })
    .selectOption({ label: 'Marketing Demo' })
  await property.getByRole('button', { name: 'Simpan properti' }).click()
  await expect(property).not.toBeVisible()
  await expect(
    page.getByText(`Rumah Operasi ${suffix}`, { exact: true }),
  ).toBeVisible()
  await page.setViewportSize({ width: 360, height: 800 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: test.info().outputPath('operations-mobile.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByRole('link', { name: 'CRM', exact: true }).click()
  await page.getByRole('button', { name: 'Catat lead baru' }).click()
  const leadForm = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Catat lead baru' }) })
  await leadForm
    .getByLabel('Nama calon pembeli')
    .fill(`Prospek Operasi ${suffix}`)
  await leadForm
    .getByLabel('Nomor WhatsApp', { exact: true })
    .fill(`628${suffix.slice(-10)}`)
  await leadForm
    .getByLabel('Properti yang diminati', { exact: true })
    .selectOption({ label: `Rumah Operasi ${suffix}` })
  await leadForm.getByRole('button', { name: 'Simpan lead' }).click()
  await expect(leadForm).not.toBeVisible()
  const row = page
    .getByRole('row')
    .filter({ hasText: `Prospek Operasi ${suffix}` })
  await row.getByRole('button', { name: 'Lihat histori →' }).click()
  const drawer = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: `Prospek Operasi ${suffix}` }),
  })
  await drawer.getByText('Assign / alihkan Marketing', { exact: true }).click()
  await drawer
    .getByLabel('Marketing penerima', { exact: true })
    .selectOption({ label: 'Marketing Demo' })
  await drawer.getByRole('button', { name: 'Simpan penugasan' }).click()
  await expect(
    drawer.getByText('Penugasan', { exact: false }).last(),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'Akun tim', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah akun' }).click()
  const account = page.getByRole('dialog')
  await account.getByLabel('Nama', { exact: true }).fill(`Tim ${suffix}`)
  await account
    .getByLabel('Email', { exact: true })
    .fill(`tim-${suffix}@example.test`)
  await account
    .getByLabel('Kata sandi awal')
    .fill(process.env.DEMO_PASSWORD ?? '')
  await account
    .getByLabel('Ulangi kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await account.getByRole('button', { name: 'Simpan akun' }).click()
  await expect(account).not.toBeVisible()
  await expect(page.getByText(`tim-${suffix}@example.test`)).toBeVisible()
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000' })
  const marketing = await context.newPage()
  try {
    await marketing.goto('/login')
    await marketing
      .getByLabel('Email', { exact: true })
      .fill('marketing@example.test')
    await marketing
      .getByLabel('Kata sandi', { exact: true })
      .fill(process.env.DEMO_PASSWORD ?? '')
    await marketing.getByRole('button', { name: 'Masuk →' }).click()
    await expect(
      marketing.getByText(`Prospek Operasi ${suffix}`, { exact: true }),
    ).toBeVisible()
    await expect(marketing.getByRole('link', { name: 'Akun tim' })).toHaveCount(
      0,
    )
    await marketing
      .getByRole('row')
      .filter({ hasText: `Prospek Operasi ${suffix}` })
      .getByRole('button', { name: 'Lihat histori →' })
      .click()
    const panel = marketing.getByRole('dialog').filter({
      has: marketing.getByRole('heading', {
        name: `Prospek Operasi ${suffix}`,
      }),
    })
    await panel.getByRole('button', { name: 'Simpan status' }).click()
    await expect(
      panel.getByText('Perubahan status', { exact: false }),
    ).toBeVisible()
    await marketing.keyboard.press('Escape')
    await marketing.getByRole('link', { name: 'Profil', exact: true }).click()
    await marketing.getByLabel('Nama', { exact: true }).fill('Marketing Demo')
    await marketing.getByRole('button', { name: 'Simpan profil' }).click()
    await expect(
      marketing.getByText('Profil tersimpan.', { exact: true }),
    ).toBeVisible()
  } finally {
    await context.close()
  }
})

test('recovery UI provides a generic response and rejects incomplete reset link', async ({
  page,
}) => {
  await page.goto('/forgot-password')
  await page
    .getByLabel('Email', { exact: true })
    .fill('absent-browser@example.test')
  await page.getByRole('button', { name: 'Kirim petunjuk pemulihan' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Jika akun aktif' }),
  ).toBeVisible()
  await page.goto('/reset-password')
  await expect(page.getByRole('alert')).toContainText(
    'Tautan pemulihan tidak lengkap',
  )
})
