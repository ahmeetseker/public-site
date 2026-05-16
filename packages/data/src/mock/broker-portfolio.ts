/**
 * Mock seed — broker portfolio items (Wave F34 / Faz 1B).
 *
 * 480 portfolio item — her broker'a ~16 listing dağılımı (30 broker × 16 = 480).
 *
 * Status dağılımı:
 *   - active   ~%55
 *   - paused   ~%14
 *   - draft    ~%10
 *   - sold     ~%15
 *   - expired  ~%6
 */

import type {
  BrokerPortfolioItem,
  BrokerPortfolioStatus,
} from '../types/broker'
import { BROKER_PROFILES } from './broker-profiles'

const STATUSES: ReadonlyArray<BrokerPortfolioStatus> = [
  'active', 'active', 'active', 'active', 'active', 'active', 'active', 'active',
  'active', 'active', 'active',
  'paused', 'paused', 'paused',
  'draft', 'draft',
  'sold', 'sold', 'sold',
  'expired',
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

function buildPortfolio(): BrokerPortfolioItem[] {
  const out: BrokerPortfolioItem[] = []
  let counter = 1
  for (const profile of BROKER_PROFILES) {
    for (let j = 0; j < 16; j++) {
      const id = `BR-PFI-${pad(counter, 4)}`
      const listingId = `BR-LST-${pad(counter, 4)}`
      const h = hash(id)
      const status = STATUSES[h % STATUSES.length]!
      const daysListed = (h >> 3) % 240 // 0-240 gün
      const baseViews = status === 'active' ? 800 : status === 'sold' ? 1500 : 200
      const views = baseViews + (h % 2400)
      const inquiries = Math.round(views * (0.02 + (h >> 5) % 8 / 100))
      const lastEditDays = Math.min(daysListed, (h >> 7) % 30)

      out.push({
        id,
        brokerId: profile.id,
        listingId,
        status,
        views,
        inquiries,
        daysListed,
        lastEdit: isoDaysAgo(lastEditDays),
      })
      counter++
    }
  }
  return out
}

export const BROKER_PORTFOLIO: readonly BrokerPortfolioItem[] = buildPortfolio()
