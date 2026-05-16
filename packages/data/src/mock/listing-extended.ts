/**
 * Listing extended seed — Wave F37 / Faz 1.
 *
 * Mockup B bölümü ("TKGM yapılandırılmış kimlik kartı"). Mevcut LISTINGS
 * mock'undaki her ilan için extension üretir:
 *   - ada/parsel/pafta (deterministik)
 *   - mülkiyet: ~%70 müstakil, ~%30 hisseli (1/2, 1/3, 1/4, 1/6)
 *   - yüzölçümü tapu vs aplikasyon (1-3% sapma)
 *   - vasfı: 60% arsa, 25% tarla, 8% bağ, 5% bahçe, 2% zeytinlik
 *   - toprakSinifi (sadece tarla/bağ için)
 *   - 5-8 verification badge per listing
 *
 * Üretim: deterministik hash → reproduceable test snapshots.
 */

import { LISTINGS } from './listings'
import { getBadgesForListing } from './verification-badges'
import type {
  ListingExtended,
  ListingVasfi,
  MulkiyetTipi,
  ToprakSinifi,
} from '../types/listing-detail'

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

const VASFI_TABLE = [
  { value: 'arsa' as ListingVasfi, w: 60 },
  { value: 'tarla' as ListingVasfi, w: 25 },
  { value: 'bag' as ListingVasfi, w: 8 },
  { value: 'bahce' as ListingVasfi, w: 5 },
  { value: 'zeytinlik' as ListingVasfi, w: 2 },
] as const

const HISSE_PAYLAR: ReadonlyArray<{ orani: number; hissedar: number; w: number }> = [
  { orani: 1 / 2, hissedar: 2, w: 4 },
  { orani: 1 / 3, hissedar: 3, w: 3 },
  { orani: 1 / 4, hissedar: 4, w: 2 },
  { orani: 1 / 6, hissedar: 6, w: 1 },
]

const YOLLAR = ['asfalt', 'stabilize', 'asfalt (köy yolu)', 'asfalt (devlet yolu)'] as const

const TOPRAK_SINIF: ReadonlyArray<{ value: ToprakSinifi; w: number }> = [
  { value: 'marjinal', w: 3 },
  { value: 'verimli', w: 5 },
  { value: 'cok_verimli', w: 2 },
]

function buildExtended(listingId: string, baseSize: number): ListingExtended {
  // Ada/parsel/pafta — TR tipik (ada 100-9999, parsel 1-500, pafta 1-50).
  const ada = String(100 + Math.floor(rand(listingId, 'ada') * 9899))
  const parsel = String(1 + Math.floor(rand(listingId, 'parsel') * 499))
  const pafta = String(1 + Math.floor(rand(listingId, 'pafta') * 49))

  // Mülkiyet: 70/30 müstakil/hisseli
  const isHisseli = rand(listingId, 'mulkiyet') > 0.7
  const mulkiyetTipi: MulkiyetTipi = isHisseli ? 'hisseli' : 'mustakil'
  const hissePay = isHisseli ? pickWeighted(listingId, 'hissePay', HISSE_PAYLAR.map((p) => ({ value: p, w: p.w }))) : null

  // Yüzölçümü: tapu = LISTINGS.size, aplikasyon ±1-3% sapma
  const sapmaPct = (rand(listingId, 'sapma') - 0.5) * 6 // -3..+3
  const aplikasyon = Math.round(baseSize * (1 + sapmaPct / 100))

  // Cephe: %75 var, yola değişen tip
  const hasCephe = rand(listingId, 'cephe') > 0.25
  const cephe = hasCephe
    ? {
        yol: YOLLAR[Math.floor(rand(listingId, 'yolType') * YOLLAR.length)],
        uzunluk: 8 + Math.round(rand(listingId, 'cepheLen') * 42), // 8-50 m
      }
    : undefined

  // Eğim: %0-25 (parsel cinsi)
  const egim = Math.round(rand(listingId, 'egim') * 25 * 10) / 10

  // Vasfı (weighted)
  const vasfi = pickWeighted(listingId, 'vasfi', VASFI_TABLE.map((v) => ({ value: v.value, w: v.w })))

  // Toprak sınıfı (sadece tarım vasfı için)
  const tarimVasiflar: ListingVasfi[] = ['tarla', 'bag', 'bahce', 'zeytinlik']
  const toprakSinifi = tarimVasiflar.includes(vasfi)
    ? pickWeighted(listingId, 'toprak', TOPRAK_SINIF.map((t) => ({ value: t.value, w: t.w })))
    : undefined

  // İfraz: vasfı=arsa için %85 mümkün, tarım için %30
  const ifrazThreshold = vasfi === 'arsa' ? 0.85 : 0.3
  const ifrazMumkun = rand(listingId, 'ifraz') < ifrazThreshold

  return {
    listingId,
    ada,
    parsel,
    pafta,
    mulkiyetTipi,
    hisseOrani: hissePay ? Number(hissePay.orani.toFixed(4)) : undefined,
    hissedarSayisi: hissePay ? hissePay.hissedar : undefined,
    ifrazMumkun,
    yuzolcumu: {
      tapu: baseSize,
      aplikasyon,
      sapmaPct: Number(sapmaPct.toFixed(2)),
    },
    cephe,
    egim,
    vasfi,
    toprakSinifi,
    badges: getBadgesForListing(listingId),
  }
}

export const LISTING_EXTENDED: ReadonlyArray<ListingExtended> = LISTINGS.map((l) =>
  buildExtended(l.id, l.size),
)

/** Defensive shallow clone for hook consumers. */
export function getListingExtended(listingId: string): ListingExtended | null {
  const found = LISTING_EXTENDED.find((e) => e.listingId === listingId)
  return found ? { ...found, badges: found.badges.map((b) => ({ ...b })) } : null
}
