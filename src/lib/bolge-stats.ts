/**
 * Wave F6 / Agent-F6D — pure aggregator for /bölge[slug] stats panel.
 *
 * Inputs:  bolge slug (acts as deterministic seed for the trend) + the listings
 *          that already belong to the bolge (caller pre-filters via getRegionListings).
 * Outputs: 4 stat cards + a 12-month synthetic price trend.
 *
 * The trend is intentionally NOT pulled from listings — there's no time-series
 * data in the mock — but is generated deterministically per bolge slug so
 * re-renders, SSR/CSR mounts, and snapshots all stay stable.
 */
import type { Listing } from '@landx/data'

export const MONTHLY_TREND_LENGTH = 12

export interface BolgeStats {
  /** Volume-weighted is overkill for mock; simple mean across listings. */
  avgPricePerSqm: number
  totalListings: number
  newLast30Days: number
  smallestSize: number
  largestSize: number
  /** 12 deterministic monthly bars (oldest → newest). Values roughly index 800–6000 ₺/m². */
  monthlyTrend: number[]
}

/** Quick FNV-1a 32-bit hash — small, dependency-free, deterministic. */
function hash32(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0 // force unsigned
}

/** Mulberry32 PRNG seeded from a uint32. Returns a generator in [0, 1). */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build a 12-bar trend deterministic per slug. Range ~ [base, base*1.6]. */
function buildMonthlyTrend(slug: string, basePrice: number): number[] {
  const rng = mulberry32(hash32(slug || 'default'))
  const base = basePrice > 0 ? basePrice : 2_400 // sensible default ₺/m² for empty bolge
  const bars: number[] = []
  // Slight upward drift across the 12 months, randomised per slug.
  for (let i = 0; i < MONTHLY_TREND_LENGTH; i++) {
    const drift = 1 + (i / MONTHLY_TREND_LENGTH) * 0.25 // up to +25% by the last bar
    const noise = 0.8 + rng() * 0.5 // 0.8..1.3
    bars.push(Math.round(base * drift * noise))
  }
  return bars
}

/** Approximate "last 30 days" counter — uses lastUpdate which is the freshest timestamp we have. */
function countRecent(listings: Listing[]): number {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  let n = 0
  for (const l of listings) {
    const t = Date.parse(l.lastUpdate)
    if (!Number.isNaN(t) && t >= cutoff) n++
  }
  return n
}

export function computeStats(bolge: string, listings: Listing[]): BolgeStats {
  const total = listings.length

  let sumPpsm = 0
  let countPpsm = 0
  let smallest = Number.POSITIVE_INFINITY
  let largest = 0
  for (const l of listings) {
    if (l.size > 0) {
      sumPpsm += l.price / l.size
      countPpsm++
    }
    if (l.size > 0 && l.size < smallest) smallest = l.size
    if (l.size > largest) largest = l.size
  }
  const avgPricePerSqm = countPpsm > 0 ? Math.round(sumPpsm / countPpsm) : 0
  const smallestSize = smallest === Number.POSITIVE_INFINITY ? 0 : smallest
  const largestSize = largest

  return {
    avgPricePerSqm,
    totalListings: total,
    newLast30Days: countRecent(listings),
    smallestSize,
    largestSize,
    monthlyTrend: buildMonthlyTrend(bolge, avgPricePerSqm),
  }
}
