/**
 * Afet risk skoru seed — Wave F37 / Faz 1.
 *
 * Mockup H bölümü ("6 axis radar: deprem/fay/sel/yangın/heyelan/kuraklık").
 * Her listing için 1 hazard score:
 *   - Deprem PGA: 0.15-0.55 g (Türkiye fay zonlarına göre)
 *   - Fay mesafe: 1-50 km (DAFZ/KAFZ/EAF/BAFZ)
 *   - Zemin sınıfı: ZA/ZB/ZC/ZD/ZE
 *   - Sel/heyelan/yangın/kuraklık skor: 0-100
 *
 * Şehir bazlı baseline (LISTINGS.city) — Ege kıyısı Marmara'ya göre düşük
 * deprem riski + yüksek yangın riski (mock heuristic).
 */

import { LISTINGS } from './listings'
import type { HazardScore, ZeminSinifi } from '../types/listing-detail'

interface CityProfile {
  /** PGA aralığı (g). */
  pgaRange: [number, number]
  /** Aktif fay zonu adı. */
  fayBolge: string
  /** Fay mesafe aralığı (km). */
  fayMesafeRange: [number, number]
  /** Sel risk aralığı (0-100). */
  selRange: [number, number]
  /** Heyelan risk aralığı. */
  heyelanRange: [number, number]
  /** Orman yangın risk aralığı. */
  yanginRange: [number, number]
  /** Kuraklık risk aralığı. */
  kuraklikRange: [number, number]
}

// Şehir prefix (LISTINGS.id format: '28.AY.0142' → '28' = Giresun? Actually
// Turkish plate code; bizim mock'ta şehir alanı LISTINGS.city). Heuristic:
// Ege kıyısı orta deprem + yüksek yangın, İç Anadolu düşük her şey.
const DEFAULT_PROFILE: CityProfile = {
  pgaRange: [0.18, 0.32],
  fayBolge: 'BAFZ',
  fayMesafeRange: [8, 35],
  selRange: [10, 30],
  heyelanRange: [10, 35],
  yanginRange: [40, 70],
  kuraklikRange: [30, 55],
}

const CITY_PROFILES: Readonly<Record<string, CityProfile>> = {
  Balıkesir: {
    pgaRange: [0.22, 0.40],
    fayBolge: 'KAFZ',
    fayMesafeRange: [3, 25],
    selRange: [15, 35],
    heyelanRange: [10, 30],
    yanginRange: [50, 75],
    kuraklikRange: [30, 50],
  },
  Muğla: {
    pgaRange: [0.25, 0.45],
    fayBolge: 'BAFZ',
    fayMesafeRange: [4, 30],
    selRange: [15, 40],
    heyelanRange: [20, 50],
    yanginRange: [55, 80],
    kuraklikRange: [40, 65],
  },
  İzmir: {
    pgaRange: [0.30, 0.55],
    fayBolge: 'TEZ',
    fayMesafeRange: [1, 18],
    selRange: [20, 45],
    heyelanRange: [15, 40],
    yanginRange: [50, 75],
    kuraklikRange: [35, 60],
  },
  Aydın: {
    pgaRange: [0.28, 0.50],
    fayBolge: 'GTF',
    fayMesafeRange: [2, 22],
    selRange: [15, 35],
    heyelanRange: [15, 40],
    yanginRange: [50, 75],
    kuraklikRange: [35, 60],
  },
  Çanakkale: {
    pgaRange: [0.20, 0.38],
    fayBolge: 'KAFZ-Marmara',
    fayMesafeRange: [3, 25],
    selRange: [10, 30],
    heyelanRange: [10, 30],
    yanginRange: [45, 70],
    kuraklikRange: [25, 50],
  },
}

const ZEMIN_TABLE: ReadonlyArray<{ value: ZeminSinifi; w: number }> = [
  { value: 'ZA', w: 1 },
  { value: 'ZB', w: 3 },
  { value: 'ZC', w: 5 },
  { value: 'ZD', w: 4 },
  { value: 'ZE', w: 2 },
]

const KAYNAKLAR = ['AFAD', 'MTA', 'DSİ', 'MGM', 'Orman GM'] as const

function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function rand(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

function pickWeighted<T>(key: string, salt: string, table: ReadonlyArray<{ value: T; w: number }>): T {
  const total = table.reduce((s, r) => s + r.w, 0)
  const draw = rand(key, salt) * total
  let acc = 0
  for (const row of table) {
    acc += row.w
    if (draw <= acc) return row.value
  }
  return table[table.length - 1].value
}

function rangePick(key: string, salt: string, range: [number, number]): number {
  return Number((range[0] + (range[1] - range[0]) * rand(key, salt)).toFixed(2))
}

function rangePickInt(key: string, salt: string, range: [number, number]): number {
  return Math.round(range[0] + (range[1] - range[0]) * rand(key, salt))
}

function buildForListing(listingId: string, city: string): HazardScore {
  const profile = CITY_PROFILES[city] ?? DEFAULT_PROFILE
  const pga = rangePick(listingId, 'pga', profile.pgaRange)
  const fayMesafeKm = rangePick(listingId, 'fay', profile.fayMesafeRange)

  // Deprem skoru: PGA → 0-100 normalize (0.55g = 100)
  const depremSkor = Math.min(100, Math.round((pga / 0.55) * 100))

  return {
    listingId,
    scores: {
      deprem: { pga, donemYil: 475, skor: depremSkor },
      fayMesafeKm,
      fayBolge: profile.fayBolge,
      zeminSinifi: pickWeighted(listingId, 'zemin', ZEMIN_TABLE.map((z) => ({ value: z.value, w: z.w }))),
      selSkor: rangePickInt(listingId, 'sel', profile.selRange),
      heyelanSkor: rangePickInt(listingId, 'hey', profile.heyelanRange),
      yanginSkor: rangePickInt(listingId, 'yan', profile.yanginRange),
      kuraklikSkor: rangePickInt(listingId, 'kur', profile.kuraklikRange),
    },
    kaynaklar: [...KAYNAKLAR],
  }
}

export const HAZARD_SCORES: ReadonlyArray<HazardScore> = LISTINGS.map((l) =>
  buildForListing(l.id, l.city),
)

/** UI helper. */
export function getHazardScore(listingId: string): HazardScore | null {
  const found = HAZARD_SCORES.find((h) => h.listingId === listingId)
  return found
    ? {
        ...found,
        scores: { ...found.scores, deprem: { ...found.scores.deprem } },
        kaynaklar: [...found.kaynaklar],
      }
    : null
}
