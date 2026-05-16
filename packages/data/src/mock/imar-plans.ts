/**
 * İmar planı seed — Wave F37 / Faz 1.
 *
 * Mockup F bölümü ("İmar & yapılaşma KAKS/TAKS + LLM açıklama"). Her listing
 * için 1 imar plan kaydı:
 *   - KAKS 0.4-2.0 (kullanım sınıfına göre)
 *   - TAKS 0.15-0.5
 *   - Maksimum kat 1-5
 *   - Çekme: 3-5 m / 3-3 m
 *   - Kullanım: konut/konut+ticari/sanayi/tarım (LISTINGS.zoning'a göre)
 *   - inşaatHakki = yuzolcumu × KAKS
 *   - LLM açıklama 2-3 cümle TR (deterministik template)
 */

import { LISTINGS } from './listings'
import { LISTING_EXTENDED } from './listing-extended'
import type { ImarPlan } from '../types/listing-detail'

function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function rand(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

interface KullanimProfile {
  kullanim: string
  kaksRange: [number, number]
  taksRange: [number, number]
  maxKatRange: [number, number]
}

const PROFILE_BY_ZONING: Readonly<Record<string, KullanimProfile>> = {
  konut: {
    kullanim: 'konut',
    kaksRange: [0.8, 1.6],
    taksRange: [0.25, 0.4],
    maxKatRange: [2, 4],
  },
  ticari: {
    kullanim: 'konut+ticari',
    kaksRange: [1.2, 2.0],
    taksRange: [0.3, 0.5],
    maxKatRange: [3, 5],
  },
  tarim: {
    kullanim: 'tarım (yapılaşma sınırlı)',
    kaksRange: [0.05, 0.2],
    taksRange: [0.03, 0.1],
    maxKatRange: [1, 1],
  },
  sanayi: {
    kullanim: 'sanayi',
    kaksRange: [0.6, 1.2],
    taksRange: [0.35, 0.5],
    maxKatRange: [1, 2],
  },
  turizm: {
    kullanim: 'turizm tesisi',
    kaksRange: [0.4, 1.0],
    taksRange: [0.15, 0.3],
    maxKatRange: [2, 3],
  },
}

const DEFAULT_PROFILE = PROFILE_BY_ZONING.konut

/** Range'den deterministik float (2 ondalık). */
function pickRange(key: string, salt: string, range: [number, number]): number {
  const t = rand(key, salt)
  return Number((range[0] + (range[1] - range[0]) * t).toFixed(2))
}

/** Range'den deterministik integer. */
function pickIntRange(key: string, salt: string, range: [number, number]): number {
  const t = rand(key, salt)
  return Math.round(range[0] + (range[1] - range[0]) * t)
}

function buildLlm(kullanim: string, maxKat: number, insaatHakki: number, vasfi: string): string {
  const intro =
    kullanim === 'tarım (yapılaşma sınırlı)'
      ? `Bu parselde tarımsal nitelik korunduğu için klasik konut yapılaşması mümkün değildir.`
      : `Bu parselde ${maxKat} kata kadar ${kullanim} yapılaşması mümkündür.`
  const middle =
    insaatHakki > 1000
      ? `Toplam ${insaatHakki.toLocaleString('tr-TR')} m² inşaat hakkı bulunmaktadır.`
      : `Sınırlı yapılaşma hakkı (${insaatHakki} m²) — küçük ölçek projeler için uygundur.`
  const tail =
    vasfi === 'tarla'
      ? `Bağ evi (5403 sayılı kanun kapsamında %5'e kadar) için ek başvuru gerekir.`
      : `Plan notu ve çekme mesafelerine dikkat edilmelidir.`
  return `${intro} ${middle} ${tail}`
}

const PLAN_NOTLARI = [
  '1/1000 ölçekli uygulama imar planı içerisindedir.',
  '1/5000 ölçekli nazım imar planı kapsamındadır; uygulama planı askıdadır.',
  'Kentsel dönüşüm 1. derece riskli alan kararı dışındadır.',
  'Belediye meclisi son revizyonu Şubat 2025 tarihinde onaylamıştır.',
  'Kıyı kanunu kapsamında 50 m geri çekilme uygulanmaktadır.',
] as const

function buildForListing(listingId: string, baseSize: number): ImarPlan {
  const listing = LISTINGS.find((l) => l.id === listingId)
  const zoning = listing?.zoning ?? 'konut'
  const ext = LISTING_EXTENDED.find((e) => e.listingId === listingId)
  const profile = PROFILE_BY_ZONING[zoning] ?? DEFAULT_PROFILE

  const kaks = pickRange(listingId, 'kaks', profile.kaksRange)
  const taks = pickRange(listingId, 'taks', profile.taksRange)
  const maxKat = pickIntRange(listingId, 'kat', profile.maxKatRange)

  const cekme = {
    on: 3 + Math.round(rand(listingId, 'on') * 2),       // 3-5
    yan: 3 + Math.round(rand(listingId, 'yan') * 1),     // 3-4
    arka: 3 + Math.round(rand(listingId, 'arka') * 2),   // 3-5
  }

  const catiEgimiMaxPct = 25 + Math.round(rand(listingId, 'cati') * 20) // 25-45

  // İnşaat hakkı: yüzölçümü (aplikasyon) × KAKS
  const insaatHakki = Math.round(baseSize * kaks)

  const planNotu = PLAN_NOTLARI[hashSeed(listingId) % PLAN_NOTLARI.length]
  const llmAciklama = buildLlm(profile.kullanim, maxKat, insaatHakki, ext?.vasfi ?? 'arsa')

  return {
    listingId,
    kaks,
    taks,
    maxKat,
    cekme,
    catiEgimiMaxPct,
    kullanim: profile.kullanim,
    planNotu,
    insaatHakki,
    llmAciklama,
  }
}

export const IMAR_PLANS: ReadonlyArray<ImarPlan> = LISTINGS.map((l) => buildForListing(l.id, l.size))

/** UI helper. */
export function getImarPlan(listingId: string): ImarPlan | null {
  const found = IMAR_PLANS.find((p) => p.listingId === listingId)
  return found
    ? { ...found, cekme: { ...found.cekme } }
    : null
}
