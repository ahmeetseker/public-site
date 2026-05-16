import { describe, expect, it } from 'vitest'
import type { Listing } from '@landx/data'
import { getListingExtras, summarizeExtrasCoverage } from '@/lib/listing-extras'

function makeListing(id: string): Listing {
  return {
    id,
    title: 'x',
    city: 'X',
    district: 'X',
    type: 'Tarla',
    size: 100,
    price: 0,
    status: 'Aktif',
    views: 0,
    weeklyTrend: [],
    lastUpdate: '2026-05-14',
    tags: [],
    lat: 0,
    lng: 0,
  } as Listing
}

describe('getListingExtras', () => {
  it('returns flags + URLs when feature flagged', () => {
    const ext = getListingExtras(makeListing('seed-virtual'))
    expect(typeof ext.hasVirtualTour).toBe('boolean')
    if (ext.hasVirtualTour) expect(ext.virtualTourUrl).toMatch(/^https?:\/\//)
    if (ext.hasFloorPlan) expect(ext.floorPlanUrl).toBeTruthy()
    if (ext.hasVideo) expect(ext.videoEmbedUrl).toMatch(/youtube-nocookie/)
  })

  it('is deterministic for the same id', () => {
    const a = getListingExtras(makeListing('atolye-1'))
    const b = getListingExtras(makeListing('atolye-1'))
    expect(a).toEqual(b)
  })

  it('produces different distributions across ids', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `listing-${i}`)
    const summary = summarizeExtrasCoverage(ids.map(makeListing))
    expect(summary.total).toBe(40)
    // Approx 25% per feature; allow generous slack to avoid flakiness.
    expect(summary.virtualTour).toBeGreaterThan(0)
    expect(summary.floorPlan).toBeGreaterThan(0)
    expect(summary.video).toBeGreaterThan(0)
    expect(summary.virtualTour).toBeLessThan(40)
  })
})

describe('summarizeExtrasCoverage', () => {
  it('totals match input length', () => {
    const sample = ['a', 'b', 'c'].map(makeListing)
    const s = summarizeExtrasCoverage(sample)
    expect(s.total).toBe(sample.length)
  })

  it('empty array returns zeros', () => {
    const s = summarizeExtrasCoverage([])
    expect(s).toEqual({ total: 0, virtualTour: 0, floorPlan: 0, video: 0, any: 0 })
  })
})
