import { expect, test } from '@playwright/test'

test.use({ trace: 'off' })

test('published Admin identity and contact reach privacy SSR while drafts stay private', async ({ page, baseURL }) => {
  test.skip(!process.env.GROWTH_FIXTURE_PASSWORD, 'Requires the explicit local synthetic fixture')
  expect(new URL(baseURL!).origin).toBe('http://127.0.0.1:4300')
  const options = await (await page.request.get('/api/v1/inquiries/options')).json()
  expect(options.meta.privacy_notice_version).toBe('preview-fixture-1')
  expect(options.data).toHaveLength(5)
  expect(options.data.every((item: { title: string }) => item.title.includes('fixture uji'))).toBe(true)
  await page.route('**://www.googletagmanager.com/**', route => route.fulfill({ body: '' }))
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('growth-admin@example.test')
  await page.getByLabel('Kata sandi', { exact: true }).fill(process.env.GROWTH_FIXTURE_PASSWORD!)
  await page.locator('form button[type="submit"], form button:not([type])').click()
  await expect(page).toHaveURL(/\/backoffice/)
  await page.goto('/backoffice/konten')
  await page.locator('.content-purpose-grid').getByRole('button', { name: /Kawasan & kontak/ }).click()
  await page.getByRole('button', { name: /Tambah/ }).first().click()
  await expect(page.getByLabel('Nama kawasan / pengelola publik (termasuk halaman privasi)', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  const recordId = await page.evaluate(async () => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find(x => x.startsWith('XSRF-TOKEN='))?.slice(11) ?? '')
    const response = await fetch('/api/v1/internal/content', {
      method: 'POST', credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf },
      body: JSON.stringify({ kind: 'DEVELOPMENT', published: true, verified: true, position: 0, payload: {
        name: 'Pengelola Fixture A', developer: 'Pengembang fixture, bukan badan usaha nyata',
        address: 'Alamat fixture uji', whatsapp: '6282214795024', website: 'https://example.test',
        planned_units: 5, house_types: 5, facilities: 'Data sintetis', nearby: 'Data sintetis',
        source_name: 'Fixture lokal', source_date: '2026-10-17', notes: 'Bukan penawaran publik.',
      } }),
    })
    if (response.status !== 201) throw new Error(`Fixture content creation HTTP ${response.status}`)
    return (await response.json()).data.id as number
  })

  const update = async (published: boolean, name: string, whatsapp: string) => page.evaluate(async ({ id, published, name, whatsapp }) => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find(x => x.startsWith('XSRF-TOKEN='))?.slice(11) ?? '')
    const list = await (await fetch('/api/v1/internal/content?kind=DEVELOPMENT', { headers: { Accept: 'application/json' } })).json()
    const current = list.data.find((item: { id: number }) => item.id === id)
    const response = await fetch(`/api/v1/internal/content/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf },
      body: JSON.stringify({ kind: 'DEVELOPMENT', published, verified: true, position: 0,
        version: current.version, payload: { ...current.payload, name, whatsapp } }),
    })
    if (!response.ok) throw new Error(`Fixture content update HTTP ${response.status}`)
  }, { id: recordId, published, name, whatsapp })

  try {
    const first = await page.request.get('/privasi')
    expect(first.status()).toBe(200)
    expect(await first.text()).toContain('Tim Pengelola Fixture A')
    await update(true, 'Pengelola Fixture B', '6281234567890')
    await page.goto('/privasi')
    await expect(page.locator('main')).toContainText('Tim Pengelola Fixture B')
    await expect(page.getByRole('link', { name: 'Hubungi Admin tentang privasi' })).toHaveAttribute('href', /^https:\/\/wa\.me\/6281234567890\?/)
    const renamed = await page.request.get('/privasi')
    expect(await renamed.text()).toContain('teknologi opsional Pengelola Fixture B.')
    await page.screenshot({ path: test.info().outputPath('privacy-cms.png'), fullPage: true })
  } finally {
    await update(false, 'Pengelola Fixture B', '6281234567890')
  }
  const fallback = await page.request.get('/privasi')
  const html = await fallback.text()
  expect(html).toContain('Tim Bukit Flamboyan Indah 2')
  expect(html).not.toContain('Pengelola Fixture B')
})
