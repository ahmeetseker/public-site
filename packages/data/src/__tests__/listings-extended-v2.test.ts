import { describe, it, expect } from 'vitest'
import { LISTINGS_V2 } from '../mock/listings-extended-v2'
import { LISTINGS as BASE_LISTINGS } from '../mock/listings'

describe('LISTINGS_V2 seed integrity', () => {
  it('total length = base + 30', () => {
    expect(LISTINGS_V2.length).toBe(BASE_LISTINGS.length + 30)
  })

  it('her ID unique', () => {
    const ids = new Set(LISTINGS_V2.map((l) => l.id))
    expect(ids.size).toBe(LISTINGS_V2.length)
  })

  it('her listing valid lat/lng', () => {
    for (const l of LISTINGS_V2) {
      expect(typeof l.lat).toBe('number')
      expect(typeof l.lng).toBe('number')
      expect(Number.isFinite(l.lat)).toBe(true)
      expect(Number.isFinite(l.lng)).toBe(true)
    }
  })

  it('category alanı her listing\'de var (legacy arsa enriched)', () => {
    for (const l of LISTINGS_V2) {
      expect(l.category).toBeDefined()
      expect(['arsa', 'konut', 'villa', 'isyeri']).toContain(l.category)
    }
  })

  it('konut/villa için rooms alanı tanımlı', () => {
    const houses = LISTINGS_V2.filter((l) => l.category === 'konut' || l.category === 'villa')
    expect(houses.length).toBeGreaterThan(0)
    for (const h of houses) {
      expect(h.rooms).toBeDefined()
    }
  })

  it('işyeri için netSize tanımlı', () => {
    const commercial = LISTINGS_V2.filter((l) => l.category === 'isyeri')
    expect(commercial.length).toBe(10)
    for (const c of commercial) {
      expect(c.netSize).toBeDefined()
    }
  })

  it('konut listing sayısı = 10', () => {
    expect(LISTINGS_V2.filter((l) => l.category === 'konut').length).toBe(10)
  })

  it('villa listing sayısı = 10', () => {
    expect(LISTINGS_V2.filter((l) => l.category === 'villa').length).toBe(10)
  })
})
