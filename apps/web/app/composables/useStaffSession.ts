import type { StaffAccount } from '#shared/types'

export function useStaffSession() {
  const account = useState<StaffAccount | null>('staff-account', () => null)
  const api = useStaffApi()
  async function refresh({ redirectOnGuest = true } = {}) {
    try {
      account.value = (
        await api.request<{ data: StaffAccount }>('/api/v1/me')
      ).data
      return account.value
    } catch (error) {
      account.value = null
      const status = (error as { statusCode?: number }).statusCode
      // Only the identity endpoint's authentication/active-account denial is
      // a guest result. Network failures must remain retryable errors.
      if (status === 401 || status === 403) {
        if (!redirectOnGuest) return null
        await navigateTo('/login', { replace: true })
      }
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
