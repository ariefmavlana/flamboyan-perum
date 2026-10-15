import type { PublicContent } from '#shared/types'

export async function useDevelopment() {
  const config = useRuntimeConfig()
  const { data } = await useFetch<{ data: PublicContent }>('/api/v1/content', {
    key: 'public-development',
  })
  const development = computed(() => data.value?.data.development ?? null)
  const whatsappNumber = computed(
    () => development.value?.whatsapp ?? config.public.whatsappNumber,
  )
  const financingPrograms = computed(
    () => data.value?.data.financing_programs ?? [],
  )
  return { development, whatsappNumber, financingPrograms }
}
