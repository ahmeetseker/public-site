import { describe, expect, it } from 'vitest'
import type { Listing } from '@landx/data'
import { scoreRelatedListing, scoreRelatedListings } from '@/lib/related-algorithm'

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'L1',
    title: 'Test Arsa',
    city: 'Balıkesir',
    district: 'Ayvalık',
    type: 'Zeytinlik',
    size: 1200,
    price: 2_400_000,
    status: 'Aktif',
    views: 0,
    weeklyTrend: [],
    lastUpdate: '2026-05-14',
    tags: ['imarli'],
    lat: 39.31,
    lng: 26.69,
    ...overrides,
  } as Listing
}

describe('scoreRelatedListing', () => {
  it('returns 0 for self comparison', () => {
    const src = makeListing()
    const result = scoreRelatedListing(src, src)
    expect(result.score).toBe(0)
  })

  it('rewards matching type', () => {
    const src = makeListing()
    const same = makeListing({ id: 'L2', city: 'İzmir', district: 'Çeşme', lat: 38.32, lng: 26.30 })
    expect(scoreRelatedListing(src, same).score).toBeGreaterThanOrEqual(30)
  })

  it('rewards same city + district when same city', () => {
    const src = makeListing()
    const sameCity = makeListing({ id: 'L2', district: 'Burhaniye' })
    expect(scoreRelatedListing(src, sameCity).score).toBeGreaterThanOrEqual(55)
    const sameDistrict = makeListing({ id: 'L3' })
    const districtScore = scoreRelatedListing(src, sameDistrict).score
    expect(districtScore).toBeGreaterThanOrEqual(75)
  })

  it('rewards price proximity within tolerance', () => {
    const src = makeListing()
    const closePrice = makeListing({ id: 'L2', price: 2_600_000 })
    const reasons = scoreRelatedListing(src, closePrice).reasons.map((r) => r.label)
    expect(reasons.some((r) => r.includes('fiyat'))).toBe(true)
  })

  it('rewards geo proximity (Haversine)', () => {
    const src = makeListing()
    const nearby = makeListing({ id: 'L2', lat: 39.4, lng: 26.7, district: 'Burhaniye' })
    const r = scoreRelatedListing(src, nearby).reasons.map((r) => r.label)
    expect(r.some((label) => label.includes('km'))).toBe(true)
  })

  it('rewards tag overlap up to 3 tags', () => {
    const src = makeListing({ tags: ['imarli', 'tapulu', 'denize-yakin'] })
    const overlap = makeListing({ id: 'L2', tags: ['imarli', 'tapulu', 'denize-yakin', 'yatirimlik'] })
    const result = scoreRelatedListing(src, overlap)
    expect(result.reasons.some((r) => r.label.includes('etiket'))).toBe(true)
  })

  it('clamps score to 100', () => {
    const src = makeListing({ tags: ['a', 'b', 'c'] })
    const twin = makeListing({ id: 'L2', tags: ['a', 'b', 'c'] })
    expect(scoreRelatedListing(src, twin).score).toBeLessThanOrEqual(100)
  })
})

describe('scoreRelatedListings', () => {
  const src = makeListing()

  it('sorts candidates by score desc', () => {
    const candidates: Listing[] = [
      makeListing({ id: 'far', city: 'İstanbul', district: 'Kadıköy', lat: 41, lng: 29, type: 'Tarla', size: 5000, price: 9_000_000 }),
      makeListing({ id: 'twin' }),
      makeListing({ id: 'half', city: 'Balıkesir', district: 'Burhaniye', type: 'Tarla' }),
    ]
    const out = scoreRelatedListings(src, candidates, { limit: 3, minScore: 0 })
    expect(out[0].listing.id).toBe('twin')
    expect(out[0].score).toBeGreaterThanOrEqual(out[1].score)
  })

  it('drops candidates below minScore', () => {
    const candidates: Listing[] = [
      makeListing({ id: 'far', city: 'İstanbul', district: 'Kadıköy', lat: 41, lng: 29, type: 'Tarla', size: 5000, price: 9_000_000, tags: [] }),
    ]
    expect(scoreRelatedListings(src, candidates, { minScore: 80 })).toEqual([])
  })

  it('skips non-active candidates when activeOnly is true', () => {
    const candidates: Listing[] = [makeListing({ id: 'pasif', status: 'Pasif' })]
    expect(scoreRelatedListings(src, candidates, { activeOnly: true })).toEqual([])
  })

  it('honours limit option', () => {
    const candidates: Listing[] = [
      makeListing({ id: 'a' }),
      makeListing({ id: 'b' }),
      makeListing({ id: 'c' }),
    ]
    expect(scoreRelatedListings(src, candidates, { limit: 2 }).length).toBeLessThanOrEqual(2)
  })

  it('skips self', () => {
    const out = scoreRelatedListings(src, [src, makeListing({ id: 'L2' })])
    expect(out.find((r) => r.listing.id === src.id)).toBeUndefined()
  })
})
