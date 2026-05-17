import { describe, it, expect } from 'vitest'
import { LISTINGS_V2 } from '../mock/listings-extended-v2'

describe('LISTINGS_V2 — Wave 1 enrichment', () => {
  it('arsa kategorisinde hasGas tanımlı (true ya da false)', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    for (const l of arsa) {
      expect(typeof l.hasGas).toBe('boolean')
    }
  })

  it('hasGas dağılımı %20-%80 arasında true (deterministik seed kontratı)', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    const trueCount = arsa.filter((l) => l.hasGas).length
    const ratio = trueCount / arsa.length
    expect(ratio).toBeGreaterThan(0.2)
    expect(ratio).toBeLessThan(0.8)
  })

  it('arsa kategorisinde tam olarak 2 ilan isFeatured=true', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    const featured = arsa.filter((l) => l.isFeatured === true)
    expect(featured.length).toBe(2)
  })

  it('isFeatured işaretli her ilanın comparisonHint metni vardır', () => {
    const featured = LISTINGS_V2.filter((l) => l.isFeatured === true)
    expect(featured.length).toBeGreaterThan(0)
    for (const l of featured) {
      expect(typeof l.comparisonHint).toBe('string')
      expect(l.comparisonHint!.length).toBeGreaterThan(0)
    }
  })

  it('featured ilanlar Aktif statüsündedir', () => {
    const featured = LISTINGS_V2.filter((l) => l.isFeatured === true)
    for (const l of featured) {
      expect(l.status).toBe('Aktif')
    }
  })
})
