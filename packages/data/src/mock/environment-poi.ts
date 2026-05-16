/**
 * Çevre & POI seed — Wave F37 / Faz 1.
 *
 * Mockup I bölümü ("Walk Score + planlı yatırımlar"). Her listing için:
 *   - Walk Score 15-75 (yere göre)
 *   - Transit Score 20-80
 *   - Bike Score 25-65
 *   - 4-7 POI: hastane, ilkokul, market, eczane (her biri mesafe + isim)
 *   - %30 olasılıkla 1 future POI: planlı YHT/metro/otoyol
 *
 * POI isimleri şehir bazlı (Balıkesir → "Ayvalık Devlet Hastanesi" gibi).
 */

import { LISTINGS } from './listings'
import type { EnvironmentPoi, EnvironmentPoiItem } from '../types/listing-detail'

interface PoiTemplate {
  type: string
  /** İsim üretici — listing district + tip kombo. */
  buildLabel: (city: string, district: string) => string
  /** Mesafe aralığı (km). */
  distRange: [number, number]
  /** Bu POI'nin bulunma olasılığı. */
  probability: number
}

const POI_TEMPLATES: readonly PoiTemplate[] = [
  {
    type: 'hastane',
    buildLabel: (_city, district) => `${district.split(' · ')[0]} Devlet Hastanesi`,
    distRange: [2, 18],
    probability: 0.95,
  },
  {
    type: 'ilkokul',
    buildLabel: (_city, district) => `${district.split(' · ')[0]} İlkokulu`,
    distRange: [0.5, 5],
    probability: 1.0,
  },
  {
    type: 'market',
    buildLabel: (_city, district) => `${district.split(' · ')[0]} Migros / BİM`,
    distRange: [0.4, 6],
    probability: 0.95,
  },
  {
    type: 'eczane',
    buildLabel: (_city, district) => `${district.split(' · ')[0]} eczane noktası`,
    distRange: [0.3, 4],
    probability: 0.9,
  },
  {
    type: 'jandarma',
    buildLabel: (_city, district) => `${district.split(' · ')[0]} Jandarma Karakolu`,
    distRange: [1, 10],
    probability: 0.6,
  },
  {
    type: 'otoyol_cikis',
    buildLabel: (_city, _district) => `En yakın otoyol çıkışı`,
    distRange: [3, 30],
    probability: 0.6,
  },
]

const FUTURE_TEMPLATES: ReadonlyArray<{ type: string; label: string; year: string; distRange: [number, number] }> = [
  { type: 'yht', label: 'Planlanan YHT İstasyonu', year: '2027', distRange: [3, 20] },
  { type: 'metro', label: 'Planlanan metro hattı', year: '2028', distRange: [4, 15] },
  { type: 'otoyol', label: 'Yapımı süren otoyol bağlantısı', year: '2026', distRange: [2, 12] },
  { type: 'havalimani', label: 'Bölge havalimanı genişleme', year: '2027', distRange: [10, 50] },
]

interface CityScoreProfile {
  walkRange: [number, number]
  transitRange: [number, number]
  bikeRange: [number, number]
}

const CITY_SCORES: Readonly<Record<string, CityScoreProfile>> = {
  Balıkesir: { walkRange: [25, 55], transitRange: [25, 55], bikeRange: [30, 55] },
  Muğla: { walkRange: [20, 50], transitRange: [25, 50], bikeRange: [25, 55] },
  İzmir: { walkRange: [40, 75], transitRange: [50, 80], bikeRange: [35, 65] },
  Aydın: { walkRange: [25, 55], transitRange: [30, 60], bikeRange: [30, 60] },
  Çanakkale: { walkRange: [25, 50], transitRange: [25, 50], bikeRange: [30, 55] },
}

const DEFAULT_SCORES: CityScoreProfile = {
  walkRange: [15, 50],
  transitRange: [20, 55],
  bikeRange: [25, 55],
}

function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function rand(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

function rangePickInt(key: string, salt: string, range: [number, number]): number {
  return Math.round(range[0] + (range[1] - range[0]) * rand(key, salt))
}

function rangePickFloat(key: string, salt: string, range: [number, number], decimals = 1): number {
  const t = rand(key, salt)
  return Number((range[0] + (range[1] - range[0]) * t).toFixed(decimals))
}

function buildForListing(listingId: string, city: string, district: string): EnvironmentPoi {
  const profile = CITY_SCORES[city] ?? DEFAULT_SCORES

  const poi: EnvironmentPoiItem[] = []
  for (const tpl of POI_TEMPLATES) {
    if (rand(listingId, `poi-${tpl.type}`) <= tpl.probability) {
      poi.push({
        type: tpl.type,
        label: tpl.buildLabel(city, district),
        distance: rangePickFloat(listingId, `dist-${tpl.type}`, tpl.distRange),
      })
    }
  }
  // Min 4 POI garantilemek için fallback
  if (poi.length < 4) {
    for (const tpl of POI_TEMPLATES) {
      if (poi.length >= 4) break
      if (poi.some((p) => p.type === tpl.type)) continue
      poi.push({
        type: tpl.type,
        label: tpl.buildLabel(city, district),
        distance: rangePickFloat(listingId, `dist-fb-${tpl.type}`, tpl.distRange),
      })
    }
  }

  // %30 olasılıkla 1 future POI
  if (rand(listingId, 'futureProb') < 0.3) {
    const idx = Math.floor(rand(listingId, 'futureIdx') * FUTURE_TEMPLATES.length)
    const ft = FUTURE_TEMPLATES[idx]
    poi.push({
      type: ft.type,
      label: ft.label,
      distance: rangePickFloat(listingId, `fdist-${ft.type}`, ft.distRange),
      future: true,
      futureDate: ft.year,
    })
  }

  return {
    listingId,
    walkScore: rangePickInt(listingId, 'walk', profile.walkRange),
    transitScore: rangePickInt(listingId, 'transit', profile.transitRange),
    bikeScore: rangePickInt(listingId, 'bike', profile.bikeRange),
    poi,
  }
}

export const ENVIRONMENT_POI: ReadonlyArray<EnvironmentPoi> = LISTINGS.map((l) =>
  buildForListing(l.id, l.city, l.district),
)

/** UI helper. */
export function getEnvironmentPoi(listingId: string): EnvironmentPoi | null {
  const found = ENVIRONMENT_POI.find((e) => e.listingId === listingId)
  return found
    ? { ...found, poi: found.poi.map((p) => ({ ...p })) }
    : null
}
