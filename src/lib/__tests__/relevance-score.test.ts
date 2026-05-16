import { describe, it, expect } from 'vitest'
import { relevanceScore, sortByRelevance } from '../relevance-score'
import type { Listing } from '@landx/data'

const mk = (over: Partial<Listing> = {}): Listing => ({
  id: 'L1',
  title: 'Ayvalık denize sıfır arsa',
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

describe('relevanceScore', () => {
  it('returns 0 for empty query', () => {
    expect(relevanceScore(mk(), '')).toBe(0)
    expect(relevanceScore(mk(), '   ')).toBe(0)
  })

  it('scores title match with weight 10', () => {
    const l = mk({ title: 'Cunda villa arsası', district: 'Other', city: 'Other' })
    expect(relevanceScore(l, 'cunda')).toBe(10)
  })

  it('scores district match with weight 5', () => {
    const l = mk({ title: 'Other', district: 'Ayvalık', city: 'Other' })
    expect(relevanceScore(l, 'ayvalık')).toBe(5)
  })

  it('scores city match with weight 3', () => {
    const l = mk({ title: 'Other', district: 'Other', city: 'Balıkesir' })
    expect(relevanceScore(l, 'balıkesir')).toBe(3)
  })

  it('scores zoning with weight 2', () => {
    const l = mk({ title: 'Other', district: 'Other', city: 'Other', zoning: 'konut' })
    expect(relevanceScore(l, 'konut')).toBe(2)
  })

  it('sums weights for multi-field matches', () => {
    // "ayvalık" matches title + district = 10 + 5 = 15
    const l = mk({ title: 'Ayvalık denize sıfır', district: 'Ayvalık', city: 'İzmir' })
    expect(relevanceScore(l, 'ayvalık')).toBe(15)
  })

  it('uses TR-locale lowercasing (İ → i)', () => {
    // "İSTANBUL" lowered with tr-TR locale becomes "istanbul"
    const l = mk({ title: 'İSTANBUL arsa', district: 'Other', city: 'Other' })
    expect(relevanceScore(l, 'istanbul')).toBeGreaterThan(0)
  })

  it('sortByRelevance sorts DESC by score and excludes zero-score entries', () => {
    const a = mk({ id: 'A', title: 'cunda', district: 'Other', city: 'Other' }) // 10
    const b = mk({ id: 'B', title: 'Other', district: 'Cunda', city: 'Other' }) // 5
    const c = mk({ id: 'C', title: 'Other', district: 'Other', city: 'Other' }) // 0
    const sorted = sortByRelevance([c, b, a], 'cunda')
    expect(sorted.map((l) => l.id)).toEqual(['A', 'B', 'C'])
  })

  it('sortByRelevance preserves order when query empty', () => {
    const a = mk({ id: 'A' })
    const b = mk({ id: 'B' })
    const sorted = sortByRelevance([a, b], '')
    expect(sorted.map((l) => l.id)).toEqual(['A', 'B'])
  })
})
