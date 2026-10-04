export function normalizedIp(value: string): string {
  return value.startsWith('::ffff:') ? value.slice(7) : value
}

export function trustedClientIp(
  remote: string,
  forwarded: string,
  trusted: string[],
): string {
  const peer = normalizedIp(remote)
  if (!trusted.includes(peer) || !forwarded) return peer
  const chain = [
    ...forwarded.split(',').map((ip) => normalizedIp(ip.trim())),
    peer,
  ]
  if (chain.length > 11) return peer
  while (chain.length > 1 && trusted.includes(chain.at(-1)!)) chain.pop()
  return chain.at(-1)!
}
