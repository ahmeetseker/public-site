import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { LISTINGS, listingsByStatus } from '../mock/listings'
import type { Listing } from '../mock/types'
import { apiOrMock, landxApi } from '../api'
import { listingKeys, type ListingFilters } from './keys'
import { mockAsync } from './mock-latency'

export function applyFilters(rows: Listing[], f: ListingFilters): Listing[] {
  let out = rows
  if (f.status && f.status !== 'Tümü') out = out.filter((l) => l.status === f.status)
  if (f.type && f.type !== 'Tümü') out = out.filter((l) => l.type === f.type)
  if (f.priceMax != null) out = out.filter((l) => l.price <= f.priceMax!)
  if (f.priceMin != null) out = out.filter((l) => l.price >= f.priceMin!)
  if (f.areaMin != null) out = out.filter((l) => l.size >= f.areaMin!)
  if (f.search) {
    const q = f.search.toLocaleLowerCase('tr-TR')
    out = out.filter(
      (l) =>
        l.id.toLocaleLowerCase('tr-TR').includes(q) ||
        l.title.toLocaleLowerCase('tr-TR').includes(q) ||
        l.city.toLocaleLowerCase('tr-TR').includes(q) ||
        l.district.toLocaleLowerCase('tr-TR').includes(q) ||
        l.tags.some((t) => t.toLocaleLowerCase('tr-TR').includes(q)),
    )
  }
  return out
}

/**
 * Map UI filters → typed SDK query params. The UI uses 'Tümü' as a sentinel
 * for "no filter"; the SDK (and underlying API) expects the param to be
 * omitted entirely.
 */
type ListingsListQuery = Parameters<typeof landxApi.listings.list>[0]

function filtersToParams(f: ListingFilters): ListingsListQuery {
  return {
    status: f.status && f.status !== 'Tümü' ? f.status : undefined,
    type: f.type && f.type !== 'Tümü' ? f.type : undefined,
    priceMin: f.priceMin,
    priceMax: f.priceMax,
    areaMin: f.areaMin,
    q: f.search,
  }
}

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () =>
      apiOrMock<Listing[]>(
        // Cast: the SDK's `Listing` (from `@landx/api-types`) types `lat`/`lng`
        // as `number | null` per the OpenAPI schema; the mock `Listing` types
        // them as `number | undefined`. Shapes are otherwise identical and
        // the UI tolerates either. Drift fix lands when the mock seed adopts
        // the generated type wholesale (Wave 18).
        () => landxApi.listings.list(filtersToParams(filters)).then((env) => env.data as unknown as Listing[]),
        () => mockAsync(applyFilters(LISTINGS, filters)),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useListing(id: string) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () =>
      apiOrMock<Listing | null>(
        () => landxApi.listings.get(id).then((env) => env.data as unknown as Listing),
        () => mockAsync(LISTINGS.find((l) => l.id === id) ?? null),
      ),
    enabled: !!id,
  })
}

export function useListingStatusCounts() {
  return useQuery({
    queryKey: listingKeys.statusCounts(),
    // Status counts have no dedicated endpoint yet — derive locally even when
    // the API client is configured. Once a `/listings/status-counts` route
    // lands we can swap this branch.
    queryFn: () =>
      mockAsync({
        Tümü: LISTINGS.length,
        Aktif: listingsByStatus('Aktif').length,
        Pasif: listingsByStatus('Pasif').length,
        Taslak: listingsByStatus('Taslak').length,
      }),
  })
}

export interface NewListingInput {
  title: string
  city: string
  district: string
  type: Listing['type']
  size: number
  price: number
  status?: Listing['status']
  tags?: string[]
  lat?: number
  lng?: number
}

interface CreateListingContext {
  previous: Listing[] | undefined
  tempId: string
}

function buildCreatedListing(input: NewListingInput): Listing {
  return {
    id: `NEW.${Date.now().toString().slice(-7)}`,
    title: input.title,
    city: input.city,
    district: input.district,
    type: input.type,
    size: input.size,
    price: input.price,
    status: input.status ?? 'Taslak',
    views: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
    lastUpdate: new Date().toISOString(),
    tags: input.tags ?? [],
    // Wave F4.B.1 — Listing.lat/lng are now required. Fall back to a Turkey
    // centroid (39.0, 35.0) when the caller didn't supply coordinates so
    // optimistic mutations type-check without the ilan-ver form being forced
    // to collect map coords upfront.
    lat: input.lat ?? 39.0,
    lng: input.lng ?? 35.0,
  }
}

/**
 * Optimistic create. Generates a temporary id, prepends to cache list,
 * rolls back on error, refetches on settle to get the real id.
 *
 * Wave-15 / Faz 12.2.a: mutationFn now goes through apiOrMock so a configured
 * app POSTs to /listings; tests and unconfigured callers fall back to a
 * synthesised mock entry. Optimistic flow (onMutate/onError/onSettled) is
 * untouched.
 */
export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation<Listing, Error, NewListingInput, CreateListingContext>({
    mutationFn: (input) =>
      apiOrMock<Listing>(
        () => landxApi.listings.create(input).then((env) => env.data as unknown as Listing),
        () => mockAsync(buildCreatedListing(input), 300),
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listingKeys.lists() })
      const tempId = `TEMP.${Date.now()}`
      const previous = qc.getQueryData<Listing[]>(listingKeys.list({}))
      const tempListing: Listing = {
        id: tempId,
        title: input.title,
        city: input.city,
        district: input.district,
        type: input.type,
        size: input.size,
        price: input.price,
        status: input.status ?? 'Taslak',
        views: 0,
        weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
        lastUpdate: new Date().toISOString(),
        tags: input.tags ?? [],
        // Wave F4.B.1 — required lat/lng; same Turkey-centroid fallback as
        // buildCreatedListing() so the optimistic temp listing satisfies the
        // type even when the input didn't carry coords.
        lat: input.lat ?? 39.0,
        lng: input.lng ?? 35.0,
      }
      // Prepend to default list query
      qc.setQueryData<Listing[]>(listingKeys.list({}), (old = []) => [tempListing, ...old])
      return { previous, tempId }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(listingKeys.list({}), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listingKeys.all })
    },
  })
}

export interface UpdateListingInput {
  id: string
  patch: Partial<Pick<Listing, 'title' | 'price' | 'status' | 'tags'>>
}

/**
 * Patch an existing listing. The mock branch finds the entry in the seed
 * data, applies the patch in memory, and returns the result. The API branch
 * delegates to PATCH /listings/:id.
 */
export function useUpdateListing() {
  const qc = useQueryClient()
  return useMutation<Listing, Error, UpdateListingInput>({
    mutationFn: ({ id, patch }) =>
      apiOrMock<Listing>(
        () => landxApi.listings.patch(id, patch).then((env) => env.data as unknown as Listing),
        () => {
          const current = LISTINGS.find((l) => l.id === id)
          if (!current) {
            return Promise.reject(new Error(`Listing not found: ${id}`))
          }
          const updated: Listing = {
            ...current,
            ...patch,
            lastUpdate: new Date().toISOString(),
          }
          return mockAsync(updated, 200)
        },
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listingKeys.all })
    },
  })
}

/**
 * Delete a listing. Returns void on success. Mock branch resolves without
 * mutating the seed array (the cache invalidation will drop it from views).
 */
export function useDeleteListing() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiOrMock(
        () => landxApi.listings.remove(id),
        () => mockAsync(undefined, 150),
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listingKeys.all })
    },
  })
}
