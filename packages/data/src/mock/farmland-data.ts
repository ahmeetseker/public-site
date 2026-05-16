/**
 * Tarla modülü seed — Wave F37 / Faz 1.
 *
 * Mockup G bölümü ("toprak/sulama/iklim/ekim/bağ evi"). SADECE tarım vasıflı
 * (`tarla`, `bag`, `bahce`, `zeytinlik`) listing'ler için üretir. Diğer
 * listing'ler için entry yok (`getFarmlandData(listingId)` null döner).
 *
 * Üretim deterministik:
 *   - toprak sınıfı: marjinal_kuru (35%) / verimli (50%) / cok_verimli (15%)
 *   - sulama: dsi (40%) / kuyu (30%) / dsi_disi (30%)
 *   - iklim: yağış 400-900 mm, don 5-30 gün, GDD 1500-2800
 *   - bağ evi izin: marjinal_kuru için %5 izinli (5403)
 *   - ekim geçmişi: son 5 yıl rotasyon (Buğday/Arpa/Ayçiçeği/Nadas/Mısır/Pamuk)
 *   - yatırım hesap: 3-4 ürün × yıllık net gelir aralığı (kuruş)
 */

import { LISTINGS } from './listings'
import { LISTING_EXTENDED } from './listing-extended'
import type {
  FarmlandData,
  FarmlandEkim,
  FarmlandToprak,
  FarmlandYatirim,
  ListingVasfi,
  SulamaTipi,
} from '../types/listing-detail'

const TARIM_VASIFLAR: readonly ListingVasfi[] = ['tarla', 'bag', 'bahce', 'zeytinlik']

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

const TOPRAK_TABLE: ReadonlyArray<{ value: FarmlandToprak; w: number }> = [
  { value: 'marjinal_kuru', w: 35 },
  { value: 'verimli', w: 50 },
  { value: 'cok_verimli', w: 15 },
]

const SULAMA_TABLE: ReadonlyArray<{ value: SulamaTipi; w: number }> = [
  { value: 'dsi', w: 40 },
  { value: 'kuyu', w: 30 },
  { value: 'dsi_disi', w: 30 },
]

const URUNLER = ['Buğday', 'Arpa', 'Ayçiçeği', 'Nadas', 'Mısır', 'Pamuk'] as const

const URUN_GELIR: Readonly<Record<string, [number, number]>> = {
  // Yıllık net gelir / dekar — kuruş
  Buğday: [180_00, 320_00],
  Arpa: [150_00, 270_00],
  Ayçiçeği: [240_00, 420_00],
  Mısır: [310_00, 540_00],
  Pamuk: [410_00, 690_00],
  Zeytin: [380_00, 720_00],
  Üzüm: [560_00, 980_00],
}

const VERIM_BY_TOPRAK: Readonly<Record<FarmlandToprak, [number, number]>> = {
  marjinal_kuru: [30, 50],
  verimli: [55, 75],
  cok_verimli: [75, 90],
}

function buildEkimGecmisi(listingId: string): FarmlandEkim[] {
  const out: FarmlandEkim[] = []
  const startYear = 2025
  let last = ''
  for (let i = 0; i < 5; i++) {
    const yil = startYear - i
    // Deterministik primary pick + collision'da deterministik shift
    // (ÖNEMLI: aynı salt her zaman aynı sayıyı döner, bu yüzden do/while
    // yerine offset stratejisi kullanıyoruz — yoksa sonsuz döngü).
    const baseIdx = Math.floor(rand(listingId, `ekim-${i}`) * URUNLER.length)
    let urun = URUNLER[baseIdx]
    if (urun === last && URUNLER.length > 1) {
      urun = URUNLER[(baseIdx + 1) % URUNLER.length]
    }
    last = urun
    out.push({ yil, urun })
  }
  // Eski → yeni sıra
  return out.reverse()
}

function buildYatirimHesap(listingId: string, vasfi: ListingVasfi): FarmlandYatirim[] {
  const out: FarmlandYatirim[] = []
  // Vasfa göre 3-4 ürün öner
  const candidates: string[] =
    vasfi === 'zeytinlik'
      ? ['Zeytin', 'Buğday', 'Ayçiçeği']
      : vasfi === 'bag'
        ? ['Üzüm', 'Buğday', 'Ayçiçeği']
        : vasfi === 'bahce'
          ? ['Mısır', 'Pamuk', 'Ayçiçeği', 'Buğday']
          : ['Buğday', 'Ayçiçeği', 'Mısır', 'Arpa']

  for (let i = 0; i < candidates.length; i++) {
    const urun = candidates[i]
    const range = URUN_GELIR[urun] ?? [200_00, 400_00]
    // ±15% varyans
    const variance = 1 + (rand(listingId, `yhv-${i}`) - 0.5) * 0.3
    out.push({
      urun,
      minGelir: Math.round(range[0] * variance),
      maxGelir: Math.round(range[1] * variance),
    })
  }
  return out
}

function buildForListing(listingId: string, vasfi: ListingVasfi): FarmlandData {
  const toprakSinifi = pickWeighted(
    listingId,
    'toprakF',
    TOPRAK_TABLE.map((t) => ({ value: t.value, w: t.w })),
  )
  const sulama = pickWeighted(
    listingId,
    'sulama',
    SULAMA_TABLE.map((s) => ({ value: s.value, w: s.w })),
  )

  const verimRange = VERIM_BY_TOPRAK[toprakSinifi]
  const verimSkoru = Math.round(verimRange[0] + rand(listingId, 'verim') * (verimRange[1] - verimRange[0]))

  const kuyuMesafe = sulama === 'kuyu' ? 30 + Math.round(rand(listingId, 'kuyu') * 270) : undefined
  const dereMesafe = 100 + Math.round(rand(listingId, 'dere') * 1900) // 100-2000 m

  const yagis = 400 + Math.round(rand(listingId, 'yagis') * 500)
  const donGun = 5 + Math.round(rand(listingId, 'don') * 25)
  const gdd = 1500 + Math.round(rand(listingId, 'gdd') * 1300)

  const bagEviIzin = toprakSinifi === 'marjinal_kuru' && rand(listingId, 'bagEvi') < 0.6
  const bagEviIzinPct = bagEviIzin ? 5 : undefined

  return {
    listingId,
    toprakSinifi,
    verimSkoru,
    sulama,
    kuyuMesafe,
    dereMesafe,
    iklim: { yagis, donGun, gdd },
    bagEviIzin,
    bagEviIzinPct,
    ekimGecmisi: buildEkimGecmisi(listingId),
    yatirimHesap: buildYatirimHesap(listingId, vasfi),
  }
}

export const FARMLAND_DATA: ReadonlyArray<FarmlandData> = LISTINGS.flatMap((l) => {
  const ext = LISTING_EXTENDED.find((e) => e.listingId === l.id)
  if (!ext || !TARIM_VASIFLAR.includes(ext.vasfi)) return []
  return [buildForListing(l.id, ext.vasfi)]
})

/** UI helper — listing tarım vasıflı değilse null döner. */
export function getFarmlandData(listingId: string): FarmlandData | null {
  const found = FARMLAND_DATA.find((f) => f.listingId === listingId)
  if (!found) return null
  return {
    ...found,
    iklim: { ...found.iklim },
    ekimGecmisi: found.ekimGecmisi.map((e) => ({ ...e })),
    yatirimHesap: found.yatirimHesap.map((y) => ({ ...y })),
  }
}
