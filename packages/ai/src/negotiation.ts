/**
 * F37 Faz 4.0 — AI müzakere koçu (mock).
 */

export interface NegotiationInput {
  listingId: string
  listedPrice: number
  avmExpected: number
}

export type NegotiationBand = 'bargain' | 'fair' | 'overpriced'

export interface NegotiationAdvice {
  listingId: string
  listedPrice: number
  avmExpected: number
  deltaPct: number
  band: NegotiationBand
  suggestedOffer: number
  rationale: string[]
}

export function computeNegotiationAdvice(input: NegotiationInput): NegotiationAdvice {
  const { listingId, listedPrice, avmExpected } = input
  const deltaPct = ((listedPrice - avmExpected) / avmExpected) * 100

  let band: NegotiationBand
  if (deltaPct > 5) band = 'overpriced'
  else if (deltaPct < -5) band = 'bargain'
  else band = 'fair'

  let suggestedOffer: number
  const rationale: string[] = []

  if (band === 'overpriced') {
    suggestedOffer = Math.round(avmExpected * 1.03)
    rationale.push(`İlan fiyatı AVM tahmininin %${deltaPct.toFixed(1)} üzerinde.`)
    rationale.push(`AVM aralığının üst sınırı yakın bir teklif uygun.`)
    rationale.push(`Bölge fiyat ortalaması son 12 ayda %2-4 büyüdü; %${deltaPct.toFixed(0)} prim yüksek.`)
  } else if (band === 'bargain') {
    suggestedOffer = Math.round(listedPrice * 0.98)
    rationale.push(`İlan fiyatı AVM tahmininin %${Math.abs(deltaPct).toFixed(1)} altında.`)
    rationale.push(`Pazarlık marjı dar — hızlı kapatma için yakın teklif önerilir.`)
  } else {
    suggestedOffer = Math.round(listedPrice * 0.98)
    rationale.push(`İlan fiyatı AVM tahminine yakın (%${deltaPct.toFixed(1)} sapma).`)
    rationale.push(`Klasik pazarlık marjı (%2-3) önerilir.`)
  }

  return {
    listingId,
    listedPrice,
    avmExpected,
    deltaPct: Math.round(deltaPct * 10) / 10,
    band,
    suggestedOffer,
    rationale,
  }
}
