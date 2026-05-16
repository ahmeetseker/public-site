/**
 * TKGM şerh kayıtları seed — Wave F37 / Faz 1.
 *
 * Mockup E bölümü ("hukuki şerh paneli, 3 renk: temiz/dikkat/kritik").
 * Her listing için 3-7 entry üretir:
 *   - ~80% temiz (yeşil)
 *   - ~15% dikkat (kehribar)
 *   - ~5% kritik (kırmızı)
 *
 * Tipler ve hukuki referanslar TR mevzuatından (5403/2942/4721/3194).
 * Üretim deterministik (`hash(listingId + idx)`).
 */

import { LISTINGS } from './listings'
import type { Encumbrance, EncumbranceCategory } from '../types/listing-detail'

interface EncumbranceTemplate {
  category: EncumbranceCategory
  type: string
  description: string
  legalReference?: string
}

const TEMIZ_TEMPLATES: readonly EncumbranceTemplate[] = [
  {
    category: 'temiz',
    type: 'ipotek_yok',
    description: 'Tapu üzerinde ipotek kaydı bulunmamaktadır.',
    legalReference: '4721 sayılı Türk Medeni Kanunu m.881',
  },
  {
    category: 'temiz',
    type: 'haciz_yok',
    description: 'Tapu üzerinde haciz şerhi bulunmamaktadır.',
    legalReference: '2004 sayılı İcra ve İflas Kanunu m.85',
  },
  {
    category: 'temiz',
    type: 'kamulasturma_yok',
    description: 'Aktif veya beklenen kamulaştırma kararı bulunmamaktadır.',
    legalReference: '2942 sayılı Kamulaştırma Kanunu',
  },
  {
    category: 'temiz',
    type: 'davalik_degil',
    description: 'Mülkiyet ile ilgili açılmış dava kaydı yoktur.',
  },
  {
    category: 'temiz',
    type: 'sit_disi',
    description: 'Parsel SİT alanı sınırları dışındadır.',
    legalReference: '2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu',
  },
  {
    category: 'temiz',
    type: 'orman_disi',
    description: 'Parsel orman vasıflı arazi dışındadır (2/B kapsamında değildir).',
    legalReference: '6831 sayılı Orman Kanunu',
  },
]

const DIKKAT_TEMPLATES: readonly EncumbranceTemplate[] = [
  {
    category: 'dikkat',
    type: 'gecit_hakki',
    description: 'Komşu parsel lehine geçit hakkı şerhi mevcut (5 m genişlik).',
    legalReference: '4721 sayılı TMK m.747',
  },
  {
    category: 'dikkat',
    type: 'irtifak_hakki',
    description: 'Tedaş lehine elektrik direği irtifakı (2 adet, parselin kuzey ucunda).',
    legalReference: '3194 sayılı İmar Kanunu',
  },
  {
    category: 'dikkat',
    type: 'tarimsal_serh',
    description: 'Tarımsal niteliği korunmuş arazi şerhi — kullanım sınırlı.',
    legalReference: '5403 sayılı Toprak Koruma Kanunu',
  },
  {
    category: 'dikkat',
    type: 'kiyi_kenar',
    description: 'Kıyı kenar çizgisine yakın — Yapı yasaklı bant 50 m geri çekilmiştir.',
    legalReference: '3621 sayılı Kıyı Kanunu',
  },
  {
    category: 'dikkat',
    type: 'imar_uyusmazligi',
    description: 'Belediye imar planı revizyonu süreci askıda — onay bekleniyor.',
    legalReference: '3194 sayılı İmar Kanunu m.8',
  },
]

const KRITIK_TEMPLATES: readonly EncumbranceTemplate[] = [
  {
    category: 'kritik',
    type: 'haciz',
    description: '1. derece haciz: Garanti BBVA lehine 850.000 TL alacak.',
    legalReference: '2004 sayılı İİK m.78',
  },
  {
    category: 'kritik',
    type: 'kamulasturma_kararı',
    description: 'Karayolları Genel Müdürlüğü kamulaştırma kararı (Ekim 2025).',
    legalReference: '2942 sayılı Kamulaştırma Kanunu m.7',
  },
  {
    category: 'kritik',
    type: 'ipotek_aktif',
    description: 'Akbank lehine 1.4M TL aktif ipotek (sıra 1).',
    legalReference: '4721 sayılı TMK m.881',
  },
]

function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function rand(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

/** Son 12 ay içinde deterministik tarih. */
function recentIso(seed: string, salt: string): string {
  const d = new Date('2026-05-01T10:00:00.000Z')
  const daysAgo = Math.floor(rand(seed, salt) * 365)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

function buildForListing(listingId: string): Encumbrance[] {
  const out: Encumbrance[] = []
  // Hep en az 3 temiz ekle (UI 3-grup gösterimi için)
  const temizCount = 3 + Math.floor(rand(listingId, 'tc') * 2) // 3-4
  const temizPicks = TEMIZ_TEMPLATES.slice()
    .sort((a, b) => hashSeed(`${listingId}-${a.type}`) - hashSeed(`${listingId}-${b.type}`))
    .slice(0, temizCount)
  for (const tpl of temizPicks) {
    out.push({
      id: `enc-${listingId}-${tpl.type}`,
      listingId,
      category: tpl.category,
      type: tpl.type,
      description: tpl.description,
      legalReference: tpl.legalReference,
      verifiedAt: recentIso(listingId, `t-${tpl.type}`),
    })
  }

  // Dikkat: %35 olasılıkla 1-2 ekle
  if (rand(listingId, 'dikkatProb') < 0.35) {
    const dikkatCount = 1 + Math.floor(rand(listingId, 'dc') * 2) // 1-2
    const dikkatPicks = DIKKAT_TEMPLATES.slice()
      .sort((a, b) => hashSeed(`${listingId}-d-${a.type}`) - hashSeed(`${listingId}-d-${b.type}`))
      .slice(0, dikkatCount)
    for (const tpl of dikkatPicks) {
      out.push({
        id: `enc-${listingId}-${tpl.type}`,
        listingId,
        category: tpl.category,
        type: tpl.type,
        description: tpl.description,
        legalReference: tpl.legalReference,
        verifiedAt: recentIso(listingId, `d-${tpl.type}`),
      })
    }
  }

  // Kritik: %8 olasılıkla 1 ekle
  if (rand(listingId, 'kritikProb') < 0.08) {
    const idx = Math.floor(rand(listingId, 'ki') * KRITIK_TEMPLATES.length)
    const tpl = KRITIK_TEMPLATES[idx]
    out.push({
      id: `enc-${listingId}-${tpl.type}`,
      listingId,
      category: tpl.category,
      type: tpl.type,
      description: tpl.description,
      legalReference: tpl.legalReference,
      verifiedAt: recentIso(listingId, `k-${tpl.type}`),
    })
  }

  return out
}

export const TKGM_ENCUMBRANCES: ReadonlyArray<Encumbrance> = LISTINGS.flatMap((l) =>
  buildForListing(l.id),
)

/** UI helper: kategori sıralı liste (temiz → dikkat → kritik). */
export function getEncumbrancesForListing(listingId: string): Encumbrance[] {
  const order: Record<EncumbranceCategory, number> = { temiz: 0, dikkat: 1, kritik: 2 }
  return TKGM_ENCUMBRANCES.filter((e) => e.listingId === listingId)
    .map((e) => ({ ...e }))
    .sort((a, b) => order[a.category] - order[b.category])
}
