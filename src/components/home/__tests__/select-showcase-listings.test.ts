import { describe, it, expect } from 'vitest'
import type { Listing } from '@landx/data'
import { selectShowcaseListings } from '../select-showcase-listings'

function mkListing(over: Partial<Listing>): Listing {
  return {
    id: 'X', title: 't', city: 'c', district: 'd',
    type: 'İmarlı', size: 100, price: 1_000_000,
    status: 'Aktif', views: 0, weeklyTrend: [],
    lastUpdate: '2026-01-01', tags: [], lat: 0, lng: 0,
    ...over,
  }
}

describe('selectShowcaseListings', () => {
  it('returns top-N active İmarlı by price descending', () => {
    const pool = [
      mkListing({ id: 'A', price: 1_000_000 }),
      mkListing({ id: 'B', price: 9_000_000 }),
      mkListing({ id: 'C', price: 5_000_000 }),
      mkListing({ id: 'D', price: 7_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 3 })
    expect(out.map((l) => l.id)).toEqual(['B', 'D', 'C'])
  })

  it('excludes non-active listings', () => {
    const pool = [
      mkListing({ id: 'A', status: 'Pasif', price: 9_000_000 }),
      mkListing({ id: 'B', price: 1_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['B'])
  })

  it('falls back to all active types when İmarlı pool has fewer than 3', () => {
    const pool = [
      mkListing({ id: 'A', type: 'İmarlı', price: 9_000_000 }),
      mkListing({ id: 'B', type: 'İmarlı', price: 1_000_000 }),
      mkListing({ id: 'C', type: 'Tarla', price: 5_000_000 }),
      mkListing({ id: 'D', type: 'Zeytinlik', price: 3_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['A', 'C', 'D', 'B'])
  })

  it('prefers İmarlı pool when it has 3 or more', () => {
    const pool = [
      mkListing({ id: 'A', type: 'İmarlı', price: 9_000_000 }),
      mkListing({ id: 'B', type: 'İmarlı', price: 1_000_000 }),
      mkListing({ id: 'C', type: 'İmarlı', price: 5_000_000 }),
      mkListing({ id: 'D', type: 'Tarla', price: 99_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['A', 'C', 'B'])
  })

  it('returns empty array when pool has no active listings', () => {
    const pool = [mkListing({ status: 'Pasif' })]
    expect(selectShowcaseListings(pool, { limit: 8 })).toEqual([])
  })

  it('respects override prop and slices to limit', () => {
    const pool = [mkListing({ id: 'A' })]
    const overrides = [
      mkListing({ id: 'X' }), mkListing({ id: 'Y' }), mkListing({ id: 'Z' }),
    ]
    const out = selectShowcaseListings(pool, { limit: 2, override: overrides })
    expect(out.map((l) => l.id)).toEqual(['X', 'Y'])
  })

  it('defaults limit to 8 when not provided', () => {
    const pool = Array.from({ length: 12 }, (_, i) =>
      mkListing({ id: `L${i}`, price: 1_000_000 - i }),
    )
    expect(selectShowcaseListings(pool).length).toBe(8)
  })
})
