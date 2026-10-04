export function usePropertyAnalytics() {
  const config = useRuntimeConfig()
  function record(
    propertyId: number,
    event: 'property_view' | 'whatsapp_click',
  ) {
    if (
      !import.meta.client ||
      String(config.public.analyticsEnabled) !== 'true'
    )
      return
    void fetch('/api/v1/analytics', {
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId, event }),
    }).catch(() => {})
  }
  return { record }
}
