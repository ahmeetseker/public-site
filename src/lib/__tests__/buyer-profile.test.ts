// Vitest: buyer-profile.ts adapter (Wave F5.A).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BUYER_PROFILE_KEY,
  clearBuyerProfile,
  getBuyerProfile,
  updateBuyerProfile,
} from '../buyer-profile'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('buyer-profile', () => {
  it('returns null when empty', () => {
    expect(getBuyerProfile()).toBeNull()
  })

  it('update creates a new profile with updatedAt', () => {
    const p = updateBuyerProfile({
      name: 'Ada',
      email: 'ada@example.com',
      phone: '+905551234567',
    })
    expect(p?.name).toBe('Ada')
    expect(p?.email).toBe('ada@example.com')
    expect(p?.phone).toBe('+905551234567')
    expect(p?.updatedAt).toBeGreaterThan(0)
  })

  it('partial update preserves other fields', () => {
    updateBuyerProfile({ name: 'Ada', email: 'a@e.com', phone: '+90' })
    const p = updateBuyerProfile({ phone: '+905550000000' })
    expect(p?.name).toBe('Ada')
    expect(p?.email).toBe('a@e.com')
    expect(p?.phone).toBe('+905550000000')
  })

  it('survives malformed payload', () => {
    localStorage.setItem(BUYER_PROFILE_KEY, '{bad')
    expect(getBuyerProfile()).toBeNull()
  })

  it('clear empties storage', () => {
    updateBuyerProfile({ name: 'X', email: '', phone: '' })
    clearBuyerProfile()
    expect(getBuyerProfile()).toBeNull()
  })
})
