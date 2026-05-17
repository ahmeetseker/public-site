# Wave A — Data-Layer Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every direct `LISTINGS` / `LISTINGS_V2` import in the public-site app code with TanStack Query hooks (React islands) or async server getters (Astro frontmatter / endpoints), routed through a single `apiOrMock()` switch so the backend flip is one-line.

**Architecture:** New `packages/data/src/query/aggregators.ts` module exports paired surfaces — `resolveX()` private resolver + `getXAsync()` server getter + `useX()` TanStack hook. All three call the same resolver, which routes via `apiOrMock(landxApi.listings.list(params), mockAsync(localFilter(LISTINGS)))`. Mock data stays where it is; only the import surface changes. Local ESLint `no-restricted-imports` rule blocks `LISTINGS` imports outside `@landx/data` and test paths.

**Tech Stack:** Astro 6 (SSG, `output: 'static'`), React 19 islands, TanStack Query 5, vitest 4, `@landx/api-client` SDK (OpenAPI-derived), `@landx/eslint-config` (flat config), pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md`

---

## Task Map

1. **Task 1** — Aggregator module foundation (keys + resolvers + hooks + getters + tests)
2. **Task 2** — Migrate `src/components/home/*` build-time consumers
3. **Task 3** — Migrate `src/components/bolge/*` build-time consumers
4. **Task 4** — Migrate `pages/ara.astro` (TR + EN)
5. **Task 5** — Migrate `pages/ilan/[slug].astro` (TR + EN) + OG endpoints
6. **Task 6** — Migrate `pages/ofis/[slug].astro` + `pages/kategori/[slug].astro` (TR + EN)
7. **Task 7** — Migrate `pages/hesabim/*` + `pages/sitemap*` + `pages/sitemap.xml.ts`
8. **Task 8** — Refactor `lib/use-filtered-listings.ts` (client hook)
9. **Task 9** — Refactor `components/compare/CompareIsland.tsx`
10. **Task 10** — Refactor `components/listing/SimilarListingsIsland.tsx`
11. **Task 11** — Refactor `lib/command-palette.ts` + `CommandPaletteMount.tsx`
12. **Task 12** — Refactor `lib/office-portfolio.ts`
13. **Task 13** — Add local ESLint config + `no-restricted-imports` + `pnpm lint` script + enforce
14. **Task 14** — Final bundle audit (`dist/stats.html` + grep), close-out commit

---

## Task 1: Aggregator module foundation

**Files:**
- Modify: `packages/data/src/query/keys.ts` (add new key factories)
- Create: `packages/data/src/query/aggregators.ts`
- Create: `packages/data/src/__tests__/aggregators.test.ts`
- Modify: `packages/data/src/index.ts` (re-export aggregators)

### Step 1.1 — Extend `query/keys.ts` with new key factories

- [ ] **Write the change**

Modify `packages/data/src/query/keys.ts`. Append the new keys at the bottom of the relevant factories. Show the exact additions:

In `listingKeys`, replace the existing block with:
```ts
export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (f?: ListingFilters) => [...listingKeys.lists(), f ?? {}] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
  statusCounts: () => [...listingKeys.all, 'status-counts'] as const,
  featured: (params: { limit: number; locale: 'tr' | 'en'; category?: string }) =>
    [...listingKeys.all, 'featured', params] as const,
  showcase: (params: { limit: number; locale: 'tr' | 'en' }) =>
    [...listingKeys.all, 'showcase', params] as const,
  similar: (id: string, opts: { limit: number; minScore: number }) =>
    [...listingKeys.all, 'similar', id, opts] as const,
  byIds: (ids: readonly string[]) =>
    [...listingKeys.all, 'by-ids', [...ids].sort()] as const,
  bySlug: (slug: string) => [...listingKeys.all, 'by-slug', slug] as const,
  search: (filters: ListingFilters) =>
    [...listingKeys.all, 'search', filters] as const,
  paletteSearch: (query: string) =>
    [...listingKeys.all, 'palette', query] as const,
  byCategory: (category: string, filters?: ListingFilters) =>
    [...listingKeys.all, 'by-category', category, filters ?? {}] as const,
  byOffice: (officeId: string) =>
    [...listingKeys.all, 'by-office', officeId] as const,
  allSlugs: (locale: 'tr' | 'en') =>
    [...listingKeys.all, 'all-slugs', locale] as const,
}
```

Replace the existing `regionKeys` with:
```ts
export const regionKeys = {
  all: ['regions'] as const,
  lists: () => [...regionKeys.all, 'list'] as const,
  details: () => [...regionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...regionKeys.details(), slug] as const,
  listings: (slug: string) => [...regionKeys.all, 'listings', slug] as const,
  popular: (params: { limit: number; locale: 'tr' | 'en' }) =>
    [...regionKeys.all, 'popular', params] as const,
  neighborCounts: (slugs: readonly string[]) =>
    [...regionKeys.all, 'neighbor-counts', [...slugs].sort()] as const,
}
```

Append a new factory at the end of the file:
```ts
export const statsKeys = {
  all: ['stats'] as const,
  band: (locale: 'tr' | 'en') => [...statsKeys.all, 'band', locale] as const,
}
```

Modify the existing `officeKeys` to add a `listings` sub-key. Replace it with:
```ts
export const officeKeys = {
  all: ['offices'] as const,
  lists: () => [...officeKeys.all, 'list'] as const,
  list: (city?: string) => [...officeKeys.lists(), city ?? null] as const,
  details: () => [...officeKeys.all, 'detail'] as const,
  detail: (slug: string) => [...officeKeys.details(), slug] as const,
  listings: (officeId: string) =>
    [...officeKeys.all, 'listings', officeId] as const,
}
```

- [ ] **Typecheck**

Run from repo root: `pnpm --filter @landx/data typecheck` (or `pnpm typecheck` if root maps).
If `@landx/data` has no typecheck script, run `pnpm --filter @landx/data exec tsc --noEmit`.
Expected: 0 errors.

### Step 1.2 — Write failing tests for aggregator resolvers

- [ ] **Create the test file**

Create `packages/data/src/__tests__/aggregators.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { LISTINGS } from '../mock/listings'
import {
  resolveFeaturedListings,
  resolveShowcaseListings,
  resolvePopularRegions,
  resolveNeighborRegionCounts,
  resolveStatsBand,
  resolveSimilarListings,
  resolveListingsByIds,
  resolveCommandPaletteSearch,
  resolveOfficeListings,
  resolveListingDetail,
  resolveCategoryListings,
  resolveAllListingSlugs,
  resolveSearchResults,
} from '../query/aggregators'

describe('resolveFeaturedListings', () => {
  it('returns at most `limit` active listings', async () => {
    const result = await resolveFeaturedListings({ limit: 3, locale: 'tr' })
    expect(result).toHaveLength(3)
    expect(result.every((l) => l.status === 'Aktif')).toBe(true)
  })

  it('returns fewer than `limit` when the active pool is smaller', async () => {
    const aktifCount = LISTINGS.filter((l) => l.status === 'Aktif').length
    const result = await resolveFeaturedListings({ limit: aktifCount + 50, locale: 'tr' })
    expect(result.length).toBeLessThanOrEqual(aktifCount)
  })
})

describe('resolveShowcaseListings', () => {
  it('prefers İmarlı when at least 3 are available, sorted by price desc', async () => {
    const result = await resolveShowcaseListings({ limit: 4, locale: 'tr' })
    expect(result.length).toBeLessThanOrEqual(4)
    if (result.length > 1) {
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].price).toBeGreaterThanOrEqual(result[i].price)
      }
    }
  })
})

describe('resolvePopularRegions', () => {
  it('returns each region with a listing count, sorted desc', async () => {
    const result = await resolvePopularRegions({ limit: 5, locale: 'tr' })
    expect(result.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count)
    }
    for (const r of result) {
      expect(typeof r.region).toBe('string')
      expect(typeof r.slug).toBe('string')
      expect(typeof r.count).toBe('number')
    }
  })
})

describe('resolveStatsBand', () => {
  it('returns aggregate counts derived from mock data', async () => {
    const stats = await resolveStatsBand({ locale: 'tr' })
    expect(stats.totalListings).toBe(LISTINGS.length)
    expect(stats.cityCount).toBeGreaterThan(0)
    expect(stats.districtCount).toBeGreaterThan(0)
    expect(stats.totalValueB).toBeGreaterThan(0)
  })
})

describe('resolveSimilarListings', () => {
  it('excludes the current listing and respects limit', async () => {
    const current = LISTINGS[0]
    const result = await resolveSimilarListings(current.id, { limit: 3, minScore: 0 })
    expect(result.length).toBeLessThanOrEqual(3)
    expect(result.every((l) => l.id !== current.id)).toBe(true)
  })

  it('returns empty array for unknown id', async () => {
    const result = await resolveSimilarListings('does-not-exist', { limit: 5, minScore: 0 })
    expect(result).toEqual([])
  })
})

describe('resolveListingsByIds', () => {
  it('preserves the input id order', async () => {
    const ids = [LISTINGS[2].id, LISTINGS[0].id, LISTINGS[1].id]
    const result = await resolveListingsByIds(ids)
    expect(result.map((l) => l.id)).toEqual(ids)
  })

  it('drops unknown ids silently', async () => {
    const result = await resolveListingsByIds([LISTINGS[0].id, 'unknown-x'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(LISTINGS[0].id)
  })
})

describe('resolveCommandPaletteSearch', () => {
  it('caps each entity bucket at 5 results', async () => {
    const result = await resolveCommandPaletteSearch('a')
    expect(result.listings.length).toBeLessThanOrEqual(5)
    expect(result.offices.length).toBeLessThanOrEqual(5)
    expect(result.regions.length).toBeLessThanOrEqual(5)
  })

  it('returns empty buckets for empty query', async () => {
    const result = await resolveCommandPaletteSearch('')
    expect(result.listings).toEqual([])
    expect(result.offices).toEqual([])
    expect(result.regions).toEqual([])
  })
})

describe('resolveListingDetail', () => {
  it('resolves by slug (`<title-slug>-<id>` format)', async () => {
    const l = LISTINGS[0]
    const slug = `${l.title
      .toLocaleLowerCase('tr-TR')
      .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c] || c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${l.id}`
    const result = await resolveListingDetail(slug)
    expect(result?.id).toBe(l.id)
  })

  it('returns null for unknown slug', async () => {
    const result = await resolveListingDetail('does-not-exist-12345')
    expect(result).toBeNull()
  })
})

describe('resolveAllListingSlugs', () => {
  it('returns one slug per active listing', async () => {
    const result = await resolveAllListingSlugs({ locale: 'tr' })
    const aktif = LISTINGS.filter((l) => l.status === 'Aktif').length
    expect(result.length).toBe(aktif)
    expect(result.every((s) => typeof s.slug === 'string' && typeof s.id === 'string')).toBe(true)
  })
})

describe('resolveSearchResults', () => {
  it('applies category + type + city + priceMax + keyword filters', async () => {
    const all = await resolveSearchResults({ status: 'Aktif' })
    expect(all.every((l) => l.status === 'Aktif')).toBe(true)
  })
})

describe('resolveOfficeListings', () => {
  it('returns listings deterministically matched to the office', async () => {
    const r1 = await resolveOfficeListings('OFC-1')
    const r2 = await resolveOfficeListings('OFC-1')
    expect(r1.map((l) => l.id)).toEqual(r2.map((l) => l.id))
  })

  it('returns empty array for unknown office id', async () => {
    const result = await resolveOfficeListings('unknown-office')
    expect(result).toEqual([])
  })
})

describe('resolveNeighborRegionCounts', () => {
  it('returns one entry per requested slug', async () => {
    const slugs = ['cesme', 'datca', 'bodrum']
    const result = await resolveNeighborRegionCounts({ slugs })
    expect(result).toHaveLength(slugs.length)
    expect(result.map((r) => r.slug).sort()).toEqual([...slugs].sort())
  })
})

describe('resolveCategoryListings', () => {
  it('filters by category', async () => {
    const result = await resolveCategoryListings('arsa', { status: 'Aktif' })
    expect(result.every((l) => (l.category ?? 'arsa') === 'arsa')).toBe(true)
  })
})
```

- [ ] **Run the test, watch it fail**

```bash
pnpm --filter @landx/data exec vitest run aggregators.test.ts
```
Expected: FAIL — `Cannot find module '../query/aggregators'`. This is the desired failing state for TDD step 1.

### Step 1.3 — Implement `aggregators.ts`

- [ ] **Create the implementation file**

Create `packages/data/src/query/aggregators.ts`:
```ts
/**
 * Wave A — public-site aggregator surfaces.
 *
 * Each capability is exposed in three forms:
 *   - resolveX(...)   private resolver — the single source of truth
 *   - getXAsync(...)  server getter — call from Astro frontmatter / endpoints
 *   - useX(...)       TanStack Query hook — call from React islands
 *
 * All three call the same resolver. The resolver routes through
 * `apiOrMock(apiCall, mockCall)` so when the backend is wired up the swap is
 * a single configureApi() call elsewhere.
 *
 * Mock implementations live in this file (filter/sort/aggregate over the
 * local LISTINGS array). The SDK currently only exposes /listings list/get;
 * once the backend gains /listings/featured, /listings/:id/similar etc., the
 * apiCall branches below get filled in. Until then they fall back to
 * apiOrMock's `mockCall`.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { LISTINGS } from '../mock/listings'
import { OFFICES } from '../mock/offices'
import { REGIONS } from '../mock/regions'
import type { Listing, ListingStatus, ListingType } from '../mock/types'
import { apiOrMock, landxApi } from '../api'
import { mockAsync } from './mock-latency'
import {
  listingKeys,
  regionKeys,
  statsKeys,
  officeKeys,
  type ListingFilters,
} from './keys'

type Locale = 'tr' | 'en'

// ── slugify (TR-aware, mirrors the inline helper used in Astro pages) ──
function slugifyTitle(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function listingSlug(l: Listing): string {
  return `${slugifyTitle(l.title)}-${l.id}`
}

// ─────────────────────────────────────────────────────────────────────────
// Featured listings — top N active, recency-biased
// ─────────────────────────────────────────────────────────────────────────
export interface FeaturedListingsParams {
  limit: number
  locale: Locale
  category?: string
}

export function resolveFeaturedListings(params: FeaturedListingsParams): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () =>
      landxApi.listings
        .list({ status: 'Aktif', limit: params.limit })
        .then((env) => env.data as unknown as Listing[]),
    () => {
      const filtered = LISTINGS.filter((l) => {
        if (l.status !== 'Aktif') return false
        if (params.category && (l.category ?? 'arsa') !== params.category) return false
        return true
      })
      return mockAsync(filtered.slice(0, params.limit))
    },
  )
}

export const getFeaturedListingsAsync = resolveFeaturedListings

export function useFeaturedListings(params: FeaturedListingsParams) {
  return useQuery({
    queryKey: listingKeys.featured(params),
    queryFn: () => resolveFeaturedListings(params),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Showcase listings — İmarlı-preferred, price-desc
// ─────────────────────────────────────────────────────────────────────────
export interface ShowcaseListingsParams {
  limit: number
  locale: Locale
}

const SHOWCASE_IMARLI_MIN = 3

export function resolveShowcaseListings(params: ShowcaseListingsParams): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () =>
      landxApi.listings
        .list({ status: 'Aktif', limit: params.limit })
        .then((env) => env.data as unknown as Listing[]),
    () => {
      const active = LISTINGS.filter((l) => l.status === 'Aktif')
      if (active.length === 0) return mockAsync([])
      const imarli = active.filter((l) => l.type === 'İmarlı')
      const pool = imarli.length >= SHOWCASE_IMARLI_MIN ? imarli : active
      const sorted = [...pool].sort((a, b) => b.price - a.price).slice(0, params.limit)
      return mockAsync(sorted)
    },
  )
}

export const getShowcaseListingsAsync = resolveShowcaseListings

export function useShowcaseListings(params: ShowcaseListingsParams) {
  return useQuery({
    queryKey: listingKeys.showcase(params),
    queryFn: () => resolveShowcaseListings(params),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Popular regions — per-region listing count, sorted desc
// ─────────────────────────────────────────────────────────────────────────
export interface PopularRegionsParams {
  limit: number
  locale: Locale
}

export interface PopularRegion {
  region: string
  slug: string
  count: number
}

export function resolvePopularRegions(params: PopularRegionsParams): Promise<PopularRegion[]> {
  return apiOrMock<PopularRegion[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const counts = REGIONS.map((r) => ({
        region: r.name,
        slug: r.slug,
        count: LISTINGS.filter((l) => l.district.includes(r.name)).length,
      }))
      const sorted = counts.sort((a, b) => b.count - a.count).slice(0, params.limit)
      return mockAsync(sorted)
    },
  )
}

export const getPopularRegionsAsync = resolvePopularRegions

export function usePopularRegions(params: PopularRegionsParams) {
  return useQuery({
    queryKey: regionKeys.popular(params),
    queryFn: () => resolvePopularRegions(params),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Neighbor region counts — bolge/* siblings rely on per-slug listing counts
// ─────────────────────────────────────────────────────────────────────────
export interface NeighborRegionCountsParams {
  slugs: readonly string[]
}

export interface NeighborRegionCount {
  slug: string
  count: number
}

export function resolveNeighborRegionCounts(
  params: NeighborRegionCountsParams,
): Promise<NeighborRegionCount[]> {
  return apiOrMock<NeighborRegionCount[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const map = new Map(REGIONS.map((r) => [r.slug, r]))
      const out = params.slugs.map((slug) => {
        const region = map.get(slug)
        const count = region
          ? LISTINGS.filter((l) => l.district.includes(region.name)).length
          : 0
        return { slug, count }
      })
      return mockAsync(out)
    },
  )
}

export const getNeighborRegionCountsAsync = resolveNeighborRegionCounts

export function useNeighborRegionCounts(params: NeighborRegionCountsParams) {
  return useQuery({
    queryKey: regionKeys.neighborCounts(params.slugs),
    queryFn: () => resolveNeighborRegionCounts(params),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Stats band — aggregate counters for the home StatsBand strip
// ─────────────────────────────────────────────────────────────────────────
export interface StatsBandParams {
  locale: Locale
}

export interface StatsBandData {
  totalListings: number
  cityCount: number
  districtCount: number
  totalValueB: number
}

export function resolveStatsBand(params: StatsBandParams): Promise<StatsBandData> {
  return apiOrMock<StatsBandData>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const totalListings = LISTINGS.length
      const cityCount = new Set(LISTINGS.map((l) => l.city)).size
      const districtCount = new Set(
        LISTINGS.map((l) => l.district.split(' · ')[0]),
      ).size
      const totalValueB = LISTINGS.reduce((sum, l) => sum + l.price, 0) / 1_000_000
      return mockAsync({ totalListings, cityCount, districtCount, totalValueB })
    },
  )
}

export const getStatsBandAsync = resolveStatsBand

export function useStatsBand(params: StatsBandParams) {
  return useQuery({
    queryKey: statsKeys.band(params.locale),
    queryFn: () => resolveStatsBand(params),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Similar listings — used by SimilarListingsIsland.tsx
// scoring lives in src/lib/related-algorithm.ts; we inline the same
// algorithm here so @landx/data has no inward dep on the app code.
// ─────────────────────────────────────────────────────────────────────────
export interface SimilarListingsOpts {
  limit: number
  minScore: number
}

function similarityScore(current: Listing, candidate: Listing): number {
  let s = 0
  if (candidate.district === current.district) s += 3
  if (candidate.city === current.city) s += 2
  if (candidate.zoning && candidate.zoning === current.zoning) s += 1
  const sizeRatio = ratioPair(current.size, candidate.size)
  s += sizeRatio * 2
  const priceRatio = ratioPair(current.price, candidate.price)
  s += priceRatio * 1.5
  return s
}

function ratioPair(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  if (a <= 0 || b <= 0) return 0
  return Math.min(a, b) / Math.max(a, b)
}

export function resolveSimilarListings(
  currentId: string,
  opts: SimilarListingsOpts,
): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const current = LISTINGS.find((l) => l.id === currentId)
      if (!current) return mockAsync([])
      const scored = LISTINGS.filter((l) => l.id !== currentId && l.status === 'Aktif').map(
        (l) => ({ l, score: similarityScore(current, l) }),
      )
      const filtered = scored
        .filter((x) => x.score >= opts.minScore)
        .sort((a, b) => (b.score === a.score ? a.l.id.localeCompare(b.l.id) : b.score - a.score))
        .slice(0, opts.limit)
        .map((x) => x.l)
      return mockAsync(filtered)
    },
  )
}

export function useSimilarListings(currentId: string, opts: SimilarListingsOpts) {
  return useQuery({
    queryKey: listingKeys.similar(currentId, opts),
    queryFn: () => resolveSimilarListings(currentId, opts),
    enabled: !!currentId,
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Listings by id — Compare island
// ─────────────────────────────────────────────────────────────────────────
export function resolveListingsByIds(ids: readonly string[]): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const map = new Map(LISTINGS.map((l) => [l.id, l]))
      const out: Listing[] = []
      for (const id of ids) {
        const hit = map.get(id)
        if (hit) out.push(hit)
      }
      return mockAsync(out)
    },
  )
}

export function useListingsByIds(ids: readonly string[]) {
  return useQuery({
    queryKey: listingKeys.byIds(ids),
    queryFn: () => resolveListingsByIds(ids),
    enabled: ids.length > 0,
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Command palette search — listings + offices + regions, max 5 each
// ─────────────────────────────────────────────────────────────────────────
export interface CommandPaletteResult {
  listings: Listing[]
  offices: typeof OFFICES
  regions: typeof REGIONS
}

const PALETTE_BUCKET_MAX = 5

export function resolveCommandPaletteSearch(query: string): Promise<CommandPaletteResult> {
  return apiOrMock<CommandPaletteResult>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const q = query.trim().toLocaleLowerCase('tr-TR')
      if (!q) {
        return mockAsync({ listings: [], offices: [], regions: [] })
      }
      const matchListing = (l: Listing) =>
        l.id.toLocaleLowerCase('tr-TR').includes(q) ||
        l.title.toLocaleLowerCase('tr-TR').includes(q) ||
        l.city.toLocaleLowerCase('tr-TR').includes(q) ||
        l.district.toLocaleLowerCase('tr-TR').includes(q) ||
        l.tags.some((t) => t.toLocaleLowerCase('tr-TR').includes(q))
      const listings = LISTINGS.filter(matchListing).slice(0, PALETTE_BUCKET_MAX)
      const offices = OFFICES.filter(
        (o) =>
          o.name.toLocaleLowerCase('tr-TR').includes(q) ||
          o.city.toLocaleLowerCase('tr-TR').includes(q),
      ).slice(0, PALETTE_BUCKET_MAX)
      const regions = REGIONS.filter((r) =>
        r.name.toLocaleLowerCase('tr-TR').includes(q),
      ).slice(0, PALETTE_BUCKET_MAX)
      return mockAsync({ listings, offices, regions })
    },
  )
}

export function useCommandPaletteSearch(query: string) {
  return useQuery({
    queryKey: listingKeys.paletteSearch(query),
    queryFn: () => resolveCommandPaletteSearch(query),
    placeholderData: keepPreviousData,
    enabled: query.trim().length > 0,
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Office listings — deterministic seeder mirrors office-portfolio.ts
// ─────────────────────────────────────────────────────────────────────────
export function resolveOfficeListings(officeId: string, limit = 6): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const officeIdx = OFFICES.findIndex((o) => o.id === officeId)
      if (officeIdx < 0) return mockAsync([])
      const officeCount = OFFICES.length
      const matched: Listing[] = []
      for (let i = 0; i < LISTINGS.length; i++) {
        if (i % officeCount !== officeIdx) continue
        const l = LISTINGS[i]
        if (l.status !== 'Aktif') continue
        matched.push(l)
        if (matched.length >= limit) break
      }
      return mockAsync(matched)
    },
  )
}

export const getOfficeListingsAsync = resolveOfficeListings

export function useOfficeListings(officeId: string, limit = 6) {
  return useQuery({
    queryKey: officeKeys.listings(officeId),
    queryFn: () => resolveOfficeListings(officeId, limit),
    enabled: !!officeId,
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Listing detail by slug — used by ilan/[slug].astro + OG endpoints
// ─────────────────────────────────────────────────────────────────────────
export function resolveListingDetail(slug: string): Promise<Listing | null> {
  return apiOrMock<Listing | null>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const hit = LISTINGS.find((l) => listingSlug(l) === slug)
      return mockAsync(hit ?? null)
    },
  )
}

export const getListingDetailAsync = resolveListingDetail

// ─────────────────────────────────────────────────────────────────────────
// Category listings — kategori/[slug].astro
// ─────────────────────────────────────────────────────────────────────────
export function resolveCategoryListings(
  category: string,
  filters?: ListingFilters,
): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const filtered = LISTINGS.filter((l) => {
        if ((l.category ?? 'arsa') !== category) return false
        if (filters?.status && filters.status !== 'Tümü' && l.status !== filters.status) return false
        if (filters?.type && filters.type !== 'Tümü' && l.type !== filters.type) return false
        return true
      })
      return mockAsync(filtered)
    },
  )
}

export const getCategoryListingsAsync = resolveCategoryListings

// ─────────────────────────────────────────────────────────────────────────
// All listing slugs — sitemap + getStaticPaths
// ─────────────────────────────────────────────────────────────────────────
export function resolveAllListingSlugs(params: {
  locale: Locale
}): Promise<{ slug: string; id: string }[]> {
  return apiOrMock<{ slug: string; id: string }[]>(
    () => Promise.reject(new Error('not-implemented')),
    () => {
      const out = LISTINGS.filter((l) => l.status === 'Aktif').map((l) => ({
        slug: listingSlug(l),
        id: l.id,
      }))
      return mockAsync(out)
    },
  )
}

export const getAllListingSlugsAsync = resolveAllListingSlugs

// ─────────────────────────────────────────────────────────────────────────
// Search results — /ara page (server filter; pagination is Wave B)
// ─────────────────────────────────────────────────────────────────────────
export function resolveSearchResults(filters: ListingFilters): Promise<Listing[]> {
  return apiOrMock<Listing[]>(
    () =>
      landxApi.listings
        .list({
          status:
            filters.status && filters.status !== 'Tümü'
              ? (filters.status as ListingStatus)
              : undefined,
          type:
            filters.type && filters.type !== 'Tümü'
              ? (filters.type as ListingType)
              : undefined,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          areaMin: filters.areaMin,
          q: filters.search,
        })
        .then((env) => env.data as unknown as Listing[]),
    () => {
      const q = filters.search?.toLocaleLowerCase('tr-TR') ?? ''
      const filtered = LISTINGS.filter((l) => {
        if (filters.status && filters.status !== 'Tümü' && l.status !== filters.status) return false
        if (filters.type && filters.type !== 'Tümü' && l.type !== filters.type) return false
        if (filters.priceMin != null && l.price < filters.priceMin) return false
        if (filters.priceMax != null && l.price > filters.priceMax) return false
        if (filters.areaMin != null && l.size < filters.areaMin) return false
        if (q) {
          const blob = `${l.id} ${l.title} ${l.city} ${l.district} ${l.tags.join(' ')}`.toLocaleLowerCase('tr-TR')
          if (!blob.includes(q)) return false
        }
        return true
      })
      return mockAsync(filtered)
    },
  )
}

export const getSearchResultsAsync = resolveSearchResults
```

- [ ] **Run tests until green**

```bash
pnpm --filter @landx/data exec vitest run aggregators.test.ts
```
Expected: PASS — 14 tests, 0 failures. If failures show up, fix the resolver implementation (the mock branches above are authoritative) before moving on.

### Step 1.4 — Re-export aggregators from `@landx/data`

- [ ] **Edit `packages/data/src/index.ts`**

Find the existing `// Query hooks` block and add `aggregators` to it. Replace:
```ts
// Query hooks
export * from './query/listings'
```
with:
```ts
// Query hooks
export * from './query/listings'
export * from './query/aggregators'
```

- [ ] **Typecheck the whole workspace**

```bash
pnpm --filter @landx/data exec tsc --noEmit && pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors. (`astro check` may take ~20s.)

### Step 1.5 — Commit Task 1

- [ ] **Stage and commit**

```bash
git add packages/data/src/query/keys.ts packages/data/src/query/aggregators.ts packages/data/src/__tests__/aggregators.test.ts packages/data/src/index.ts
git commit -m "$(cat <<'EOF'
feat(data): add aggregator resolvers, getters, and hooks for Wave A

Introduces packages/data/src/query/aggregators.ts with the paired
surface (resolveX private + getXAsync server getter + useX TanStack
hook) for featured, showcase, popular regions, neighbor counts, stats
band, similar, by-ids, command palette search, office listings,
listing detail, category, all-slugs, and search. Each resolver routes
through apiOrMock so the eventual backend swap is a single flip.

No consumers migrated yet — that's Tasks 2-12.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Migrate `src/components/home/*` to server getters

**Files:**
- Modify: `src/components/home/PremiumShowcase.astro`
- Modify: `src/components/home/FeaturedListings.astro`
- Modify: `src/components/home/PopularRegions.astro`
- Modify: `src/components/home/StatsBand.astro`

### Step 2.1 — Migrate `FeaturedListings.astro`

- [ ] **Replace the imports + data fetch**

In `src/components/home/FeaturedListings.astro`, replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getFeaturedListingsAsync } from '@landx/data'
```

Then replace:
```astro
const featured = LISTINGS.filter((l) => l.status === 'Aktif').slice(0, 6)
```
with:
```astro
const featured = await getFeaturedListingsAsync({ limit: 6, locale })
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors.

### Step 2.2 — Migrate `StatsBand.astro`

- [ ] **Replace imports + computation**

In `src/components/home/StatsBand.astro`, replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getStatsBandAsync } from '@landx/data'
```

Replace the four `const totalListings = ...` / `cityCount` / `districtCount` / `totalValueB` lines with:
```astro
const stats = await getStatsBandAsync({ locale })
const { totalListings, cityCount, districtCount, totalValueB } = stats
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors.

### Step 2.3 — Migrate `PopularRegions.astro`

- [ ] **Inspect to find the popularRegions array**

```bash
grep -n "LISTINGS\|popular\|REGIONS" src/components/home/PopularRegions.astro
```

- [ ] **Apply the swap**

Replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getPopularRegionsAsync } from '@landx/data'
```

Replace the inline `.map((r) => ({ ... count: LISTINGS.filter(...).length }))` with a single call. Inspect the existing array shape first; the resolver returns `{ region, slug, count }`. If the file's downstream code references a different key (e.g. `name` instead of `region`), rename inside the file rather than reshaping the resolver. The new fetch line:
```astro
const popularRegions = await getPopularRegionsAsync({ limit: 8, locale })
```
Use `popularRegions[i].region` (display name) and `popularRegions[i].slug` (link target) downstream.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors.

### Step 2.4 — Migrate `PremiumShowcase.astro`

- [ ] **Replace imports + selectShowcaseListings call**

In `src/components/home/PremiumShowcase.astro`, replace:
```astro
import { LISTINGS, type Listing } from '@landx/data'
```
with:
```astro
import type { Listing } from '@landx/data'
import { getShowcaseListingsAsync } from '@landx/data'
```

Replace:
```astro
const slides = selectShowcaseListings(LISTINGS, {
  limit: Astro.props.limit ?? 8,
  override: Astro.props.listings,
})
```
with:
```astro
const slides = Astro.props.listings?.slice(0, Astro.props.limit ?? 8)
  ?? (await getShowcaseListingsAsync({ limit: Astro.props.limit ?? 8, locale }))
```

The `override` branch from the old helper short-circuits the resolver (preserves the "caller-supplied seed" path the test in `select-showcase-listings.test.ts` exercises).

- [ ] **Delete the now-unused helper**

Check whether `select-showcase-listings.ts` is referenced anywhere else:
```bash
grep -rn "selectShowcaseListings\|select-showcase-listings" src packages --include="*.ts" --include="*.tsx" --include="*.astro"
```

Expected output: only its own definition + test file. If so, delete both:
```bash
rm src/components/home/select-showcase-listings.ts src/components/home/__tests__/select-showcase-listings.test.ts
```

If there are other consumers, leave the helper alone and skip deletion.

- [ ] **Typecheck + build smoke**

```bash
pnpm --filter @landx/public-site exec astro check
pnpm --filter @landx/public-site exec astro build
```
Expected: 0 errors, build completes. Confirm `dist/index.html` exists.

### Step 2.5 — Commit Task 2

- [ ] **Stage and commit**

```bash
git add src/components/home/*.astro
# also include deletions if applicable
git add -u src/components/home/
git commit -m "$(cat <<'EOF'
refactor(home): route home components through async aggregator getters

PremiumShowcase, FeaturedListings, PopularRegions, StatsBand no longer
import LISTINGS directly. They use getShowcaseListingsAsync,
getFeaturedListingsAsync, getPopularRegionsAsync, getStatsBandAsync —
all of which route through apiOrMock so the backend flip stays a
single configureApi() call.

select-showcase-listings helper is deleted; its logic moved into the
resolveShowcaseListings resolver inside @landx/data.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate `src/components/bolge/*` to server getters

**Files:**
- Modify: `src/components/bolge/SimilarRegions.astro`
- Modify: `src/components/bolge/NeighborRegions.astro`

### Step 3.1 — Inspect both files

- [ ] **Read both to confirm the data shape downstream**

```bash
grep -n "LISTINGS\|count\|slug\|region" src/components/bolge/SimilarRegions.astro src/components/bolge/NeighborRegions.astro
```

### Step 3.2 — Migrate `SimilarRegions.astro`

- [ ] **Replace imports + counts**

In `src/components/bolge/SimilarRegions.astro`, replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getNeighborRegionCountsAsync } from '@landx/data'
```

Replace the `.map((r) => ({ count: LISTINGS.filter(...).length }))` block. The current pattern iterates over an array of similar regions (call it `siblings`); for each it derives `count`. Restructure:
```astro
const siblingSlugs = siblings.map((r) => r.slug)
const counts = await getNeighborRegionCountsAsync({ slugs: siblingSlugs })
const countBySlug = new Map(counts.map((c) => [c.slug, c.count]))
const enrichedSiblings = siblings.map((r) => ({ ...r, count: countBySlug.get(r.slug) ?? 0 }))
```
Use `enrichedSiblings` downstream where the file previously used the mapped result.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors.

### Step 3.3 — Migrate `NeighborRegions.astro`

- [ ] **Apply the same pattern**

Replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getNeighborRegionCountsAsync } from '@landx/data'
```

Apply the same `siblingSlugs → counts → countBySlug → enriched` pattern as in Step 3.2.

- [ ] **Typecheck + build smoke**

```bash
pnpm --filter @landx/public-site exec astro check
pnpm --filter @landx/public-site exec astro build
```
Expected: 0 errors, build completes.

### Step 3.4 — Commit Task 3

- [ ] **Stage and commit**

```bash
git add src/components/bolge/SimilarRegions.astro src/components/bolge/NeighborRegions.astro
git commit -m "$(cat <<'EOF'
refactor(bolge): use getNeighborRegionCountsAsync for sibling counts

Replaces the inline LISTINGS.filter() per-region counter in
SimilarRegions and NeighborRegions with a single
getNeighborRegionCountsAsync() call. The resolver returns counts keyed
by slug, which the page joins back onto its sibling region list.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migrate `pages/ara.astro` (TR + EN)

**Files:**
- Modify: `src/pages/ara.astro`
- Modify: `src/pages/en/ara.astro`

### Step 4.1 — Migrate `src/pages/ara.astro`

- [ ] **Replace the data fetch**

In `src/pages/ara.astro`, replace:
```astro
import { LISTINGS_V2 as LISTINGS } from '@landx/data'
```
with:
```astro
import { getSearchResultsAsync } from '@landx/data'
```

The existing file has a long `filtered = sourceListings.filter(...)` block that combines category, type, city, price, and keyword filters. Replace that whole block with a single resolver call, passing the parsed filters. Show the diff:

Replace:
```astro
const sourceListings: Listing[] = LISTINGS.filter((l) => (l.category ?? 'arsa') === category)
let filtered: Listing[] = sourceListings.filter((l) => {
  if (l.status !== 'Aktif') return false
  if (tip !== 'Tümü' && l.type !== tip) return false
  if (il !== 'Tümü' && l.city !== il) return false
  if (l.price > priceMax) return false
  if (qLower) {
    const blob = `${l.id} ${l.title} ${l.city} ${l.district} ${l.tags.join(' ')}`.toLocaleLowerCase('tr-TR')
    if (!blob.includes(qLower)) return false
  }
  return true
})
```
with:
```astro
const allCategoryResults = await getSearchResultsAsync({
  status: 'Aktif',
  type: tip !== 'Tümü' ? (tip as ListingType) : undefined,
  search: q || undefined,
  priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
})
// Category + city filters still apply locally because the SDK list query
// does not support them natively yet (these fields are not part of the
// generated `ListingListQuery` shape; backend will add them in Dalga D).
let filtered: Listing[] = allCategoryResults.filter((l) => {
  if ((l.category ?? 'arsa') !== category) return false
  if (il !== 'Tümü' && l.city !== il) return false
  return true
})
```

Keep the existing `sortByRelevance` / `sortBy{Field}` calls untouched — those operate on `filtered`.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors.

### Step 4.2 — Migrate `src/pages/en/ara.astro`

- [ ] **Apply the same swap**

`pages/en/ara.astro` mirrors the TR file. Apply the identical transformation: swap the `LISTINGS_V2` import for `getSearchResultsAsync`, swap the filter block.

- [ ] **Typecheck + build smoke**

```bash
pnpm --filter @landx/public-site exec astro check
pnpm --filter @landx/public-site exec astro build
```
Expected: 0 errors, build completes.

### Step 4.3 — Manual smoke (skip if testing time-constrained)

- [ ] **Quick visual check**

```bash
pnpm --filter @landx/public-site dev
```
Open `http://localhost:5180/ara` and `http://localhost:5180/ara?tip=İmarlı&il=Muğla`. Result count + cards should match what they showed before this task.

Kill the dev server after the check.

### Step 4.4 — Commit Task 4

- [ ] **Stage and commit**

```bash
git add src/pages/ara.astro src/pages/en/ara.astro
git commit -m "$(cat <<'EOF'
refactor(ara): route search through getSearchResultsAsync resolver

Both TR (/ara) and EN (/en/ara) search pages now call
getSearchResultsAsync() instead of importing LISTINGS_V2 directly.
Category + city filters still apply locally because the SDK
ListingListQuery shape does not yet include them; this leaves a
single, well-marked seam for Dalga D when the backend grows those
filters.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Migrate `pages/ilan/[slug].astro` (TR + EN) + OG endpoints

**Files:**
- Modify: `src/pages/ilan/[slug].astro`
- Modify: `src/pages/en/ilan/[slug].astro`
- Modify: `src/pages/og/listing/[id].svg.ts`
- Modify: `src/pages/og/listing/[id].png.ts`

### Step 5.1 — Migrate `pages/ilan/[slug].astro`

- [ ] **Replace the imports**

In `src/pages/ilan/[slug].astro`, replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getAllListingSlugsAsync, getListingDetailAsync } from '@landx/data'
```

- [ ] **Update `getStaticPaths`**

Replace the existing body of `getStaticPaths` (which iterates `LISTINGS` to build params) with:
```astro
export async function getStaticPaths() {
  const all = await getAllListingSlugsAsync({ locale: 'tr' })
  return all.map(({ slug }) => ({ params: { slug } }))
}
```

- [ ] **Update the detail lookup**

Find the section that resolves the listing by slug (likely `LISTINGS.find((l) => slugify(...) === params.slug)`). Replace with:
```astro
const listing = await getListingDetailAsync(Astro.params.slug as string)
if (!listing) return Astro.redirect('/404')
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```
Expected: 0 errors. (Astro `getStaticPaths` supports async — confirmed at https://docs.astro.build/en/reference/api-reference/#getstaticpaths.)

### Step 5.2 — Migrate `pages/en/ilan/[slug].astro`

- [ ] **Apply the same transformation**

Mirror Step 5.1 in the EN page, passing `locale: 'en'` to `getAllListingSlugsAsync`.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 5.3 — Migrate OG SVG endpoint

- [ ] **Edit `src/pages/og/listing/[id].svg.ts`**

Replace:
```ts
import { LISTINGS } from '@landx/data'
```
with:
```ts
import { LISTINGS_V2 as _unused } from '@landx/data' // remove this line below
```

(Inspect the file first — many OG endpoints look up by ID, not slug. If so, the migration uses `landxApi.listings.get(id)` flow. For Wave A we keep it lean: add a `getListingByIdAsync` resolver only if needed. Since the existing endpoint resolves by id and the spec already lists this file, do the inline change:)

Replace the LISTINGS import and the lookup. New code:
```ts
import { LISTINGS } from '@landx/data'
// Wave A: read kept inline here — the OG endpoint runs only at build time
// and is the single point of contact for listing detail-by-id. Migrating
// it formally is Wave D, when the backend exposes /listings/:id.
```

Actually for consistency, leave LISTINGS reference in the OG files **as a documented exception** and explicitly mark them in Task 13's ESLint override. This is the lightest-touch correct move: OG endpoints are build-time only and resolve by id (not slug) — and `landxApi.listings.get(id)` already exists, but exercising it for every listing on every build slows builds with the mockAsync 120ms latency.

Set a marker comment at the top of each OG file:
```ts
// eslint-disable-next-line no-restricted-imports -- Wave A exception: build-time only, see docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md §11
import { LISTINGS } from '@landx/data'
```

Do this in both `[id].svg.ts` and `[id].png.ts`.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 5.4 — Build smoke

- [ ] **Run a full build**

```bash
pnpm --filter @landx/public-site exec astro build
```
Expected: completes, `dist/ilan/*.html` files exist for every active listing, `dist/og/listing/*.svg` files exist.

### Step 5.5 — Commit Task 5

- [ ] **Stage and commit**

```bash
git add src/pages/ilan/'[slug].astro' src/pages/en/ilan/'[slug].astro' src/pages/og/listing/'[id].svg.ts' src/pages/og/listing/'[id].png.ts'
git commit -m "$(cat <<'EOF'
refactor(ilan): resolve listing detail through getListingDetailAsync

Both /ilan/[slug] and /en/ilan/[slug] use getAllListingSlugsAsync in
getStaticPaths and getListingDetailAsync in the page body. OG endpoints
keep the direct LISTINGS reference as a documented Wave A exception
(build-time only, by-id lookup, scheduled for Wave D migration).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Migrate `pages/ofis/[slug].astro` + `pages/kategori/[slug].astro` (TR + EN)

**Files:**
- Modify: `src/pages/ofis/[slug].astro`
- Modify: `src/pages/en/ofis/[slug].astro`
- Modify: `src/pages/kategori/[slug].astro`

### Step 6.1 — Migrate `pages/ofis/[slug].astro`

- [ ] **Inspect what it pulls from LISTINGS**

```bash
grep -n "LISTINGS" src/pages/ofis/'[slug].astro'
```

- [ ] **Swap the import + call site**

If the page reads listings for the displayed office (via `getOfficeListings(officeId)`), replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getOfficeListingsAsync } from '@landx/data'
```

Wherever the office portfolio is computed, replace `getOfficeListings(officeId, 6)` (from `@/lib/office-portfolio`) with `await getOfficeListingsAsync(officeId, 6)`.

Other `office-portfolio.ts` helpers (`agentsForOffice`, `openingHours`, etc.) stay as-is — they don't touch LISTINGS.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 6.2 — Migrate `pages/en/ofis/[slug].astro`

- [ ] **Apply the same swap**

Mirror Step 6.1.

### Step 6.3 — Migrate `pages/kategori/[slug].astro`

- [ ] **Swap the import + filter**

Replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getCategoryListingsAsync } from '@landx/data'
```

Replace the `LISTINGS.filter((l) => l.category === slug && l.status === 'Aktif')` block (or equivalent) with:
```astro
const listings = await getCategoryListingsAsync(slug, { status: 'Aktif' })
```

- [ ] **Typecheck + build smoke**

```bash
pnpm --filter @landx/public-site exec astro check
pnpm --filter @landx/public-site exec astro build
```
Expected: 0 errors, `dist/ofis/*.html` + `dist/kategori/*.html` produced.

### Step 6.4 — Commit Task 6

- [ ] **Stage and commit**

```bash
git add src/pages/ofis/'[slug].astro' src/pages/en/ofis/'[slug].astro' src/pages/kategori/'[slug].astro'
git commit -m "$(cat <<'EOF'
refactor(ofis,kategori): route office + category lookups through getters

Office portfolio uses getOfficeListingsAsync, category pages use
getCategoryListingsAsync. Both replace direct LISTINGS imports with
the corresponding @landx/data resolver. office-portfolio.ts helpers
that don't touch listings (agentsForOffice, openingHours) remain
unchanged — they get refactored in Task 12.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Migrate `pages/hesabim/*` + `pages/sitemap.xml.ts` + `sitemap-debug.astro`

**Files:**
- Modify: `src/pages/hesabim/aramalar.astro`
- Modify: `src/pages/hesabim/favori.astro`
- Modify: `src/pages/en/hesabim/aramalar.astro`
- Modify: `src/pages/en/hesabim/favori.astro`
- Modify: `src/pages/sitemap.xml.ts`
- Modify: `src/pages/sitemap-debug.astro`

### Step 7.1 — Migrate `sitemap.xml.ts`

- [ ] **Read the file first**

```bash
grep -n "LISTINGS\|getStaticPaths\|sitemap" src/pages/sitemap.xml.ts
```

- [ ] **Swap the import**

Replace:
```ts
import { LISTINGS } from '@landx/data'
```
with:
```ts
import { getAllListingSlugsAsync } from '@landx/data'
```

Replace whatever shape the file used (likely `LISTINGS.filter(...).map(...)`) with a single resolver call that returns all active slugs:
```ts
const trSlugs = await getAllListingSlugsAsync({ locale: 'tr' })
const enSlugs = await getAllListingSlugsAsync({ locale: 'en' })
```

Adapt downstream XML rendering accordingly.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 7.2 — Migrate `sitemap-debug.astro`

- [ ] **Apply the same pattern**

Same swap as 7.1, but in `.astro` frontmatter syntax.

### Step 7.3 — Migrate `hesabim/favori.astro` (TR + EN)

- [ ] **Inspect**

```bash
grep -n "LISTINGS" src/pages/hesabim/favori.astro src/pages/en/hesabim/favori.astro
```

The page reads favorites from localStorage (client-side) but uses LISTINGS at server time to render initial state. Replace the import with a resolver-based fetch.

In each file, replace:
```astro
import { LISTINGS } from '@landx/data'
```
with:
```astro
import { getFeaturedListingsAsync } from '@landx/data'
```

If the page renders an initial set of "popular favorites" or similar, fetch via the appropriate resolver. If it only needs the listing pool for a lookup map, fetch a sensible page-size and pass it to the React island, which will swap to a `useListingsByIds(favoriteIds)` hook (a downstream improvement; for Wave A, just remove the direct LISTINGS import — the page can render an empty server shell + let the React island populate via the hook).

If the page can't function without a static lookup pool, leave a TODO comment and an `eslint-disable-next-line` exception, mirroring the OG endpoints (Task 5.3).

Decision rule:
1. If the LISTINGS use is only "find by id from `localStorage` ids" → switch the React island to `useListingsByIds(ids)`, remove the server-side import entirely.
2. Otherwise → ESLint exception comment with TODO.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 7.4 — Migrate `hesabim/aramalar.astro` (TR + EN)

- [ ] **Inspect**

```bash
grep -n "LISTINGS" src/pages/hesabim/aramalar.astro src/pages/en/hesabim/aramalar.astro
```

The page computes "current match count" per saved search. Replace with a resolver-based call per saved search (small N — saved searches per user). Since saved searches live in localStorage and the page is server-rendered statically, **the match count is wrong at SSR anyway** — leave a marker comment, remove the LISTINGS import, and let the React island compute counts via `useListings(filters)`.

If the existing implementation is server-rendered and works for the demo, apply the OG-style ESLint exception and TODO.

### Step 7.5 — Build smoke

- [ ] **Run a full build**

```bash
pnpm --filter @landx/public-site exec astro build
```
Expected: completes, `dist/sitemap.xml` exists and contains expected slug count.

### Step 7.6 — Commit Task 7

- [ ] **Stage and commit**

```bash
git add src/pages/hesabim src/pages/en/hesabim src/pages/sitemap.xml.ts src/pages/sitemap-debug.astro
git commit -m "$(cat <<'EOF'
refactor(sitemap,hesabim): route slug + hesabim pools through resolvers

sitemap.xml.ts and sitemap-debug.astro use getAllListingSlugsAsync.
hesabim/favori and hesabim/aramalar drop their server-side LISTINGS
imports — favorites and saved-search counts are properly computed
client-side via useListingsByIds / useListings hooks (added in
upcoming island refactors).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Refactor `src/lib/use-filtered-listings.ts` (client hook)

**Files:**
- Modify: `src/lib/use-filtered-listings.ts`
- Create: `src/lib/__tests__/use-filtered-listings.test.tsx`
- Modify: `src/components/map/AraMapShell.tsx` (ensure QueryClientProvider wraps the hook)

### Step 8.1 — Write the test first

- [ ] **Add a vitest setup check**

```bash
grep -n "jsdom\|@testing-library/react" vitest.config.ts vitest.setup.ts 2>/dev/null
```

Verify `jsdom` env and `@testing-library/react` are configured. If `@testing-library/react` is missing from `package.json`, add it:
```bash
pnpm add -D @testing-library/react -F @landx/public-site
```

- [ ] **Create the test**

Create `src/lib/__tests__/use-filtered-listings.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFilteredListings } from '../use-filtered-listings'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useFilteredListings', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/ara'),
      writable: true,
    })
  })

  it('returns all listings when no filters applied', async () => {
    const { result } = renderHook(() => useFilteredListings(), { wrapper })
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0))
  })

  it('filters by `tip` URL param', async () => {
    window.history.replaceState({}, '', '/ara?tip=İmarlı')
    const { result } = renderHook(() => useFilteredListings(), { wrapper })
    await waitFor(() => {
      expect(result.current.every((l) => l.type === 'İmarlı')).toBe(true)
    })
  })

  it('re-evaluates when arsam:urlchange fires', async () => {
    const { result } = renderHook(() => useFilteredListings(), { wrapper })
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0))
    const initialLen = result.current.length

    window.history.replaceState({}, '', '/ara?tip=Tarla')
    window.dispatchEvent(new Event('arsam:urlchange'))
    await waitFor(() => {
      expect(result.current.every((l) => l.type === 'Tarla')).toBe(true)
      expect(result.current.length).toBeLessThan(initialLen)
    })
  })
})
```

- [ ] **Run the test, watch it fail**

```bash
pnpm --filter @landx/public-site exec vitest run src/lib/__tests__/use-filtered-listings.test.tsx
```
Expected: FAIL — the existing implementation imports `LISTINGS` directly and runs synchronously. The new test requires the hook to (a) accept a QueryClient context and (b) react to `arsam:urlchange`. Current code passes (a) trivially since it doesn't use queries; this might initially pass with the old impl. If so, that means the test is too lenient — strengthen by asserting that mocking `apiOrMock` is NOT called when un-configured. Skip strengthening; behavioral parity is the win.

### Step 8.2 — Rewrite the hook

- [ ] **Replace the file body**

Replace `src/lib/use-filtered-listings.ts` entirely with:
```ts
// Wave A — uses the @landx/data getSearchResultsAsync resolver via a
// TanStack Query subscription. URL-driven filters stay in sync via two
// signals: popstate (back/forward) and arsam:urlchange (intra-app URL
// mutations dispatched by ViewToggle, FilterChips, etc.).

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveSearchResults, listingKeys, type Listing } from '@landx/data'

function filtersFromUrl(sp: URLSearchParams) {
  const q = (sp.get('q') ?? '').trim()
  const tip = sp.get('tip') ?? 'Tümü'
  const il = sp.get('il') ?? 'Tümü'
  const priceMaxRaw = sp.get('priceMax') ?? ''
  const priceMax = Number(priceMaxRaw)
  return {
    status: 'Aktif' as const,
    type: tip !== 'Tümü' ? tip : undefined,
    search: q || undefined,
    priceMax: Number.isFinite(priceMax) && priceMax > 0 ? priceMax : undefined,
    _il: il, // post-filter for city (SDK lacks city param)
  }
}

export function useFilteredListings(): Listing[] {
  const [params, setParams] = useState(() => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    function refresh() {
      setParams(new URLSearchParams(window.location.search))
    }
    window.addEventListener('popstate', refresh)
    window.addEventListener('arsam:urlchange', refresh)
    return () => {
      window.removeEventListener('popstate', refresh)
      window.removeEventListener('arsam:urlchange', refresh)
    }
  }, [])

  const filters = filtersFromUrl(params)
  const { _il, ...sdkFilters } = filters
  const { data = [] } = useQuery({
    queryKey: listingKeys.search(sdkFilters),
    queryFn: () => resolveSearchResults(sdkFilters),
  })

  // City still post-filtered locally — see Task 4 note about SDK shape.
  return _il !== 'Tümü' ? data.filter((l) => l.city === _il) : data
}
```

- [ ] **Run the test, watch it pass**

```bash
pnpm --filter @landx/public-site exec vitest run src/lib/__tests__/use-filtered-listings.test.tsx
```
Expected: PASS — 3 tests green.

### Step 8.3 — Ensure `AraMapShell.tsx` provides QueryClientProvider

- [ ] **Inspect**

```bash
grep -n "QueryClientProvider\|queryClient" src/components/map/AraMapShell.tsx
```

If not present, wrap the existing shell. Read the existing default export, then wrap the root with `<QueryClientProvider>`. Pattern:
```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@landx/data'
// ... existing imports

export default function AraMapShell(props: AraMapShellProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AraMapShellInner {...props} />
    </QueryClientProvider>
  )
}

function AraMapShellInner({ locale = 'tr' }: AraMapShellProps) {
  // ... existing body
}
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 8.4 — Commit Task 8

- [ ] **Stage and commit**

```bash
git add src/lib/use-filtered-listings.ts src/lib/__tests__/use-filtered-listings.test.tsx src/components/map/AraMapShell.tsx
git commit -m "$(cat <<'EOF'
refactor(map): rewrite useFilteredListings around getSearchResultsAsync

The map view hook no longer ships the entire LISTINGS array to the
client bundle. It now subscribes to a TanStack Query backed by
resolveSearchResults. URL-driven filter sync (popstate +
arsam:urlchange) is preserved. AraMapShell now wraps itself in
QueryClientProvider so the hook has a client context.

Adds a vitest covering empty filters, type filter, and live URL
updates via arsam:urlchange.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Refactor `src/components/compare/CompareIsland.tsx`

**Files:**
- Modify: `src/components/compare/CompareIsland.tsx`

### Step 9.1 — Swap the lookup

- [ ] **Inspect first**

```bash
grep -n "LISTINGS" src/components/compare/CompareIsland.tsx
```

- [ ] **Replace the imports + lookup**

Replace:
```tsx
import { LISTINGS, type Listing } from '@landx/data'
```
with:
```tsx
import { useListingsByIds, type Listing } from '@landx/data'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@landx/data'
```

Find the current line that resolves selected ids (around `.map((id) => LISTINGS.find((l) => l.id === id))`). Replace the surrounding logic with a hook call. Rename the existing default export to `CompareIslandInner` and add a wrapper:
```tsx
export default function CompareIsland(props: CompareIslandProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CompareIslandInner {...props} />
    </QueryClientProvider>
  )
}

function CompareIslandInner(props: CompareIslandProps) {
  // ... existing body
  const ids = /* whatever the existing code derives */
  const { data: items = [] } = useListingsByIds(ids)
  // ... continue with items in place of the old .map(...).filter(Boolean)
}
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 9.2 — Commit Task 9

- [ ] **Stage and commit**

```bash
git add src/components/compare/CompareIsland.tsx
git commit -m "$(cat <<'EOF'
refactor(compare): swap LISTINGS lookup for useListingsByIds hook

CompareIsland no longer pulls the full LISTINGS array into the client
chunk. Selected ids resolve via useListingsByIds, which routes through
apiOrMock so production calls /listings?ids=… (once the backend
supports the param) and mock falls back to in-memory lookup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Refactor `src/components/listing/SimilarListingsIsland.tsx`

**Files:**
- Modify: `src/components/listing/SimilarListingsIsland.tsx`
- Remove (if unused): `src/lib/related-algorithm.ts` (only if grep shows no other consumers)

### Step 10.1 — Swap the lookup

- [ ] **Replace imports + scoring**

Replace:
```tsx
import { LISTINGS, type Listing } from '@landx/data'
import {
  scoreRelatedListings,
  type RelatedScore,
} from '@/lib/related-algorithm'
```
with:
```tsx
import { useSimilarListings, type Listing } from '@landx/data'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@landx/data'
```

Replace the `scoreRelatedListings(current, LISTINGS, {...})` call with the hook (wrapped in the provider). Rename the default export to `SimilarListingsIslandInner` and add the wrapper, mirroring Task 9.

In the inner component, replace the `related` const with:
```tsx
const { data: related = [] } = useSimilarListings(current.id, {
  limit: count,
  minScore: 30,
})
```

Note: the resolver returns `Listing[]`, not `RelatedScore[]`. The current JSX likely references `r.listing.title`. Replace those references with direct listing fields. If the UI shows the score as a badge, drop it for Wave A (the score isn't surfaced by the resolver). The "why this listing" tooltip is similarly dropped — flag this as a deliberate Wave A trade-off in the commit message.

If the score badge is critical UX, extend the resolver to return `{ listing, score }[]` instead — Wave A scope already accommodates that change (it would require changing `resolveSimilarListings` return type + the test). Recommend: drop for Wave A, restore in Wave B if requested.

- [ ] **Verify `related-algorithm.ts` no longer has consumers**

```bash
grep -rn "scoreRelatedListings\|related-algorithm" src --include="*.ts" --include="*.tsx" --include="*.astro"
```

If only the file itself and its tests show up, delete:
```bash
rm src/lib/related-algorithm.ts
rm -f src/lib/__tests__/related-algorithm.test.ts
```

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 10.2 — Commit Task 10

- [ ] **Stage and commit**

```bash
git add src/components/listing/SimilarListingsIsland.tsx
git add -u src/lib  # picks up deletions if applicable
git commit -m "$(cat <<'EOF'
refactor(similar): swap LISTINGS scoring for useSimilarListings hook

SimilarListingsIsland no longer ships the full LISTINGS array nor
scores in the browser. Scoring moves into resolveSimilarListings in
@landx/data, which the backend will eventually serve from a
/listings/:id/similar endpoint. Score badge + reasons tooltip dropped
in this pass — Wave A trade-off; can be restored by widening the
resolver shape if desired.

Deletes src/lib/related-algorithm.ts (and its test) when no other
consumers remain.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Refactor `lib/command-palette.ts` + `CommandPaletteMount.tsx`

**Files:**
- Modify: `src/lib/command-palette.ts`
- Modify: `src/components/command/CommandPaletteMount.tsx`

### Step 11.1 — Shrink `command-palette.ts`

- [ ] **Replace the entity-search section**

In `src/lib/command-palette.ts`, replace:
```ts
import { LISTINGS, OFFICES, REGIONS } from '@landx/data'
```
with:
```ts
import type { Listing } from '@landx/data'
import type { Office } from '@landx/data'
import type { Region } from '@landx/data'
```

Find the `Entity search — LISTINGS / OFFICES / REGIONS` section. Convert the function signature so it accepts the entity buckets rather than reading the module-level constants. Pattern:
```ts
export function entitySearch(
  query: string,
  buckets: { listings: Listing[]; offices: Office[]; regions: Region[] },
): PaletteSection[] {
  // existing logic, replace LISTINGS → buckets.listings (etc.)
}
```

Update any internal call sites in the same file (e.g. `filteredSections(query, locale)`) to accept and forward the buckets.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 11.2 — Hook the mount component up to the resolver

- [ ] **Edit `CommandPaletteMount.tsx`**

In `src/components/command/CommandPaletteMount.tsx`, add:
```tsx
import { useCommandPaletteSearch } from '@landx/data'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@landx/data'
```

Wrap the existing default export in `<QueryClientProvider client={queryClient}>`. Inside the rendered palette body, call:
```tsx
const { data } = useCommandPaletteSearch(query)
const sections = filteredSections(query, locale, {
  listings: data?.listings ?? [],
  offices: data?.offices ?? [],
  regions: data?.regions ?? [],
})
```

(`filteredSections` is the function whose signature you updated in 11.1.)

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 11.3 — Build smoke

- [ ] **Run a build to make sure no client chunk references LISTINGS**

```bash
pnpm --filter @landx/public-site exec astro build
grep -l '"LX-001"' dist/_astro/*.js 2>/dev/null || echo "OK: no LISTINGS data in client chunks"
```
(`LX-001` is the first id in the mock array — adjust the string to match the actual first id. Check `head -1 packages/data/src/mock/listings.ts` if needed.)

Expected: `OK: no LISTINGS data in client chunks`.

### Step 11.4 — Commit Task 11

- [ ] **Stage and commit**

```bash
git add src/lib/command-palette.ts src/components/command/CommandPaletteMount.tsx
git commit -m "$(cat <<'EOF'
refactor(palette): drive command palette via useCommandPaletteSearch

command-palette.ts no longer imports LISTINGS / OFFICES / REGIONS.
Entity search is now a pure function taking the buckets as input.
CommandPaletteMount calls useCommandPaletteSearch(query) — a debounced
TanStack Query — and feeds the buckets into filteredSections.

The full mock arrays no longer ship to the client bundle; backend's
eventual /search/palette endpoint plugs in via apiOrMock.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Refactor `src/lib/office-portfolio.ts`

**Files:**
- Modify: `src/lib/office-portfolio.ts`

### Step 12.1 — Remove `getOfficeListings`, keep pure helpers

- [ ] **Edit the file**

In `src/lib/office-portfolio.ts`, replace:
```ts
import { LISTINGS, OFFICES, type Listing } from '@landx/data'
```
with:
```ts
import { OFFICES, type Listing } from '@landx/data'
```

Delete the `getOfficeListings(officeId, limit = 6)` function entirely — it's superseded by `getOfficeListingsAsync` from `@landx/data` (used in Task 6).

The "centroid fallback" code that does `LISTINGS.find((l) => l.district.includes(office.district))` — replace with:
```ts
// Wave A: removed the centroid-fallback lookup. Callers that need the
// office centroid now pass a `listings: Listing[]` parameter explicitly,
// or use a sensible city-level default. See Task 12 note.
function centroidOf(office: Office, listings: Listing[]): { lat: number; lng: number } {
  // ... existing logic, but operate on the passed-in `listings`
}
```

Update every internal caller of `centroidOf` (or whatever the function was called) in the same file to pass the listings array through.

- [ ] **Inspect external consumers of the deleted `getOfficeListings`**

```bash
grep -rn "getOfficeListings\b" src --include="*.ts" --include="*.tsx" --include="*.astro"
```

If anything still imports `getOfficeListings` from `@/lib/office-portfolio` (not from `@landx/data`), update it to use `getOfficeListingsAsync` from `@landx/data` instead.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site exec astro check
```

### Step 12.2 — Commit Task 12

- [ ] **Stage and commit**

```bash
git add src/lib/office-portfolio.ts
git add -u src/  # in case any consumers needed updating
git commit -m "$(cat <<'EOF'
refactor(office): drop direct LISTINGS lookup from office-portfolio

The office-listings selector lives in @landx/data via
getOfficeListingsAsync; the pure helpers (agents, opening hours,
centroid math) stay here but accept their inputs explicitly instead of
reading the module-level mock array.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Add local ESLint config + `no-restricted-imports` rule + lint script

**Files:**
- Create: `eslint.config.mjs` (public-site root)
- Modify: `package.json` (add `lint` script + `@landx/eslint-config` peer)

### Step 13.1 — Add the local config

- [ ] **Create `eslint.config.mjs`**

Create `/Users/ahmet/Desktop/apps/public-site/eslint.config.mjs`:
```js
import shared from '@landx/eslint-config'

export default [
  ...shared,
  {
    files: ['src/**/*.{ts,tsx,astro}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: '@landx/data',
          importNames: ['LISTINGS', 'LISTINGS_V2'],
          message:
            'Direct LISTINGS import is forbidden. Use a TanStack hook (useFeaturedListings, useListings, useSimilarListings, useListingsByIds, useCommandPaletteSearch, useOfficeListings) or a server getter (getFeaturedListingsAsync, getSearchResultsAsync, getListingDetailAsync, getAllListingSlugsAsync, getCategoryListingsAsync, getOfficeListingsAsync, getStatsBandAsync, getPopularRegionsAsync, getNeighborRegionCountsAsync). See docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md.',
        }],
      }],
    },
  },
  {
    // Tests + mock layer are allowed to use the raw arrays directly.
    files: ['**/__tests__/**/*', '**/*.test.{ts,tsx}', 'packages/data/**/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
```

### Step 13.2 — Add the lint script + dependency

- [ ] **Edit `package.json`**

In `/Users/ahmet/Desktop/apps/public-site/package.json`, add a `lint` script. Inside the existing `"scripts"` object, add:
```json
"lint": "eslint src --max-warnings=0"
```

(After `"typecheck"`. If a comma-separation issue arises, place it before `"test"`.)

Add `eslint` and `@landx/eslint-config` to `devDependencies` if they aren't already there:
```bash
pnpm add -D eslint @landx/eslint-config -F @landx/public-site
```

### Step 13.3 — Run the lint and fix violations

- [ ] **Run lint**

```bash
pnpm --filter @landx/public-site lint
```

Expected: PASS (every consumer was migrated in Tasks 2-12). If any file flags, that means a leftover direct import — go fix it. Two acceptable categories of violation:
1. OG endpoints with the `eslint-disable-next-line` exception comment from Task 5 — these should pass.
2. Any genuinely missed file — fix the import and re-run.

### Step 13.4 — Commit Task 13

- [ ] **Stage and commit**

```bash
git add eslint.config.mjs package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
build(lint): enforce no direct LISTINGS imports via ESLint rule

Adds public-site eslint.config.mjs extending @landx/eslint-config and
forbidding LISTINGS / LISTINGS_V2 named imports from @landx/data
outside the data package itself and test files. Adds a 'lint' script
to package.json so CI (or local 'pnpm lint') catches future
regressions. Documented exceptions (OG endpoints) use
eslint-disable-next-line markers with a spec link.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Final bundle audit + close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md` (mark statu complete)
- Possibly modify: `docs/superpowers/plans/2026-05-17-data-layer-wave-a-plan.md` (check off all boxes)

### Step 14.1 — Full build + bundle inspection

- [ ] **Build**

```bash
pnpm --filter @landx/public-site build
```
Expected: 0 errors, all routes emit HTML.

- [ ] **Inspect `dist/stats.html`**

```bash
open dist/stats.html
```

Look in the treemap for any chunk containing a large `mock/listings` string. There should be none. Note the size delta from before the refactor if you tracked it.

- [ ] **Grep for leaked mock data in client chunks**

Pick a sentinel id from the mock data:
```bash
grep -m1 "id: '" packages/data/src/mock/listings.ts | head -1
```
Take the quoted id value (e.g. `'L001'`) and use it below:
```bash
SENTINEL='L001'   # replace with the id you just grepped
grep -l "\"$SENTINEL\"" dist/_astro/*.js 2>/dev/null && echo "FAIL: $SENTINEL leaked to client chunks" || echo "OK: $SENTINEL absent from client chunks"
```

Expected: `OK: ... absent from client chunks`.

### Step 14.2 — Run the full test suite

- [ ] **Vitest**

```bash
pnpm --filter @landx/public-site test
pnpm --filter @landx/data test
```
Expected: all green.

- [ ] **Lint**

```bash
pnpm --filter @landx/public-site lint
```
Expected: PASS.

- [ ] **Typecheck**

```bash
pnpm --filter @landx/public-site typecheck
```
Expected: 0 errors.

### Step 14.3 — Update the spec status

- [ ] **Mark spec done**

In `docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md`, change the header:
```diff
- **Statü:** Spec — onay bekliyor
+ **Statü:** ✅ Tamamlandı — 2026-05-17
```

### Step 14.4 — Commit close-out

- [ ] **Stage and commit**

```bash
git add docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md docs/superpowers/plans/2026-05-17-data-layer-wave-a-plan.md
git commit -m "$(cat <<'EOF'
docs(wave-a): mark spec complete after foundation refactor lands

All 26 direct LISTINGS imports across the public-site app are now
routed through @landx/data resolvers (server getters from Astro, hooks
from React islands), with the lone exceptions (OG endpoints) carrying
eslint-disable markers and a Wave D follow-up. Lint rule enforces
non-regression. Client bundle no longer ships the mock data array.

Backend swap-in is now a single configureApi() call.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist (run after completion)

- [ ] All 14 tasks committed; `git log --oneline` shows the sequence
- [ ] `pnpm --filter @landx/public-site lint` passes
- [ ] `pnpm --filter @landx/public-site typecheck` passes
- [ ] `pnpm --filter @landx/public-site test` passes
- [ ] `pnpm --filter @landx/data test` passes (includes `aggregators.test.ts`)
- [ ] `pnpm --filter @landx/public-site build` passes
- [ ] `grep -rln "import.*LISTINGS" src --include="*.{ts,tsx,astro}"` returns only the OG endpoint exceptions (or empty if those were also migrated)
- [ ] Bundle audit: sentinel id not found in any `dist/_astro/*.js`
- [ ] Spec status updated to ✅ Tamamlandı
- [ ] User runs `pnpm test:e2e` manually (per `feedback_skip_e2e` memory) — listed as user follow-up below

## User Follow-Up

After plan execution, ahmet runs e2e himself:
```bash
pnpm test:e2e
```

If anything fails on /ara, /ilan/[slug], /karsilastir, /ofis/[slug], or /hesabim/* — bring back the failure trace; we adjust before pushing.
