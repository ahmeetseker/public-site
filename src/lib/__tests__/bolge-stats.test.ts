import { describe, it, expect } from 'vitest'
import { computeStats, MONTHLY_TREND_LENGTH } from '../bolge-stats'
import type { Listing } from '@landx/data'

const mk = (over: Partial<Listing> = {}): Listing => ({
  id: 'L1',
  title: 'Arsa',
  city: 'Balıkesir',
  district: 'Ayvalık',
  type: 'Tarla',
  size: 1000,
  price: 1_000_000,
  status: 'Aktif',
  views: 0,
  weeklyTrend: [],
  lastUpdate: '2026-05-01T00:00:00Z',
  tags: [],
  lat: 39.3,
  lng: 26.7,
  ...over,
})

describe('bolge-stats: computeStats', () => {
  it('returns zeroed stats for an empty bolge (deterministic trend still emitted)', () => {
    const stats = computeStats('cunda', [])
    expect(stats.totalListings).toBe(0)
    expect(stats.avgPricePerSqm).toBe(0)
    expect(stats.newLast30Days).toBe(0)
    expect(stats.smallestSize).toBe(0)
    expect(stats.largestSize).toBe(0)
    expect(stats.monthlyTrend).toHaveLength(MONTHLY_TREND_LENGTH)
    // All trend bars are non-negative.
    for (const v of stats.monthlyTrend) expect(v).toBeGreaterThanOrEqual(0)
  })

  it('computes average ₺/m² across listings', () => {
    const listings = [
      mk({ id: 'a', size: 1000, price: 2_000_000 }), // 2_000 / m²
      mk({ id: 'b', size: 500, price: 2_000_000 }), //  4_000 / m²
    ]
    const stats = computeStats('ayvalik', listings)
    // Mean of [2_000, 4_000] = 3_000
    expect(stats.avgPricePerSqm).toBe(3_000)
    expect(stats.totalListings).toBe(2)
  })

  it('returns size range (smallest / largest)', () => {
    const listings = [mk({ id: 'a', size: 500 }), mk({ id: 'b', size: 9_000 }), mk({ id: 'c', size: 1_200 })]
    const stats = computeStats('x', listings)
    expect(stats.smallestSize).toBe(500)
    expect(stats.largestSize).toBe(9_000)
  })

  it('counts listings published in the last 30 days (approximate, by lastUpdate)', () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const old = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const listings = [
      mk({ id: 'a', lastUpdate: recent }),
      mk({ id: 'b', lastUpdate: recent }),
      mk({ id: 'c', lastUpdate: old }),
    ]
    const stats = computeStats('x', listings)
    expect(stats.newLast30Days).toBe(2)
  })

  it('monthly trend has 12 bars', () => {
    const stats = computeStats('cesme', [mk()])
    expect(stats.monthlyTrend).toHaveLength(12)
  })

  it('is deterministic — same bolge slug yields the same trend', () => {
    const a = computeStats('bodrum', [mk()])
    const b = computeStats('bodrum', [mk()])
    expect(a.monthlyTrend).toEqual(b.monthlyTrend)
  })

  it('different bolge slugs yield different trends', () => {
    const a = computeStats('cesme', [mk()])
    const b = computeStats('bodrum', [mk()])
    expect(a.monthlyTrend).not.toEqual(b.monthlyTrend)
  })

  it('safely skips listings with size <= 0 when computing avg ₺/m²', () => {
    const listings = [mk({ id: 'a', size: 0, price: 999 }), mk({ id: 'b', size: 1000, price: 2_000_000 })]
    const stats = computeStats('x', listings)
    expect(stats.avgPricePerSqm).toBe(2_000)
    expect(stats.totalListings).toBe(2)
  })
})
