export function useStaffApi() {
  async function request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH'
      body?: Record<string, unknown> | FormData
    } = {},
  ): Promise<T> {
    if (options.method && options.method !== 'GET')
      await $fetch('/sanctum/csrf-cookie', { credentials: 'include' })
    refreshCookie('XSRF-TOKEN')
    const xsrf = useCookie<string | null>('XSRF-TOKEN').value
    return await $fetch<T, string>(path, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      },
    })
  }
  return { request }
}
