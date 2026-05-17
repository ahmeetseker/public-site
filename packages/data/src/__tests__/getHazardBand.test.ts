import { describe, it, expect } from 'vitest'
import { getHazardBand } from '../lib/getHazardBand'
import { HAZARD_SCORES } from '../mock/hazard-scores'

describe('getHazardBand', () => {
  it('skor < 55 → "dusuk"', () => {
    const lowProfile = HAZARD_SCORES.find((h) => h.scores.deprem.skor < 55)
    expect(lowProfile).toBeTruthy()
    expect(getHazardBand(lowProfile!.listingId)).toBe('dusuk')
  })

  it('55 ≤ skor < 80 → "orta"', () => {
    const mid = HAZARD_SCORES.find(
      (h) => h.scores.deprem.skor >= 55 && h.scores.deprem.skor < 80,
    )
    expect(mid).toBeTruthy()
    expect(getHazardBand(mid!.listingId)).toBe('orta')
  })

  it('skor ≥ 80 → "yuksek"', () => {
    const high = HAZARD_SCORES.find((h) => h.scores.deprem.skor >= 80)
    expect(high).toBeTruthy()
    expect(getHazardBand(high!.listingId)).toBe('yuksek')
  })

  it('bilinmeyen id → null', () => {
    expect(getHazardBand('NON.EX.0001')).toBeNull()
  })

  it('saf fonksiyon — aynı input için aynı output', () => {
    const id = HAZARD_SCORES[0]!.listingId
    expect(getHazardBand(id)).toBe(getHazardBand(id))
  })
})
