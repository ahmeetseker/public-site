/**
 * F37 Faz 4.0 — Yatırım getirisi (ROI) + tax breakdown hesabı (mock).
 */

export interface RoiInput {
  price: number
  monthlyRent: number
}

export interface RoiResult {
  monthly: number
  yieldPct: number
  paybackYears: number
  rangeLow: number
  rangeHigh: number
  tax: {
    tapuHarci: number
    kdv: number
    emlakBeyani: number
    notarisFee: number
    total: number
  }
}

export function computeRoi(input: RoiInput): RoiResult {
  const { price, monthlyRent } = input
  const annualRent = monthlyRent * 12
  const yieldPct = (annualRent / price) * 100
  const paybackYears = price / annualRent

  const rangeLow = Math.round(monthlyRent * 0.85)
  const rangeHigh = Math.round(monthlyRent * 1.15)

  const tapuHarci = Math.round(price * 0.02)
  const kdv = price < 1_500_000 ? Math.round(price * 0.01) : Math.round(price * 0.08)
  const emlakBeyani = Math.round(price * 0.002)
  const notarisFee = 8500
  const total = tapuHarci + kdv + emlakBeyani + notarisFee

  return {
    monthly: monthlyRent,
    yieldPct: Math.round(yieldPct * 100) / 100,
    paybackYears: Math.round(paybackYears * 10) / 10,
    rangeLow,
    rangeHigh,
    tax: { tapuHarci, kdv, emlakBeyani, notarisFee, total },
  }
}
