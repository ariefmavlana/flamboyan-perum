import type { APIRequestContext, Page } from '@playwright/test'
import type { Property } from '../../shared/types'

export async function demoProperty(
  request: APIRequestContext,
  origin = '',
): Promise<Property> {
  const response = await request.get(
    `${origin}/api/v1/properties?per_page=1&sort=price_asc`,
  )
  if (!response.ok()) throw new Error('Live catalogue API unavailable')
  const data = (await response.json()).data as Property[]
  if (!data[0])
    throw new Error(
      'Seed an isolated dynamic demo database before browser tests',
    )
  return data[0]
}

export async function marketingUser(
  page: Page,
): Promise<{ id: number; name: string }> {
  const users = await page.evaluate(
    async () =>
      (
        await (
          await fetch('/api/v1/internal/users?q=marketing%40example.test', {
            credentials: 'include',
          })
        ).json()
      ).data as { id: number; name: string; email: string }[],
  )
  const user = users.find((value) => value.email === 'marketing@example.test')
  if (!user) throw new Error('Live Marketing demo account unavailable')
  return user
}
