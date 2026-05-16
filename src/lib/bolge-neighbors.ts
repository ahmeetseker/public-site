// Wave F9.D — region neighbor + transport helpers for /bolge/[slug].
//
// Pure deterministic helpers (no localStorage, no fetch). Two responsibilities:
//
// 1. `findNeighbors(currentSlug, all, n)` — pick the N best "neighbor" regions
//    for a sidebar/grid. Scoring layers:
//      - same city               +3
//      - adjacent city (CITY_ADJACENCY) +2
//      - haversine distance (negative penalty in km / 100) — only used as
//        fallback ordering so very-far regions never beat near ones.
//
// 2. `getTransportInfo(slug)` — seeded mock returning the nearest airport,
//    motorway and (if the region is coastal) port. Same input → same output;
//    no real geocoding here. Centroids live in `REGION_CENTROIDS` below.
//
// Centroids and adjacency tables are intentionally hard-coded — the public-site
// mocks ship 8 regions today and we want bolge-neighbors to be deterministic
// without forcing every centroid into `@landx/data`. If a new region appears
// in REGIONS without a centroid entry we fall back to a city-level centroid
// so the helpers never throw.
import type { Region } from '@landx/data'

export interface Centroid {
  lat: number
  lng: number
}

export interface TransportItem {
  /** Display name, e.g. "İzmir Adnan Menderes". */
  name: string
  /** Approximate distance in km — deterministic, mock-grade. */
  km: number
}

export interface TransportInfo {
  airport: TransportItem
  motorway: TransportItem
  /** Only populated for coastal regions. */
  port?: TransportItem
}

/** Per-region centroids. Used for haversine distance fallback. */
export const REGION_CENTROIDS: Record<string, Centroid> = {
  ayvalik: { lat: 39.3192, lng: 26.6961 },
  cesme: { lat: 38.3236, lng: 26.3033 },
  datca: { lat: 36.7305, lng: 27.6863 },
  fethiye: { lat: 36.6212, lng: 29.1170 },
  urla: { lat: 38.3232, lng: 26.7644 },
  marmaris: { lat: 36.8550, lng: 28.2733 },
  soke: { lat: 37.7503, lng: 27.4097 },
  edremit: { lat: 39.5942, lng: 27.0247 },
}

/** Fallback centroid per city (so unmapped regions still place on the map). */
const CITY_CENTROIDS: Record<string, Centroid> = {
  Balıkesir: { lat: 39.6484, lng: 27.8826 },
  İzmir: { lat: 38.4192, lng: 27.1287 },
  Muğla: { lat: 37.2153, lng: 28.3636 },
  Aydın: { lat: 37.8560, lng: 27.8416 },
}

/** Adjacent-city table (symmetric — order doesn't matter). */
const CITY_ADJACENCY: Record<string, string[]> = {
  Balıkesir: ['İzmir', 'Çanakkale'],
  İzmir: ['Balıkesir', 'Aydın', 'Manisa'],
  Muğla: ['Aydın', 'Antalya', 'Denizli'],
  Aydın: ['İzmir', 'Muğla', 'Denizli'],
}

/** Coastal region slugs — used to decide whether to surface a port. */
const COASTAL_SLUGS = new Set([
  'ayvalik',
  'cesme',
  'datca',
  'fethiye',
  'urla',
  'marmaris',
  'edremit',
])

/**
 * Seeded transport mocks. Each region has a deterministic triplet so the chips
 * row stays stable across renders. Distance values are intentionally
 * approximate — sourced from public-knowledge ranges, not real geocoded data.
 */
const TRANSPORT_BY_SLUG: Record<string, TransportInfo> = {
  ayvalik: {
    airport: { name: 'Edremit Koca Seyit', km: 60 },
    motorway: { name: 'D550 Çanakkale–İzmir', km: 4 },
    port: { name: 'Ayvalık Limanı', km: 2 },
  },
  cesme: {
    airport: { name: 'İzmir Adnan Menderes', km: 80 },
    motorway: { name: 'O-32 Çeşme Otoyolu', km: 1 },
    port: { name: 'Çeşme Limanı', km: 1 },
  },
  datca: {
    airport: { name: 'Dalaman', km: 165 },
    motorway: { name: 'D330 Marmaris–Datça', km: 6 },
    port: { name: 'Datça Limanı', km: 1 },
  },
  fethiye: {
    airport: { name: 'Dalaman', km: 50 },
    motorway: { name: 'D400 Akdeniz Sahil Yolu', km: 2 },
    port: { name: 'Fethiye Limanı', km: 2 },
  },
  urla: {
    airport: { name: 'İzmir Adnan Menderes', km: 55 },
    motorway: { name: 'O-32 Çeşme Otoyolu', km: 3 },
    port: { name: 'İskele Mahallesi', km: 3 },
  },
  marmaris: {
    airport: { name: 'Dalaman', km: 90 },
    motorway: { name: 'D400 Akdeniz Sahil Yolu', km: 3 },
    port: { name: 'Marmaris Limanı', km: 2 },
  },
  soke: {
    airport: { name: 'İzmir Adnan Menderes', km: 105 },
    motorway: { name: 'D525 Söke–Aydın', km: 2 },
    // not coastal — port omitted
  },
  edremit: {
    airport: { name: 'Edremit Koca Seyit', km: 12 },
    motorway: { name: 'D550 Çanakkale–İzmir', km: 3 },
    port: { name: 'Akçay Marina', km: 7 },
  },
}

/** Look up a centroid by slug; fall back to city centroid; finally Türkiye geo-center. */
export function getRegionCentroid(region: Region): Centroid {
  const direct = REGION_CENTROIDS[region.slug]
  if (direct) return direct
  const city = CITY_CENTROIDS[region.city]
  if (city) return city
  return { lat: 39.0, lng: 35.0 }
}

/** Great-circle distance in km. */
export function haversineKm(a: Centroid, b: Centroid): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

interface ScoredRegion {
  region: Region
  score: number
  distanceKm: number
}

/**
 * Score and rank candidate neighbors. Exported for tests.
 * Higher score wins; ties broken by ascending haversine distance.
 */
export function scoreNeighbors(current: Region, candidates: Region[]): ScoredRegion[] {
  const currentCentroid = getRegionCentroid(current)
  const adjacent = new Set(CITY_ADJACENCY[current.city] ?? [])
  return candidates
    .filter((r) => r.slug !== current.slug)
    .map((r) => {
      let score = 0
      if (r.city === current.city) score += 3
      else if (adjacent.has(r.city)) score += 2
      const distance = haversineKm(currentCentroid, getRegionCentroid(r))
      // Soft distance bonus: closer regions get up to +1 score
      // (regions within 50km get the full bonus, fades to 0 at 500km).
      const distanceBonus = Math.max(0, 1 - distance / 500)
      score += distanceBonus
      return { region: r, score, distanceKm: distance }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.distanceKm - b.distanceKm
    })
}

/**
 * Pick the top `n` neighbors for `currentSlug` from `all`.
 * Returns an empty array if the current slug is missing.
 */
export function findNeighbors(
  currentSlug: string,
  all: Region[],
  n: number = 4,
): Region[] {
  const current = all.find((r) => r.slug === currentSlug)
  if (!current) return []
  return scoreNeighbors(current, all)
    .slice(0, n)
    .map((s) => s.region)
}

/** Returns seeded transport info, or a generic fallback for unknown slugs. */
export function getTransportInfo(slug: string): TransportInfo {
  const seeded = TRANSPORT_BY_SLUG[slug]
  if (seeded) return seeded
  return {
    airport: { name: 'En yakın havalimanı', km: 80 },
    motorway: { name: 'En yakın otoyol', km: 5 },
    ...(COASTAL_SLUGS.has(slug) ? { port: { name: 'En yakın liman', km: 5 } } : {}),
  }
}

/** Whether a region is on the coast (drives port chip visibility). */
export function isCoastal(slug: string): boolean {
  return COASTAL_SLUGS.has(slug)
}
