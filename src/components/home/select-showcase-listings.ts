import type { Listing } from '@landx/data'

export interface SelectOptions {
  limit?: number
  override?: Listing[]
}

const DEFAULT_LIMIT = 8
const IMARLI_MIN_FOR_PREFERENCE = 3

export function selectShowcaseListings(
  listings: Listing[],
  options: SelectOptions = {},
): Listing[] {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (options.override && options.override.length > 0) {
    return options.override.slice(0, limit)
  }
  const active = listings.filter((l) => l.status === 'Aktif')
  if (active.length === 0) return []
  const imarli = active.filter((l) => l.type === 'İmarlı')
  const pool = imarli.length >= IMARLI_MIN_FOR_PREFERENCE ? imarli : active
  return [...pool].sort((a, b) => b.price - a.price).slice(0, limit)
}
