import { useQuery } from '@tanstack/react-query'
import { REGIONS, regionBySlug, getRegionListings, type Region } from '../mock/regions'
import { apiOrMock, landxApi } from '../api'
import { regionKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. The list endpoint now goes through
// `landxApi.public.listRegions`. Detail + per-region listings stay mock-only
// until /public/regions/{slug} and /public/regions/{slug}/listings ship.
// TODO faz12.6: expose region detail + listings endpoints.
//
// Wave 19 / Faz 12.12.c — Cast survives. The contract Region cannot carry
// the domain `match: (district: string) => boolean` predicate (functions
// don't cross the wire) and is missing `heroEyebrow / heroHeadline / faqs /
// similarSlugs`. The mock route returns the full domain shape so the cast
// lifts the artificially-narrowed contract back to it. Drop after the
// public-site refactor splits the wire-friendly fields from the
// presentation-only ones (predicate becomes a server-side filter, hero/faqs
// move to CMS or get added as nullable strings in openapi).

export function useRegions() {
  return useQuery({
    queryKey: regionKeys.lists(),
    queryFn: () =>
      apiOrMock(
        // TODO faz19/openapi: Region domain carries non-wire fields
        // (match() predicate, heroEyebrow, heroHeadline, faqs[],
        // similarSlugs[]). Split into RegionWire + RegionPresentation
        // before dropping this cast.
        () =>
          landxApi.public
            .listRegions()
            .then((env) => env.data as unknown as Region[]),
        () => mockAsync(REGIONS),
      ),
  })
}

export function useRegion(slug: string) {
  return useQuery({
    queryKey: regionKeys.detail(slug),
    // TODO faz12.6: swap to landxApi.public.getRegion(slug) once the endpoint
    // lands. Today the detail surface is mock-only.
    queryFn: () => mockAsync(regionBySlug(slug) ?? null),
    enabled: !!slug,
  })
}

export function useRegionListings(slug: string) {
  return useQuery({
    queryKey: regionKeys.listings(slug),
    // TODO faz12.6: swap to landxApi.public.getRegionListings(slug) once
    // the endpoint lands.
    queryFn: () => {
      const region = regionBySlug(slug)
      return mockAsync(region ? getRegionListings(region) : [])
    },
    enabled: !!slug,
  })
}
