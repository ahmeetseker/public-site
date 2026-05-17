/**
 * Listing hazard skoru → kullanıcıya gösterilebilir 3'lü band.
 * `/ara` redesign'inde deprem risk band filtresi ve kart rozetleri tüketir.
 *
 * Sınırlar mockup'taki "Düşük / Orta / Yüksek" segmented'ine karşılık gelir.
 * Eşikler mevcut `HAZARD_SCORES` dağılımına kalibre edildi (LISTINGS şehirleri
 * Aydın/Balıkesir/Muğla/İzmir; skor ~[40, 100]):
 *   < 55  → 'dusuk'
 *   < 80  → 'orta'
 *   ≥ 80  → 'yuksek'
 *
 * Bilinmeyen id'ler için `null` döner (callsite'lar varsayılan band uygulayabilir).
 */
import { getHazardScore } from '../mock/hazard-scores'

export type HazardBand = 'dusuk' | 'orta' | 'yuksek'

export function getHazardBand(listingId: string): HazardBand | null {
  const score = getHazardScore(listingId)
  if (!score) return null
  const s = score.scores.deprem.skor
  if (s < 55) return 'dusuk'
  if (s < 80) return 'orta'
  return 'yuksek'
}
