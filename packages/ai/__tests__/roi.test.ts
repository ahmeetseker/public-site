import { describe, it, expect } from 'vitest'
import { computeRoi } from '../src/roi'

describe('computeRoi', () => {
  it('monthly rent calc tutarlı', () => {
    const r = computeRoi({ price: 1000000, monthlyRent: 5000 })
    expect(r.yieldPct).toBeCloseTo(6, 0)
  })

  it('payback yıl hesabı', () => {
    const r = computeRoi({ price: 1200000, monthlyRent: 10000 })
    expect(r.paybackYears).toBeCloseTo(10, 0)
  })

  it('rangeLow < monthly < rangeHigh', () => {
    const r = computeRoi({ price: 1000000, monthlyRent: 5000 })
    expect(r.rangeLow).toBeLessThan(r.monthly)
    expect(r.rangeHigh).toBeGreaterThan(r.monthly)
  })

  it('tax breakdown toplam doğru', () => {
    const r = computeRoi({ price: 1000000, monthlyRent: 5000 })
    const sum = r.tax.tapuHarci + r.tax.kdv + r.tax.emlakBeyani + r.tax.notarisFee
    expect(r.tax.total).toBe(sum)
  })
})
