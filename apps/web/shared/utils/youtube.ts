export function youtubeEmbed(url?: string | null) {
  if (!url) return null
  let source: URL
  try {
    source = new URL(url)
  } catch {
    return null
  }
  if (source.origin !== 'https://www.youtube-nocookie.com') return null
  const match = /^\/embed\/([\w-]{11})$/.exec(source.pathname)
  const start = Number(source.searchParams.get('start') ?? 0)
  if (!match || !Number.isInteger(start) || start < 0 || start > 86400)
    return null
  return { id: match[1]!, start }
}
