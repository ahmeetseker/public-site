/**
 * Verifikasyon rozetleri seed — Wave F37 / Faz 1.
 *
 * Mockup A bölümü ("verifikasyon rozet sırası"). Her listing 5-8 random
 * badge alır. TKGM ve Belediye her listing'de garantili (TR mevzuat
 * gereği). Diğer 6 source'tan random 3-6 ekler.
 *
 * Üretim: deterministik hash (`listingId + source`), sabit seed →
 * reproduceable test snapshot'ları.
 *
 * Format: `Record<listingId, VerificationBadge[]>`. `VerificationBadge`
 * type'ı listing-agnostik (id-based identity) — bu lookup map liste döner.
 * `useVerificationBadges(listingId)` hook bunu kullanır.
 */

import { LISTINGS } from './listings'
import type { VerificationBadge, VerificationSource } from '../types/listing-detail'

interface BadgeTemplate {
  source: VerificationSource
  label: string
  /** 0-1 arası — listing'de bu rozet bulunma olasılığı. */
  probability: number
}

const BADGE_TEMPLATES: readonly BadgeTemplate[] = [
  { source: 'TKGM', label: 'TKGM doğrulandı', probability: 1.0 },
  { source: 'BELEDIYE', label: 'Belediye 1/1000 plan', probability: 1.0 },
  { source: 'DRONE', label: 'Drone konum doğrulandı', probability: 0.7 },
  { source: 'TARIM_BAKANLIGI', label: 'Tarım Bakanlığı vasfı', probability: 0.55 },
  { source: 'AFAD', label: 'AFAD risk raporu', probability: 0.85 },
  { source: 'MTA', label: 'MTA jeoloji haritası', probability: 0.55 },
  { source: 'DSI', label: 'DSİ su kaynakları', probability: 0.4 },
  { source: 'MGM', label: 'MGM iklim verisi', probability: 0.6 },
] as const

function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function deterministicRandom(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

/** Son 6 ay içinde deterministik tarih (ISO). */
function recentIso(seed: string, salt: string): string {
  const d = new Date('2026-05-01T09:00:00.000Z')
  const daysAgo = Math.floor(deterministicRandom(seed, salt) * 180)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(9 + Math.floor(deterministicRandom(seed, `${salt}h`) * 9))
  d.setUTCMinutes(Math.floor(deterministicRandom(seed, `${salt}m`) * 60))
  return d.toISOString()
}

function buildBadgesForListing(listingId: string): VerificationBadge[] {
  const out: VerificationBadge[] = []
  for (const tpl of BADGE_TEMPLATES) {
    const draw = deterministicRandom(listingId, `bd-${tpl.source}`)
    if (draw <= tpl.probability) {
      out.push({
        id: `vb-${listingId}-${tpl.source}`,
        source: tpl.source,
        label: tpl.label,
        verifiedAt: recentIso(listingId, tpl.source),
      })
    }
  }
  // En az 5 garantilemek için fallback (TKGM+BELEDIYE garanti 2 ve üst
  // bölge genelde 6-8 üretir; yine de 5 altında kalırsak DRONE/AFAD ekle).
  const fallbackCandidates: VerificationSource[] = ['DRONE', 'AFAD', 'MTA', 'MGM']
  for (const src of fallbackCandidates) {
    if (out.length >= 5) break
    if (out.some((b) => b.source === src)) continue
    const tpl = BADGE_TEMPLATES.find((t) => t.source === src)
    if (!tpl) continue
    out.push({
      id: `vb-${listingId}-${src}`,
      source: src,
      label: tpl.label,
      verifiedAt: recentIso(listingId, `${src}-fb`),
    })
  }
  return out
}

/**
 * `Record<listingId, VerificationBadge[]>` — UI ve hook lookup için.
 * `LISTINGS` mock'undaki tüm ilanlar için badge seti üretilir.
 */
export const VERIFICATION_BADGES: Readonly<Record<string, readonly VerificationBadge[]>> =
  Object.freeze(
    Object.fromEntries(
      LISTINGS.map((l) => [l.id, Object.freeze(buildBadgesForListing(l.id))] as const),
    ),
  )

/** UI helper: tek listing'in rozetlerini hızlı çek (defensive shallow clone). */
export function getBadgesForListing(listingId: string): VerificationBadge[] {
  const list = VERIFICATION_BADGES[listingId]
  if (!list) return []
  return list.map((b) => ({ ...b }))
}
