import { describe, expect, it } from 'vitest'
import { OFFICES } from '@landx/data'

import {
  dateToDayIdx,
  dayName,
  formatMinutes,
  getOfficeCoords,
  getOfficeListings,
  getOpeningHours,
  isOfficeOpenNow,
  seedAgents,
} from '../office-portfolio'

describe('getOfficeListings', () => {
  it('returns up to 6 listings for a real office id', () => {
    const id = OFFICES[0].id
    const out = getOfficeListings(id)
    expect(out.length).toBeGreaterThan(0)
    expect(out.length).toBeLessThanOrEqual(6)
  })

  it('returns only Aktif listings', () => {
    for (const office of OFFICES) {
      const out = getOfficeListings(office.id)
      expect(out.every((l) => l.status === 'Aktif')).toBe(true)
    }
  })

  it('returns deterministically — same input, same output', () => {
    const id = OFFICES[0].id
    const a = getOfficeListings(id).map((l) => l.id)
    const b = getOfficeListings(id).map((l) => l.id)
    expect(a).toEqual(b)
  })

  it('returns [] for unknown office id', () => {
    expect(getOfficeListings('does-not-exist')).toEqual([])
  })

  it('respects the limit argument', () => {
    const id = OFFICES[1].id
    expect(getOfficeListings(id, 2).length).toBeLessThanOrEqual(2)
  })
})

describe('seedAgents', () => {
  it('returns exactly 3 agents per office', () => {
    for (const office of OFFICES) {
      const agents = seedAgents(office.id)
      expect(agents).toHaveLength(3)
    }
  })

  it('rotates roles satis / kiralama / koord', () => {
    const agents = seedAgents(OFFICES[0].id)
    expect(agents.map((a) => a.role)).toEqual(['satis', 'kiralama', 'koord'])
  })

  it('is deterministic — same office id → same agents', () => {
    const a = seedAgents(OFFICES[0].id)
    const b = seedAgents(OFFICES[0].id)
    expect(a).toEqual(b)
  })

  it('produces TR-style mobile phone numbers (+90 5XX …)', () => {
    const agents = seedAgents(OFFICES[0].id)
    for (const ag of agents) {
      expect(ag.phone).toMatch(/^\+90 5\d{2} \d{3} \d{2} \d{2}$/)
    }
  })

  it('emails contain @ and the office id', () => {
    const office = OFFICES[0]
    const agents = seedAgents(office.id)
    for (const ag of agents) {
      expect(ag.email).toContain('@')
      expect(ag.email).toContain(office.id)
    }
  })

  it('avatarInitials are 1-2 uppercase letters', () => {
    const agents = seedAgents(OFFICES[0].id)
    for (const ag of agents) {
      expect(ag.avatarInitials).toMatch(/^[A-ZÇĞİÖŞÜ]{1,2}$/)
    }
  })
})

describe('getOpeningHours', () => {
  it('returns 7 days, Monday-first', () => {
    const grid = getOpeningHours(OFFICES[0].id)
    expect(grid).toHaveLength(7)
    expect(grid.map((g) => g.dayIdx)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('Pzt-Cum (0..4) always have open + close minutes', () => {
    const grid = getOpeningHours(OFFICES[0].id)
    for (let i = 0; i <= 4; i++) {
      expect(grid[i].openMin).toBeGreaterThan(0)
      expect(grid[i].closeMin).toBeGreaterThan(grid[i].openMin!)
    }
  })

  it('Cumartesi (5) is always open with morning start', () => {
    const grid = getOpeningHours(OFFICES[0].id)
    expect(grid[5].openMin).toBe(10 * 60)
    expect(grid[5].closeMin).toBeGreaterThan(grid[5].openMin!)
  })

  it('is deterministic — same id → same grid', () => {
    const a = getOpeningHours(OFFICES[0].id)
    const b = getOpeningHours(OFFICES[0].id)
    expect(a).toEqual(b)
  })

  it('different office ids may diverge (broad smoke check)', () => {
    const distinctEncodings = new Set(
      OFFICES.map((o) => JSON.stringify(getOpeningHours(o.id))),
    )
    // At least 2 different grids across all offices
    expect(distinctEncodings.size).toBeGreaterThanOrEqual(2)
  })
})

describe('isOfficeOpenNow', () => {
  it('returns false at 03:00 on a Sunday for any office', () => {
    const sundayNight = new Date('2026-05-17T03:00:00Z')
    // Sunday in UTC; on the box this maps to Sun morning regardless of TZ.
    // dateToDayIdx will say 6 (Sun) for both UTC and TR (+3) for this hour.
    for (const office of OFFICES) {
      expect(isOfficeOpenNow(office.id, sundayNight)).toBe(false)
    }
  })

  it('returns true at 12:00 on a Wednesday for any office', () => {
    // Wed midday — Pzt-Cum baseline 09-18 always covers it (even with +1.5h shift).
    const wedNoon = new Date('2026-05-13T12:00:00')
    expect(dateToDayIdx(wedNoon)).toBe(2)
    for (const office of OFFICES) {
      expect(isOfficeOpenNow(office.id, wedNoon)).toBe(true)
    }
  })

  it('is pure — same inputs → same output', () => {
    const fixed = new Date('2026-05-13T12:00:00')
    expect(isOfficeOpenNow(OFFICES[0].id, fixed)).toBe(
      isOfficeOpenNow(OFFICES[0].id, fixed),
    )
  })
})

describe('dayName + formatMinutes + dateToDayIdx', () => {
  it('dayName returns localised abbreviation', () => {
    expect(dayName(0, 'tr')).toBe('Pzt')
    expect(dayName(6, 'tr')).toBe('Paz')
    expect(dayName(0, 'en')).toBe('Mon')
    expect(dayName(6, 'en')).toBe('Sun')
  })

  it('formatMinutes prints HH:MM', () => {
    expect(formatMinutes(0)).toBe('00:00')
    expect(formatMinutes(9 * 60)).toBe('09:00')
    expect(formatMinutes(18 * 60 + 30)).toBe('18:30')
  })

  it('dateToDayIdx maps Sunday(0) → 6 and Monday(1) → 0', () => {
    expect(dateToDayIdx(new Date('2026-05-11T10:00:00'))).toBe(0) // Mon
    expect(dateToDayIdx(new Date('2026-05-17T10:00:00'))).toBe(6) // Sun
  })
})

describe('getOfficeCoords', () => {
  it('returns lat/lng for a real office', () => {
    const coords = getOfficeCoords(OFFICES[0].id)
    expect(coords).not.toBeNull()
    expect(typeof coords!.lat).toBe('number')
    expect(typeof coords!.lng).toBe('number')
  })

  it('returns null for an unknown office', () => {
    expect(getOfficeCoords('does-not-exist')).toBeNull()
  })
})
