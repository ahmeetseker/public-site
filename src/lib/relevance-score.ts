/**
 * Wave F6 / Agent-F6D — TR-locale relevance scoring for /ara `?sort=relevance`.
 *
 * Pure deterministic ranking: title*10 + district*5 + city*3 + zoning*2.
 * Server-side filter already narrows the result set (substring match across
 * id/title/city/district/tags); this scorer is purely a tiebreaker / display
 * sort for the relevance picker option. Empty queries yield 0 — callers
 * should bail back to the default lastUpdate sort.
 */
import type { Listing } from '@landx/data'

const TR_LOCALE = 'tr-TR'

const WEIGHT_TITLE = 10
const WEIGHT_DISTRICT = 5
const WEIGHT_CITY = 3
const WEIGHT_ZONING = 2

export const RELEVANCE_WEIGHTS = {
  title: WEIGHT_TITLE,
  district: WEIGHT_DISTRICT,
  city: WEIGHT_CITY,
  zoning: WEIGHT_ZONING,
} as const

/** Score a single listing against a free-text query (Turkish-locale lowercased). */
export function relevanceScore(listing: Listing, query: string): number {
  const q = query.trim().toLocaleLowerCase(TR_LOCALE)
  if (!q) return 0

  let score = 0
  if (listing.title && listing.title.toLocaleLowerCase(TR_LOCALE).includes(q)) {
    score += WEIGHT_TITLE
  }
  if (listing.district && listing.district.toLocaleLowerCase(TR_LOCALE).includes(q)) {
    score += WEIGHT_DISTRICT
  }
  if (listing.city && listing.city.toLocaleLowerCase(TR_LOCALE).includes(q)) {
    score += WEIGHT_CITY
  }
  if (listing.zoning && listing.zoning.toLocaleLowerCase(TR_LOCALE).includes(q)) {
    score += WEIGHT_ZONING
  }
  return score
}

/**
 * Stable descending sort by `relevanceScore`. Listings with score 0 are
 * pushed to the tail (still included — caller decides whether to drop them).
 * When `query` is empty, returns the original order untouched.
 */
export function sortByRelevance(listings: Listing[], query: string): Listing[] {
  if (!query.trim()) return [...listings]
  const scored = listings.map((l, i) => ({ l, i, s: relevanceScore(l, query) }))
  scored.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s
    return a.i - b.i // preserve input order within equal scores
  })
  return scored.map((e) => e.l)
}
