import type { Paginated } from '#shared/types'
export interface StaffNotice {
  id: string
  kind: string
  lead_id: number
  read_at: string | null
  created_at: string
}
export function useNotificationInbox() {
  const notices = useState<
    (Paginated<StaffNotice> & { unread_count: number }) | null
  >('notification-inbox', () => null)
  const api = useStaffApi()
  async function refresh(page = notices.value?.meta.current_page ?? 1) {
    const response = await api.request<NonNullable<typeof notices.value>>(
      `/api/v1/notifications?page=${page}`,
    )
    notices.value = response
  }
  async function read(id: string) {
    await api.request(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    })
    await refresh()
  }
  function clear() {
    notices.value = null
  }
  return { notices, refresh, read, clear }
}
