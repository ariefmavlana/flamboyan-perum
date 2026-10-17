import { expect, test, type Page, type Route } from '@playwright/test'

const optionResponse = {
  data: [
    {
      property_id: 36,
      title: 'Rumah Tipe 36/60',
      canonical_path: '/properti/rumah-tipe-36-60',
    },
  ],
  meta: {
    enabled: true,
    privacy_notice_version: '2026-10-16',
    privacy_notice_url: '/privasi',
    service_hours_notice: 'Admin menanggapi pada jam layanan.',
    attribution_context_enabled: false,
  },
}

async function mockSession(page: Page, role: 'ADMIN' | 'MARKETING') {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      json: {
        data: {
          id: role === 'ADMIN' ? 1 : 2,
          name: role === 'ADMIN' ? 'Admin Fixture' : 'Marketing Fixture',
          email: `${role.toLowerCase()}@example.test`,
          role,
          is_active: true,
          version: 1,
          email_verified_at: '2026-10-16T00:00:00Z',
        },
      },
    }),
  )
  await page.route('**/api/v1/notifications**', (route) =>
    route.fulfill({
      json: {
        data: [],
        unread_count: 0,
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 },
        links: { prev: null, next: null },
      },
    }),
  )
  await page.route('**/api/v1/realtime', (route) =>
    route.fulfill({ json: { data: { enabled: false } } }),
  )
  await page.route('**/sanctum/csrf-cookie', (route) =>
    route.fulfill({ status: 204 }),
  )
}

test('public form keeps the same idempotency key for a safe retry', async ({
  page,
}) => {
  await page.route('**/api/v1/inquiries/options', (route) =>
    route.fulfill({ json: optionResponse }),
  )
  const attempts: { key: string | null; body: unknown }[] = []
  await page.route('**/api/v1/inquiries', async (route) => {
    if (new URL(route.request().url()).pathname !== '/api/v1/inquiries')
      return route.fallback()
    attempts.push({
      key: route.request().headers()['idempotency-key'] ?? null,
      body: route.request().postDataJSON(),
    })
    if (attempts.length === 1)
      return route.fulfill({
        status: 503,
        json: { message: 'Temporary dependency failure' },
      })
    return route.fulfill({
      status: 202,
      json: { accepted: true, receipt: 'receipt_fixture_opaque' },
    })
  })

  await page.goto('/properti')
  await page.getByRole('link', { name: 'Konsultasi', exact: true }).click()
  await expect(page.getByLabel('Nama lengkap')).toBeVisible()
  await page.getByLabel('Nama lengkap').fill('Pengunjung Fixture')
  await page.getByLabel('Nomor WhatsApp').fill('0812 3456 7890')
  await page
    .getByLabel('Pesan singkat')
    .fill('Ingin bertanya tentang tipe ini.')
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(page.getByRole('alert')).toContainText('belum tersimpan')
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(page.getByText('PERMINTAAN DITERIMA')).toBeVisible()
  expect(attempts).toHaveLength(2)
  expect(attempts[0]!.key).toMatch(/^[a-f0-9-]{32,36}$/)
  expect(attempts[1]!.key).toBe(attempts[0]!.key)
  expect(attempts[1]!.body).toEqual(attempts[0]!.body)
})

test('mobile validation focuses the invalid field and Banjaran keeps its WhatsApp context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/v1/inquiries/options', (route) => route.fulfill({ json: optionResponse }))
  await page.route('**/api/v1/inquiries', (route) => route.fulfill({ status: 422, json: { data: { errors: { whatsapp_number: ['Nomor WhatsApp tidak valid.'] } } } }))
  await page.goto('/properti')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('link', { name: 'Konsultasi', exact: true }).click()
  await page.getByLabel('Nama lengkap').fill('Fixture Mobile')
  await page.getByLabel('Nomor WhatsApp').fill('123')
  await page.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(page.locator('input[name="whatsapp_number"]')).toBeFocused()
  await expect(page.locator('input[name="whatsapp_number"]')).toHaveAttribute('aria-describedby', 'inquiry-phone-error')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/konsultasi?kawasan=banjaran')
  await expect(page.getByRole('button', { name: 'Kirim permintaan' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Lanjutkan ke WhatsApp/ })).toHaveAttribute('href', /Banjaran/)
})

test('Admin resolves an inquiry with its current version', async ({ page }) => {
  await mockSession(page, 'ADMIN')
  const inquiry = {
    id: 91,
    receipt: 'opaque-receipt',
    property_id: 36,
    property: { property_id: 36, title: 'Rumah Tipe 36/60', canonical_path: '/properti/rumah-tipe-36-60' },
    name: 'Pengunjung Fixture',
    whatsapp_number: '6281234567890',
    purpose: 'CONSULTATION',
    preferred_visit_at: null,
    message: 'Mohon informasi.',
    privacy_notice_version: '2026-10-16',
    marketing_opt_in: false,
    state: 'PENDING',
    version: 4,
    lead_id: null,
    attribution: null,
    resolution_action: null,
    resolution_reason: null,
    resolved_at: null,
    created_at: '2026-10-16T08:00:00Z',
  }
  let resolutionBody: Record<string, unknown> | null = null
  await page.route('**/api/v1/internal/inquiries?**', (route) =>
    route.fulfill({
      json: {
        data: [inquiry],
        meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        links: { prev: null, next: null },
      },
    }),
  )
  await page.route('**/api/v1/internal/inquiries/91/resolve', async (route) => {
    resolutionBody = route.request().postDataJSON()
    await route.fulfill({
      json: {
        data: {
          ...inquiry,
          state: 'RESOLVED',
          version: 5,
          lead_id: 19,
          resolution_action: 'ACCEPT_NEW',
          resolution_reason: 'Kontak dan minat dapat ditindaklanjuti.',
          resolved_at: '2026-10-16T09:00:00Z',
        },
      },
    })
  })

  await page.goto('/backoffice/permintaan')
  await expect(
    page.getByRole('heading', { name: 'Permintaan masuk' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Tinjau' }).click()
  await page
    .getByLabel('Alasan keputusan')
    .fill('Kontak dan minat dapat ditindaklanjuti.')
  await page.getByRole('button', { name: 'Simpan keputusan' }).click()
  await expect.poll(() => resolutionBody).not.toBeNull()
  expect(resolutionBody).toEqual({
    version: 4,
    action: 'ACCEPT_NEW',
    reason: 'Kontak dan minat dapat ditindaklanjuti.',
  })
})

test('Marketing updates outcomes without receiving the Admin akad control', async ({
  page,
}) => {
  await mockSession(page, 'MARKETING')
  const outcomes = {
    lead_id: 19,
    lead_version: 7,
    qualification: null,
    visits: [],
    akad: null,
    attribution: {
      first_touch: null,
      last_touch: null,
      method: 'UNKNOWN',
      captured_at: null,
    },
  }
  await page.route('**/api/v1/leads/19', (route) =>
    route.fulfill({
      json: {
        data: {
          id: 19,
          name: 'Calon Pembeli Fixture',
          status: 'FOLLOWED_UP',
          version: 7,
          property: {
            id: 36,
            title: 'Rumah Tipe 36/60',
            slug: 'rumah-tipe-36-60',
          },
        },
      },
    }),
  )
  await page.route('**/api/v1/internal/leads/19/outcomes**', (route) =>
    route.fulfill({ json: { data: outcomes } }),
  )
  let qualificationBody: Record<string, unknown> | null = null
  await page.route(
    '**/api/v1/internal/leads/19/qualification',
    async (route: Route) => {
      qualificationBody = route.request().postDataJSON()
      await route.fulfill({
        json: {
          data: {
            ...outcomes,
            lead_version: 8,
            qualification: {
              qualified: true,
              reason: 'Kebutuhan dan langkah lanjut sudah dibahas.',
              changed_at: '2026-10-16T09:00:00Z',
              actor: { id: 2, name: 'Marketing Fixture' },
            },
          },
        },
      })
    },
  )

  await page.goto('/backoffice/hasil?lead=19')
  await expect(
    page.getByRole('heading', { name: 'Calon Pembeli Fixture' }),
  ).toBeVisible()
  await expect(page.getByText('ADMIN · AKAD')).toHaveCount(0)
  await page
    .getByLabel('Dasar penilaian')
    .fill('Kebutuhan dan langkah lanjut sudah dibahas.')
  await page.getByRole('button', { name: 'Simpan qualification' }).click()
  await expect.poll(() => qualificationBody).not.toBeNull()
  expect(qualificationBody).toEqual({
    version: 7,
    qualified: true,
    reason: 'Kebutuhan dan langkah lanjut sudah dibahas.',
  })
})
