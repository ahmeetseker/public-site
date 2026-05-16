// Premium Showcase — real Unsplash photos keyed by listing type.
//
// Each pool below contains Unsplash photo IDs verified via direct HEAD checks
// (HTTP 200 from `https://images.unsplash.com/photo-<id>?w=400&h=300...`).
// Selection is deterministic per-listing (hash of `listing.id`) so SSR and
// CSR render the same URL — no hydration flicker, no flash of placeholder.

import type { Listing, ListingType } from '@landx/data'

const POOLS: Record<ListingType, readonly string[]> = {
  // Countryside / rural / development plots.
  'İmarlı': [
    '1500382017468-9049fed747ef',
    '1465925508512-1e7052bb62e6',
    '1505144808419-1957a94ca61e',
  ],
  // Farmland / open fields.
  'Tarla': [
    '1500595046743-cd271d694d30',
    '1464983953574-0892a716854b',
    '1574323347407-f5e1ad6d020b',
  ],
  // Olive groves / Mediterranean trees.
  'Zeytinlik': [
    '1518780664697-55e3ad937233',
    '1502082553048-f009c37129b9',
    '1466692476868-aef1dfb1e735',
  ],
  // Coastal / scenic villa plots.
  'Villa Arsası': [
    '1505144808419-1957a94ca61e',
    '1473773508845-188df298d2d1',
    '1568571780765-9276ac8b75a2',
  ],
}

// Deterministic 32-bit string hash — stable across renders + environments.
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getShowcaseImageUrl(
  listing: Listing,
  width = 1200,
  height = 675,
): string {
  const pool = POOLS[listing.type] ?? POOLS['İmarlı']
  const idx = hashStr(listing.id) % pool.length
  const id = pool[idx]
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=80`
}
