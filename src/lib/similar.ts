// similar.ts — Wave F6.B.
//
// Weighted similarity score between two listings. Pure function — no
// localStorage, no side effects, no DOM. Used by the SimilarListings island
// to surface the top-N closest matches in the sidebar.
//
// Weights (sum-of-max = 9.5):
//   district  → +3   (exact district = strongest signal of "nearby")
//   city      → +2   (cross-district, same city is still relevant)
//   zoning    → +1   (same imar/use type, when both sides have it)
//   sizeRatio → ×2   (0..2 — boosted for similar m²)
//   priceRatio→ ×1.5 (0..1.5 — boosted for similar TL)
//
// The size/price ratio terms use min/max so the function is symmetric and
// never divides by zero unless a listing has size or price === 0 (which is
// invalid in the data model; we still guard).

import type { Listing } from '@landx/data'

/**
 * Compute a similarity score for `candidate` relative to `current`.
 * Higher = more similar. Score is unbounded below ~0 only when district/
 * city/zoning all mismatch and size/price are wildly different (still
 * yields a small positive number from the ratios).
 */
export function similarityScore(current: Listing, candidate: Listing): number {
  let score = 0

  if (candidate.district === current.district) score += 3
  if (candidate.city === current.city) score += 2
  if (candidate.zoning && candidate.zoning === current.zoning) score += 1

  const sizeRatio = ratio(current.size, candidate.size)
  score += sizeRatio * 2

  const priceRatio = ratio(current.price, candidate.price)
  score += priceRatio * 1.5

  return score
}

function ratio(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  if (a <= 0 || b <= 0) return 0
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return min / max
}

/**
 * Return the top-N most similar listings (default 6). Always excludes the
 * `current` listing itself. Result is sorted by descending score, ties
 * broken by listing id (lexicographic) so output is stable across reloads.
 */
export function findSimilar(current: Listing, all: Listing[], n = 6): Listing[] {
  if (!current) return []
  return all
    .filter((l) => l.id !== current.id)
    .map((l) => ({ listing: l, score: similarityScore(current, l) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.listing.id.localeCompare(b.listing.id)
    })
    .slice(0, Math.max(0, n))
    .map((s) => s.listing)
}
