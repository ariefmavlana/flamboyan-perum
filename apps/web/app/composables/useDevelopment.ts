import type { PublicContent } from '#shared/types'

export async function useDevelopment() {
  const config = useRuntimeConfig()
  const { data, error } = await useFetch<{ data: PublicContent }>(
    '/api/v1/content',
    {
      key: 'public-development',
      // Share only this server render's payload and its hydration, never a global cache.
      // Navigation and explicit refresh still fetch current CMS content.
      getCachedData: (key, nuxtApp, context) =>
        context.cause === 'initial' && (import.meta.server || nuxtApp.isHydrating)
          ? nuxtApp.payload.data[key]
          : undefined,
    },
  )
  const development = computed(() => data.value?.data.development ?? null)
  const whatsappNumber = computed(
    () => development.value?.whatsapp ?? config.public.whatsappNumber,
  )
  const financingPrograms = computed(
    () => data.value?.data.financing_programs ?? [],
  )
  return {
    development,
    whatsappNumber,
    financingPrograms,
    content: data,
    error,
  }
}
