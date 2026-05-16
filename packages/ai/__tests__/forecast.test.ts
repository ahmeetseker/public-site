import { describe, it, expect } from 'vitest'
import { computeForecast } from '../src/forecast'

describe('computeForecast', () => {
  it('deterministik — aynı listingId aynı çıktı', () => {
    const a = computeForecast({ listingId: 'TEST.001', currentPrice: 1000000 })
    const b = computeForecast({ listingId: 'TEST.001', currentPrice: 1000000 })
    expect(a).toEqual(b)
  })

  it('expected fiyat range içinde', () => {
    const f = computeForecast({ listingId: 'TEST.002', currentPrice: 500000 })
    expect(f.expected).toBeGreaterThanOrEqual(f.rangeLow)
    expect(f.expected).toBeLessThanOrEqual(f.rangeHigh)
  })

  it('confidence 0..1 arasında', () => {
    const f = computeForecast({ listingId: 'TEST.003', currentPrice: 2000000 })
    expect(f.confidence).toBeGreaterThanOrEqual(0)
    expect(f.confidence).toBeLessThanOrEqual(1)
  })

  it('factors en az 2 adet', () => {
    const f = computeForecast({ listingId: 'TEST.004', currentPrice: 1500000 })
    expect(f.factors.length).toBeGreaterThanOrEqual(2)
  })

  it('horizonMonths 12', () => {
    const f = computeForecast({ listingId: 'TEST.005', currentPrice: 800000 })
    expect(f.horizonMonths).toBe(12)
  })
})
