import { describe, it, expect } from 'vitest'
import { REGIONS } from '@landx/data'
import type { Region } from '@landx/data'
import {
  findNeighbors,
  getTransportInfo,
  haversineKm,
  isCoastal,
  REGION_CENTROIDS,
  getRegionCentroid,
} from '../bolge-neighbors'

const mkRegion = (over: Partial<Region> = {}): Region => ({
  slug: 'x',
  name: 'X',
  city: 'Test',
  match: () => false,
  heroEyebrow: '',
  heroHeadline: '',
  description: '',
  marketStats: { avgPricePerSqm: 0, activeBuyers: 0, avgDealDays: 0, yoy: '+0%' },
  highlights: [],
  faqs: [],
  ...over,
})

describe('bolge-neighbors: findNeighbors', () => {
  it('returns empty array when current slug not present', () => {
    expect(findNeighbors('does-not-exist', REGIONS, 4)).toEqual([])
  })

  it('never includes the current region in its own neighbors', () => {
    const neighbors = findNeighbors('cesme', REGIONS, 4)
    expect(neighbors.map((r) => r.slug)).not.toContain('cesme')
  })

  it('returns at most N neighbors', () => {
    const four = findNeighbors('cesme', REGIONS, 4)
    expect(four.length).toBeLessThanOrEqual(4)
    expect(four.length).toBeGreaterThan(0)
    const two = findNeighbors('cesme', REGIONS, 2)
    expect(two).toHaveLength(2)
  })

  it('prefers same-city neighbors (Çeşme → Urla both in İzmir)', () => {
    const neighbors = findNeighbors('cesme', REGIONS, 4)
    expect(neighbors[0]?.slug).toBe('urla')
  })

  it('falls back to adjacent-city scoring when no same-city match (Söke is the only Aydın region)', () => {
    const neighbors = findNeighbors('soke', REGIONS, 4)
    // Aydın is adjacent to İzmir + Muğla — every Aydın-adjacent neighbor should appear.
    const slugs = neighbors.map((r) => r.slug)
    expect(slugs.length).toBe(4)
    // None of the neighbors should be Söke itself.
    expect(slugs).not.toContain('soke')
  })

  it('is deterministic — same input yields same order', () => {
    const a = findNeighbors('ayvalik', REGIONS, 4).map((r) => r.slug)
    const b = findNeighbors('ayvalik', REGIONS, 4).map((r) => r.slug)
    expect(a).toEqual(b)
  })

  it('handles a tiny pool gracefully (just 2 regions)', () => {
    const tiny: Region[] = [
      mkRegion({ slug: 'a', city: 'İzmir' }),
      mkRegion({ slug: 'b', city: 'İzmir' }),
    ]
    const neighbors = findNeighbors('a', tiny, 4)
    expect(neighbors).toHaveLength(1)
    expect(neighbors[0]!.slug).toBe('b')
  })
})

describe('bolge-neighbors: getTransportInfo', () => {
  it('returns a seeded triplet (airport+motorway+port) for a known coastal slug', () => {
    const info = getTransportInfo('ayvalik')
    expect(info.airport.name).toBeTruthy()
    expect(info.airport.km).toBeGreaterThan(0)
    expect(info.motorway.name).toBeTruthy()
    expect(info.port).toBeDefined()
    expect(info.port?.km).toBeGreaterThan(0)
  })

  it('omits port for inland regions (Söke)', () => {
    const info = getTransportInfo('soke')
    expect(info.airport).toBeDefined()
    expect(info.motorway).toBeDefined()
    expect(info.port).toBeUndefined()
  })

  it('returns generic fallback for unknown slugs (no throw)', () => {
    const info = getTransportInfo('unknown-region')
    expect(info.airport).toBeDefined()
    expect(info.motorway).toBeDefined()
  })

  it('is deterministic — same slug → same payload', () => {
    expect(getTransportInfo('cesme')).toEqual(getTransportInfo('cesme'))
  })
})

describe('bolge-neighbors: centroids + haversine', () => {
  it('every public region in REGION_CENTROIDS resolves to a finite centroid', () => {
    for (const r of REGIONS) {
      const c = getRegionCentroid(r)
      expect(Number.isFinite(c.lat)).toBe(true)
      expect(Number.isFinite(c.lng)).toBe(true)
    }
  })

  it('Çeşme→Urla distance is < 60km (both around the İzmir peninsula)', () => {
    const cesme = REGION_CENTROIDS.cesme!
    const urla = REGION_CENTROIDS.urla!
    expect(haversineKm(cesme, urla)).toBeLessThan(60)
  })

  it('Ayvalık→Marmaris distance is > 300km', () => {
    const ayvalik = REGION_CENTROIDS.ayvalik!
    const marmaris = REGION_CENTROIDS.marmaris!
    expect(haversineKm(ayvalik, marmaris)).toBeGreaterThan(300)
  })

  it('isCoastal flags expected regions', () => {
    expect(isCoastal('ayvalik')).toBe(true)
    expect(isCoastal('soke')).toBe(false)
  })
})
