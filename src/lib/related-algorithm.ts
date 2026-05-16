/**
 * Wave F24.0 — Multi-factor "related listings" scorer.
 *
 * Deterministic pure function: given a source Listing + candidate pool,
 * scores each candidate 0-100 across type/location/price/size/geo/tags
 * and returns top-N sorted desc. Reasons array explains each contribution
 * — surfaces well in the SimilarListings card hover tooltip.
 *
 * Geo distance uses Haversine on `lat`/`lng` (km).
 */

import type { Listing } from '@landx/data'

export interface RelatedReason {
  label: string
  weight: number
}

export interface RelatedScore {
  listing: Listing
  score: number
  reasons: RelatedReason[]
}

const W_TYPE = 30
const W_CITY = 25
const W_DISTRICT = 20
const W_PRICE = 15
const W_SIZE = 10
const W_GEO = 15
const W_TAG = 5
const MAX_TAGS = 3

const PRICE_TOLERANCE = 0.2
const SIZE_TOLERANCE = 0.3
const GEO_MAX_KM = 50

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

function within(a: number, b: number, tolerance: number): boolean {
  if (b === 0) return a === 0
  return Math.abs(a - b) / b <= tolerance
}

export function scoreRelatedListing(source: Listing, candidate: Listing): RelatedScore {
  if (source.id === candidate.id) {
    return { listing: candidate, score: 0, reasons: [{ label: 'self', weight: 0 }] }
  }
  const reasons: RelatedReason[] = []
  let score = 0

  if (source.type === candidate.type) {
    score += W_TYPE
    reasons.push({ label: `Aynı tür (${candidate.type})`, weight: W_TYPE })
  }

  const sameCity = source.city === candidate.city
  if (sameCity) {
    score += W_CITY
    reasons.push({ label: `Aynı şehir (${candidate.city})`, weight: W_CITY })
    if (source.district === candidate.district) {
      score += W_DISTRICT
      reasons.push({ label: `Aynı ilçe (${candidate.district})`, weight: W_DISTRICT })
    }
  }

  if (within(candidate.price, source.price, PRICE_TOLERANCE)) {
    score += W_PRICE
    reasons.push({ label: `Yakın fiyat (±%${PRICE_TOLERANCE * 100})`, weight: W_PRICE })
  }

  if (within(candidate.size, source.size, SIZE_TOLERANCE)) {
    score += W_SIZE
    reasons.push({ label: `Yakın alan (±%${SIZE_TOLERANCE * 100})`, weight: W_SIZE })
  }

  const distanceKm = haversineKm({ lat: source.lat, lng: source.lng }, { lat: candidate.lat, lng: candidate.lng })
  if (distanceKm <= GEO_MAX_KM) {
    const geoFactor = Math.max(0, 1 - distanceKm / GEO_MAX_KM)
    const geoScore = Math.round(W_GEO * geoFactor)
    if (geoScore > 0) {
      score += geoScore
      reasons.push({ label: `${distanceKm.toFixed(1)} km uzaklıkta`, weight: geoScore })
    }
  }

  const overlap = (source.tags ?? []).filter((t) => (candidate.tags ?? []).includes(t)).slice(0, MAX_TAGS)
  if (overlap.length > 0) {
    const tagScore = overlap.length * W_TAG
    score += tagScore
    reasons.push({ label: `Ortak etiket: ${overlap.join(', ')}`, weight: tagScore })
  }

  score = Math.min(100, score)
  return { listing: candidate, score, reasons }
}

export interface ScoreOptions {
  /** Cap on returned candidates after sorting (defaults to 6). */
  limit?: number
  /** Minimum score below which candidates are dropped (defaults to 30). */
  minScore?: number
  /** Skip candidates whose `status !== 'Aktif'` (defaults to true). */
  activeOnly?: boolean
}

export function scoreRelatedListings(
  source: Listing,
  candidates: ReadonlyArray<Listing>,
  options: ScoreOptions = {},
): RelatedScore[] {
  const limit = options.limit ?? 6
  const minScore = options.minScore ?? 30
  const activeOnly = options.activeOnly ?? true

  const scored: RelatedScore[] = []
  for (const candidate of candidates) {
    if (candidate.id === source.id) continue
    if (activeOnly && candidate.status !== 'Aktif') continue
    const result = scoreRelatedListing(source, candidate)
    if (result.score < minScore) continue
    scored.push(result)
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
