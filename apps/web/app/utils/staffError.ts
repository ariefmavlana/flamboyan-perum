export function staffError(error: unknown): string {
  const failure = error as {
    statusCode?: number
    data?: { message?: string; errors?: Record<string, string[]> }
  }
  if (failure.statusCode === 401) return 'Sesi berakhir. Silakan masuk kembali.'
  if (failure.statusCode === 409)
    return `${failure.data?.message ?? 'Data sudah berubah.'} Muat ulang dan periksa kembali sebelum menyimpan.`
  if (failure.statusCode === 422)
    return (
      Object.values(failure.data?.errors ?? {})
        .flat()
        .join(' ') || failure.data?.message || 'Periksa isian formulir.'
    )
  return (
    failure.data?.message ?? 'Permintaan belum berhasil. Silakan coba kembali.'
  )
}
