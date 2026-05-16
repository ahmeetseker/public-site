/**
 * Mock seed — broker commissions (Wave F34 / Faz 1B).
 *
 * 320 commission record (12 ay × ~27 deal). Status karışık:
 *   - paid       ~%48
 *   - invoiced   ~%24
 *   - pending    ~%20
 *   - cancelled  ~%8
 *
 * Para alanları **kuruş** cinsi (TL × 100). Komisyon oranı 0.02 - 0.04 arası.
 */

import type {
  BrokerCommission,
  BrokerCommissionStatus,
} from '../types/broker'
import { BROKER_PROFILES } from './broker-profiles'

const STATUSES: ReadonlyArray<BrokerCommissionStatus> = [
  'paid', 'paid', 'paid', 'paid', 'paid',
  'invoiced', 'invoiced', 'invoiced',
  'pending', 'pending',
  'cancelled',
]

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function buildCommissions(): BrokerCommission[] {
  const out: BrokerCommission[] = []
  const profileIds = BROKER_PROFILES.map((p) => p.id)
  for (let i = 1; i <= 320; i++) {
    const id = `BR-CM-${pad(i, 4)}`
    const h = hash(id)
    const brokerId = profileIds[i % profileIds.length]!
    const status = STATUSES[h % STATUSES.length]!

    // Deal amount 1.5M – 18M TL, kuruşa çevrildi.
    const dealAmountTl = 1_500_000 + (h % 16_500_000)
    const dealAmount = dealAmountTl * 100
    // 2.0% – 4.0% komisyon
    const rateBps = 200 + (h % 200) // 200..399 bps
    const commissionRate = rateBps / 10_000
    const commissionAmount = Math.round(dealAmount * commissionRate)

    const createdDays = (i * 1.1) | 0 // 0..~352 gün, 12 aya yakın yayılım
    const paymentDate = status === 'paid'
      ? isoDaysAgo(Math.max(0, createdDays - 14))
      : undefined
    const receiptUrl = status === 'paid' || status === 'invoiced'
      ? `mock://receipts/${id}.pdf`
      : undefined

    out.push({
      id,
      brokerId,
      dealId: `BR-DL-${pad(i, 4)}`,
      listingId: `BR-LST-${pad(((h % 480) + 1), 4)}`,
      clientId: `BR-CL-${pad(((h % 800) + 1), 4)}`,
      dealAmount,
      commissionAmount,
      commissionRate: Number(commissionRate.toFixed(4)),
      status,
      paymentDate,
      receiptUrl,
      createdAt: isoDaysAgo(createdDays),
    })
  }
  return out
}

export const BROKER_COMMISSIONS: readonly BrokerCommission[] = buildCommissions()
