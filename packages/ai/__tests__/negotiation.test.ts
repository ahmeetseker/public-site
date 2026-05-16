import { describe, it, expect } from 'vitest'
import { computeNegotiationAdvice } from '../src/negotiation'

describe('computeNegotiationAdvice', () => {
  it('deltaPct doğru hesaplanır', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 1100000, avmExpected: 1000000 })
    expect(a.deltaPct).toBeCloseTo(10, 1)
  })

  it('band "overpriced" — listed >> avm', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 1500000, avmExpected: 1000000 })
    expect(a.band).toBe('overpriced')
  })

  it('band "bargain" — listed << avm', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 800000, avmExpected: 1000000 })
    expect(a.band).toBe('bargain')
  })

  it('band "fair" — listed ≈ avm', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 1020000, avmExpected: 1000000 })
    expect(a.band).toBe('fair')
  })

  it('suggestedOffer < listedPrice for overpriced', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 1500000, avmExpected: 1000000 })
    expect(a.suggestedOffer).toBeLessThan(1500000)
  })

  it('rationale array boş değil', () => {
    const a = computeNegotiationAdvice({ listingId: 'X', listedPrice: 1100000, avmExpected: 1000000 })
    expect(a.rationale.length).toBeGreaterThan(0)
  })
})
