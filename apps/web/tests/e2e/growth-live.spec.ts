import { expect, test } from '@playwright/test'

test.use({ trace: 'off' })

test('isolated form to Admin CRM, qualification, visit, DEAL and verified akad', async ({ page }) => {
  test.skip(!process.env.GROWTH_FIXTURE_PASSWORD, 'Requires explicitly isolated growth fixture credentials')
  test.setTimeout(90_000)
  await page.route('**://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
  const name = `Fixture browser ${Date.now()}`
  const options = await page.request.get('/api/v1/inquiries/options')
  expect(options.status()).toBe(200)
  const fixture = await options.json()
  expect(fixture.meta.privacy_notice_version).toBe('preview-fixture-1')
  expect(fixture.data).toHaveLength(5)
  expect(fixture.data.every((option: { title: string }) => option.title.includes('fixture uji'))).toBe(true)
  const catalog = await page.request.get('/properti?utm_source=google&utm_medium=cpc&utm_campaign=fixture')
  expect(catalog.status()).toBe(200)
  expect(await catalog.text()).toContain('/properti"')
  expect((await page.request.get('/properti?page=999')).status()).toBe(404)
  expect((await page.request.get('/properti?page=invalid')).status()).toBe(404)
  const sitemap = await page.request.get('/sitemaps/pages.xml')
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).not.toContain('/perumahan/banjaran')
  await page.goto('/konsultasi')
  const privacy = page.getByRole('region', { name: 'Pilihan privasi' })
  if (await privacy.isVisible()) await privacy.getByRole('button', { name: 'Tolak opsional' }).click()
  await page.getByLabel('Nama lengkap').fill(name)
  await page.getByLabel('Nomor WhatsApp').fill(`62815${String(Date.now()).slice(-8)}`)
  await page.getByLabel('Pesan singkat').fill('Data sintetis untuk pengujian, bukan prospek nyata.')
  const accepted = page.waitForResponse((response) => response.url().endsWith('/api/v1/inquiries') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  expect((await accepted).status()).toBe(202)
  await expect(page.getByText('PERMINTAAN DITERIMA')).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('growth-admin@example.test')
  await page.getByLabel('Kata sandi', { exact: true }).fill(process.env.GROWTH_FIXTURE_PASSWORD!)
  await page.locator('form button[type="submit"], form button:not([type])').click()
  await expect(page).toHaveURL(/\/backoffice/)
  await page.goto('/backoffice/permintaan')
  await page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Tinjau' }).click()
  await page.getByLabel('Alasan keputusan').fill('Kontak sintetis dan kebutuhan uji diverifikasi.')
  const resolution = page.waitForResponse((response) => /\/internal\/inquiries\/\d+\/resolve$/.test(response.url()))
  await page.getByRole('button', { name: 'Simpan keputusan' }).click()
  const resolved = await resolution
  expect(resolved.status()).toBe(200)
  const leadId = (await resolved.json()).lead.id as number

  // These mutations run in the authenticated browser using the same BFF,
  // session and CSRF boundary as workspace forms. No direct database writes.
  const results = await page.evaluate(async ({ id, media, propertyId }) => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.slice('XSRF-TOKEN='.length) ?? '')
    const request = async (path: string, method = 'GET', body?: object) => {
      const response = await fetch(path, { method, credentials: 'include', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
      if (!response.ok) throw new Error(`Fixture request failed ${response.status} ${path}`)
      return response.json()
    }
    let lead = (await request(`/api/v1/leads/${id}`)).data
    const users = (await request('/api/v1/internal/users?q=growth-marketing')).data as { id: number; email: string }[]
    const marketing = users.find((user) => user.email === 'growth-marketing@example.test')!
    lead = (await request(`/api/v1/leads/${id}/assignment`, 'POST', { version: lead.version, marketing_id: marketing.id })).data
    let outcome = (await request(`/api/v1/internal/leads/${id}/qualification`, 'PATCH', { version: lead.version, qualified: true, reason: 'Percakapan dan kebutuhan fixture terkonfirmasi.' })).data
    outcome = (await request(`/api/v1/internal/leads/${id}/visits`, 'POST', { version: outcome.lead_version, status: 'CONFIRMED', scheduled_at: new Date(Date.now() + 86400000).toISOString(), reason: 'Jadwal fixture disepakati.' })).data
    const visit = outcome.visits[0]
    const futureAttendance = await fetch(`/api/v1/internal/leads/${id}/visits/${visit.id}`, { method: 'PATCH', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf }, body: JSON.stringify({ version: outcome.lead_version, status: 'COMPLETED' }) })
    lead = { ...lead, version: outcome.lead_version }
    for (const status of ['FOLLOWED_UP', 'SURVEY_LOKASI', 'PEMBERKASAN_KPR', 'DEAL']) {
      lead = (await request(`/api/v1/leads/${id}/status`, 'PATCH', { version: lead.version, status, note: 'Transisi fixture sintetis.' })).data
    }
    const beforeAkad = (await request(`/api/v1/internal/leads/${id}/outcomes`)).data
    outcome = (await request(`/api/v1/internal/leads/${id}/akad-confirmation`, 'POST', { version: lead.version, confirmed: true, occurred_at: new Date(Date.now() - 60000).toISOString(), reference: 'FIXTURE-AKAD', reason: 'Bukti fixture, bukan transaksi nyata.' })).data
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
    const report = (await request(`/api/v1/internal/reports?from=${date}&to=${date}`)).data.growth
    let mediaProof = null
    if (media) {
      const property = (await request(`/api/v1/internal/properties/${propertyId}`)).data
      const canvas = document.createElement('canvas')
      canvas.width = 960; canvas.height = 640
      canvas.getContext('2d')!.fillRect(0, 0, 960, 640)
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((image) => resolve(image!), 'image/png'))
      const form = new FormData()
      for (const [key, value] of Object.entries({ version: String(property.version), kind: 'PHOTO', alt: 'Fixture sintetis untuk pengujian storage; bukan dokumentasi proyek.', published: '0' })) form.append(key, value)
      form.append('file', blob, 'fixture.png')
      const uploaded = await fetch(`/api/v1/internal/properties/${propertyId}/media`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'X-XSRF-TOKEN': csrf }, body: form })
      if (uploaded.status !== 201) throw new Error(`Fixture upload failed ${uploaded.status}`)
      const asset = await uploaded.json()
      if (asset.data.state !== 'READY') throw new Error('Fixture media processing not READY')
      const path = `/media/${asset.data.id}/640`
      const before = (await fetch(path, { credentials: 'omit' })).status
      const privateStatus = (await fetch(`/api/v1/internal/media/${asset.data.id}/640`, { credentials: 'include' })).status
      const published = await request(`/api/v1/internal/properties/${propertyId}/media/${asset.data.id}`, 'PATCH', { version: asset.property_version, published: true })
      const image = await fetch(path, { credentials: 'omit' })
      await request(`/api/v1/internal/properties/${propertyId}/media/${asset.data.id}`, 'PATCH', { version: published.property_version, published: false })
      mediaProof = { before, privateStatus, publishedStatus: image.status, mime: image.headers.get('content-type'), revokedStatus: (await fetch(path, { credentials: 'omit' })).status }
    }
    return { qualified: outcome.qualification.qualified, akad: outcome.akad.confirmed, beforeAkad: beforeAkad.akad, futureAttendance: futureAttendance.status, report, mediaProof }
  }, { id: leadId, media: process.env.GROWTH_MEDIA_TESTS === '1', propertyId: fixture.data[0].property_id as number })
  expect(results.qualified).toBe(true)
  expect(results.beforeAkad).toBeNull()
  expect(results.futureAttendance).toBe(422)
  expect(results.akad).toBe(true)
  expect(results.report.akad_confirmed_unique).toBeGreaterThanOrEqual(1)
  expect(results.report.costs.cpl_idr).toBeNull()
  if (process.env.GROWTH_MEDIA_TESTS === '1') expect(results.mediaProof).toEqual({ before: 404, privateStatus: 200, publishedStatus: 200, mime: 'image/webp', revokedStatus: 404 })
  await page.goto(`/backoffice/hasil?lead=${leadId}`)
  await expect(page.getByRole('heading', { name: 'Akad terkonfirmasi', exact: true })).toBeVisible()
})

test('form conversion fires once after 202 and never after a failed write', async ({ page }) => {
  test.skip(process.env.GROWTH_MEASUREMENT_TESTS !== '1', 'Requires a fixture GTM id; no real provider requests')
  await page.route('**://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
  await page.addInitScript(() => localStorage.setItem('flamboyan-consent-v1', JSON.stringify({ version: 2, analytics: true, marketing: false, decidedAt: new Date().toISOString() })))
  let attempts = 0
  await page.route('**/api/v1/inquiries', async (route) => {
    attempts++
    await route.fulfill({ status: attempts === 1 ? 503 : 202, json: attempts === 1 ? { message: 'Fixture unavailable' } : { accepted: true, receipt: 'fixture-receipt-unique' } })
  })
  await page.goto('/konsultasi')
  await page.getByLabel('Nama lengkap').fill('Fixture Conversion')
  await page.getByLabel('Nomor WhatsApp').fill('628123456789')
  const events = () => page.evaluate(() => (window as unknown as { dataLayer?: { event?: string }[] }).dataLayer?.filter((item) => item.event === 'inquiry_submitted') ?? [])
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(page.getByRole('alert')).toContainText('belum tersimpan')
  expect(await events()).toHaveLength(0)
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(page.getByText('PERMINTAAN DITERIMA')).toBeVisible()
  expect(await events()).toHaveLength(1)
  expect(JSON.stringify(await events())).not.toMatch(/Fixture Conversion|628123456789|fixture-receipt-unique/)
})
