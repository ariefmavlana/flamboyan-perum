export function useComparison() {
  const ids = useState<number[]>('comparison-ids', () => [])
  const message = useState<string>('comparison-message', () => '')
  const ready = useState<boolean>('comparison-ready', () => false)
  const tracking = useAnalytics()
  onMounted(() => {
    if (ready.value) return
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem('flamboyan-comparison') ?? '[]',
      )
      if (Array.isArray(saved))
        ids.value = [
          ...new Set(
            saved.filter(
              (id): id is number => Number.isSafeInteger(id) && id > 0,
            ),
          ),
        ].slice(0, 3)
    } catch {
      ids.value = []
    }
    ready.value = true
  })
  function toggle(id: number) {
    message.value = ''
    if (ids.value.includes(id))
      ids.value = ids.value.filter((item) => item !== id)
    else if (ids.value.length < 3) {
      ids.value = [...ids.value, id]
      tracking.track('compare_property', {
        property_id: id,
        page_type: 'katalog',
        content_group: 'perbandingan',
      })
    } else
      message.value = 'Maksimum 3 properti. Hapus satu pilihan terlebih dahulu.'
    try {
      localStorage.setItem('flamboyan-comparison', JSON.stringify(ids.value))
    } catch {
      /* Selection still works without persistent storage. */
    }
  }
  return { ids, message, ready, toggle }
}
