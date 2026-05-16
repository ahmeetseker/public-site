/**
 * F37 Faz 4.0 — AI fiyat tahmini (mock).
 *
 * Deterministik hash-based: aynı listingId her zaman aynı çıktı.
 * Gerçek bir model değil, mockup deneyimi için yeterli.
 */

export interface ForecastInput {
  listingId: string
  currentPrice: number
}

export interface ForecastResult {
  horizonMonths: 12
  expected: number
  rangeLow: number
  rangeHigh: number
  confidence: number
  factors: string[]
}

const FACTOR_POOL = [
  'Bölge metro hattı 2027 (M9 ya da M11 erişimi planlı)',
  'Yakın okul yatırımı (yeni anadolu lisesi)',
  'Sahil rehabilitasyon projesi',
  'Hızlı tren (YHT) bağlantısı',
  'Yeni AVM açılışı',
  'Yeşil alan dönüşümü',
  'Sağlık kampüsü inşaatı',
  'Üniversite kampüsü genişlemesi',
  'Yeni iş merkezi (havalimanı koridoru)',
  'Belediye altyapı yatırımı',
]

function hashSeed(id: string, salt: string): number {
  let h = 5381
  const combined = `${id}|${salt}`
  for (let i = 0; i < combined.length; i++) {
    h = ((h << 5) + h) + combined.charCodeAt(i)
    h = h >>> 0
  }
  return (h % 10000) / 10000
}

export function computeForecast(input: ForecastInput): ForecastResult {
  const { listingId, currentPrice } = input
  const expectedGrowthPct = -0.02 + hashSeed(listingId, 'growth') * 0.17
  const expected = Math.round(currentPrice * (1 + expectedGrowthPct))
  const rangeSpread = 0.07 + hashSeed(listingId, 'spread') * 0.05
  const rangeLow = Math.round(expected * (1 - rangeSpread))
  const rangeHigh = Math.round(expected * (1 + rangeSpread))
  const confidence = 0.55 + hashSeed(listingId, 'conf') * 0.3
  const factorCount = 2 + Math.floor(hashSeed(listingId, 'fcount') * 3)
  const factors: string[] = []
  for (let i = 0; factors.length < factorCount && i < FACTOR_POOL.length * 2; i++) {
    const idx = Math.floor(hashSeed(listingId, `f${i}`) * FACTOR_POOL.length)
    const factor = FACTOR_POOL[idx]!
    if (!factors.includes(factor)) factors.push(factor)
  }

  return {
    horizonMonths: 12,
    expected,
    rangeLow,
    rangeHigh,
    confidence: Math.round(confidence * 100) / 100,
    factors,
  }
}
