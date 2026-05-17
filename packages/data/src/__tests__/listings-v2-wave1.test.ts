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
})
