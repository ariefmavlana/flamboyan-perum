import type { StaffAccount } from '#shared/types'

export function useStaffSession() {
  const account = useState<StaffAccount | null>('staff-account', () => null)
  const api = useStaffApi()
  async function refresh() {
    try {
      account.value = (
        await api.request<{ data: StaffAccount }>('/api/v1/me')
      ).data
    } catch (error) {
      account.value = null
      if ((error as { statusCode?: number }).statusCode === 401)
        await navigateTo('/login')
      throw error
    }
  }
  async function logout() {
    await api.request('/auth/logout', { method: 'POST' })
    account.value = null
    await navigateTo('/login')
  }
  return { account, refresh, logout }
}
