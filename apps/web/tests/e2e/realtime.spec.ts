import { expect, test, type WebSocketRoute } from '@playwright/test'

test('real Echo/Pusher clients subscribe privately, refresh once per event and reconnect to persisted inbox', async ({
  page,
}) => {
  let socket: WebSocketRoute | undefined
  let connections = 0
  let notifications = 0
  let unread = 0
  const notificationId = '0199af8a-a111-7111-a111-111111111111'
  await page.route('**/api/v1/realtime', (route) =>
    route.fulfill({
      json: { data: { enabled: true, key: 'public-test-key', cluster: 'ap1' } },
    }),
  )
  await page.route('**/api/v1/realtime/auth', async (route) => {
    const data = route.request().postDataJSON() as {
      socket_id: string
      channel_name: string
    }
    expect(data.channel_name).toMatch(/^private-users\.\d+$/)
    expect(route.request().headers()['x-xsrf-token']).toBeTruthy()
    await route.fulfill({ json: { auth: 'public-test-key:fixture-signature' } })
  })
  await page.route('**/api/v1/notifications?*', async (route) => {
    notifications++
    await route.fulfill({
      json: {
        data: unread
          ? [
              {
                id: notificationId,
                kind: 'LEAD_STATUS_CHANGED',
                lead_id: 1,
                read_at: null,
                created_at: new Date().toISOString(),
              },
            ]
          : [],
        unread_count: unread,
        meta: { current_page: 1, last_page: 1, per_page: 20, total: unread },
        links: { prev: null, next: null },
      },
    })
  })
  await page.routeWebSocket('wss://ws-ap1.pusher.com/**', (route) => {
    socket = route
    connections++
    route.onMessage((raw) => {
      const message = JSON.parse(String(raw)) as {
        event: string
        data: { channel?: string }
      }
      if (message.event === 'pusher:subscribe')
        route.send(
          JSON.stringify({
            event: 'pusher_internal:subscription_succeeded',
            channel: message.data.channel,
            data: '{}',
          }),
        )
      else if (message.event === 'pusher:ping')
        route.send(JSON.stringify({ event: 'pusher:pong', data: '{}' }))
    })
    route.send(
      JSON.stringify({
        event: 'pusher:connection_established',
        data: JSON.stringify({
          socket_id: `${connections}.456`,
          activity_timeout: 120,
        }),
      }),
    )
  })
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Masuk →' }).click()
  await expect(
    page.getByText('Real-time tersambung · sinkronisasi berkala aktif'),
  ).toBeVisible()
  const account = await page.evaluate(async () => {
    const response = await fetch('/api/v1/me', { credentials: 'include' })
    if (!response.ok) throw new Error(`Account request: ${response.status}`)
    return ((await response.json()) as { data: { id: number } }).data
  })
  unread = 1
  const event = JSON.stringify({
    event: 'notification.created',
    channel: `private-users.${account.id}`,
    data: JSON.stringify({
      id: notificationId,
      lead_id: 1,
      history_id: 1,
      kind: 'LEAD_STATUS_CHANGED',
    }),
  })
  socket!.send(event)
  await expect(
    page.getByRole('link', { name: 'Notifikasi, 1 belum dibaca' }),
  ).toBeVisible()
  const settled = notifications
  socket!.send(event)
  await expect.poll(() => notifications).toBe(settled)
  await page.getByRole('link', { name: 'Katalog properti', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Notifikasi, 1 belum dibaca' }),
  ).toBeVisible()
  socket!.close({ code: 1011 })
  await expect.poll(() => connections).toBeGreaterThan(1)
  await expect(
    page.getByText('Real-time tersambung · sinkronisasi berkala aktif'),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Profil', exact: true }).click()
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/login/)
  const csrfFailure = await page.request.post('/api/v1/realtime/auth', {
    headers: {
      Origin: 'http://127.0.0.1:3000',
      Referer: 'http://127.0.0.1:3000/',
    },
    data: { socket_id: '123.456', channel_name: `private-users.${account.id}` },
  })
  expect(csrfFailure.status()).toBe(419)
})
