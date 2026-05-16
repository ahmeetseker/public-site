import { describe, expect, it } from 'vitest'
import type { Listing } from '@landx/data'

import { findSimilar, similarityScore } from '../similar'

const mk = (overrides: Partial<Listing> & { id: string }): Listing => ({
  id: overrides.id,
  title: overrides.title ?? `Listing ${overrides.id}`,
  city: overrides.city ?? 'Balıkesir',
  district: overrides.district ?? 'Ayvalık',
  type: overrides.type ?? 'İmarlı',
  size: overrides.size ?? 1000,
  price: overrides.price ?? 5_000_000,
  status: overrides.status ?? 'Aktif',
  views: overrides.views ?? 0,
  weeklyTrend: overrides.weeklyTrend ?? [],
  lastUpdate: overrides.lastUpdate ?? '2026-01-01',
  tags: overrides.tags ?? [],
  lat: overrides.lat ?? 39.3,
  lng: overrides.lng ?? 26.7,
  zoning: overrides.zoning,
  titleStatus: overrides.titleStatus,
  hasRoad: overrides.hasRoad,
  hasWater: overrides.hasWater,
  hasElectricity: overrides.hasElectricity,
})

describe('similarityScore', () => {
  it('returns higher score for same district vs different district same city', () => {
    const current = mk({ id: 'A' })
    const sameDistrict = mk({ id: 'B', district: 'Ayvalık', city: 'Balıkesir' })
    const sameCityOnly = mk({ id: 'C', district: 'Burhaniye', city: 'Balıkesir' })
    expect(similarityScore(current, sameDistrict)).toBeGreaterThan(
      similarityScore(current, sameCityOnly),
    )
  })

  it('matching zoning adds a boost only when both sides set it', () => {
    const current = mk({ id: 'A', zoning: 'konut' })
    const withZoning = mk({ id: 'B', district: 'Bambaşka', city: 'BambaşkaCity', zoning: 'konut' })
    const withoutZoning = mk({ id: 'C', district: 'Bambaşka', city: 'BambaşkaCity' })
    expect(similarityScore(current, withZoning)).toBeGreaterThan(
      similarityScore(current, withoutZoning),
    )
  })

  it('similar size beats wildly different size', () => {
    const current = mk({ id: 'A', size: 1000, district: 'X', city: 'Y' })
    const close = mk({ id: 'B', size: 1100, district: 'XX', city: 'YY' })
    const far = mk({ id: 'C', size: 50_000, district: 'XX', city: 'YY' })
    expect(similarityScore(current, close)).toBeGreaterThan(
      similarityScore(current, far),
    )
  })

  it('zero or invalid size collapses sizeRatio contribution to 0', () => {
    const current = mk({ id: 'A', size: 1000 })
    const broken = mk({ id: 'B', size: 0, district: 'XX', city: 'YY' })
    expect(similarityScore(current, broken)).toBeLessThan(
      similarityScore(current, mk({ id: 'C', size: 1000, district: 'XX', city: 'YY' })),
    )
  })
})

describe('findSimilar', () => {
  it('returns empty when there are no other listings', () => {
    const current = mk({ id: 'A' })
    expect(findSimilar(current, [current])).toEqual([])
  })

  it('excludes current listing from the result', () => {
    const current = mk({ id: 'A' })
    const others = [current, mk({ id: 'B' }), mk({ id: 'C' })]
    const out = findSimilar(current, others, 6)
    expect(out.map((l) => l.id)).not.toContain('A')
  })

  it('returns at most N items', () => {
    const current = mk({ id: 'A' })
    const pool: Listing[] = [current]
    for (let i = 0; i < 10; i++) pool.push(mk({ id: `X${i}` }))
    expect(findSimilar(current, pool, 6)).toHaveLength(6)
  })

  it('ranks same-district neighbours above different-city listings', () => {
    const current = mk({ id: 'A', district: 'Ayvalık', city: 'Balıkesir' })
    const sameDistrict = mk({ id: 'D1', district: 'Ayvalık', city: 'Balıkesir' })
    const farAway = mk({ id: 'F1', district: 'Karşıyaka', city: 'İzmir' })
    const out = findSimilar(current, [current, farAway, sameDistrict], 2)
    expect(out[0].id).toBe('D1')
  })

  it('tie-breaks deterministically by id', () => {
    const current = mk({ id: 'A' })
    const b = mk({ id: 'B', district: 'X', city: 'Y' })
    const c = mk({ id: 'C', district: 'X', city: 'Y' })
    const out = findSimilar(current, [current, c, b], 2)
    // Both have identical score → id-asc tie-break => B before C.
    expect(out.map((l) => l.id)).toEqual(['B', 'C'])
  })
})
