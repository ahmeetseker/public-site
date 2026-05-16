import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  MODAL_SEEN_KEY,
  clearSubscription,
  clearModalSeen,
  confirmSubscription,
  getSubscription,
  isModalSeen,
  markModalSeen,
  mockToken,
  subscribe,
  unsubscribe,
} from '../newsletter'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('newsletter storage', () => {
  it('getSubscription returns null when nothing is stored', () => {
    expect(getSubscription()).toBeNull()
  })

  it('subscribe writes a pending subscription with normalized email + mock token', () => {
    const result = subscribe(' Ahmet@arsam.NET ')
    expect(result.ok).toBe(true)
    expect(result.reason).toBeUndefined()
    expect(result.subscription?.email).toBe('ahmet@arsam.net')
    expect(result.subscription?.status).toBe('pending')
    expect(result.token).toBe(mockToken('ahmet@arsam.net'))
    const stored = getSubscription()
    expect(stored?.email).toBe('ahmet@arsam.net')
    expect(stored?.status).toBe('pending')
  })

  it('subscribe rejects malformed emails and writes nothing', () => {
    const bad = subscribe('not-an-email')
    expect(bad.ok).toBe(false)
    expect(bad.reason).toBe('invalid-email')
    expect(getSubscription()).toBeNull()
  })

  it('dedupes when resubscribing with a pending/confirmed record', () => {
    subscribe('a@arsam.net')
    const again = subscribe('a@arsam.net')
    expect(again.ok).toBe(true)
    expect(again.reason).toBe('already-subscribed')
    expect(again.subscription?.status).toBe('pending')
  })

  it('confirmSubscription flips status to confirmed and stamps confirmedAt', () => {
    subscribe('b@arsam.net')
    const confirmed = confirmSubscription()
    expect(confirmed?.status).toBe('confirmed')
    expect(typeof confirmed?.confirmedAt).toBe('number')
    expect(getSubscription()?.status).toBe('confirmed')
  })

  it('unsubscribe flips status to unsubscribed; clearSubscription removes the record', () => {
    subscribe('c@arsam.net')
    const off = unsubscribe()
    expect(off?.status).toBe('unsubscribed')
    expect(typeof off?.unsubscribedAt).toBe('number')
    clearSubscription()
    expect(getSubscription()).toBeNull()
  })

  it('survives a malformed localStorage payload (returns null + can resubscribe)', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(getSubscription()).toBeNull()
    const fresh = subscribe('d@arsam.net')
    expect(fresh.ok).toBe(true)
    expect(getSubscription()?.email).toBe('d@arsam.net')
  })

  it('modal-seen flag round-trips and can be cleared', () => {
    expect(isModalSeen()).toBe(false)
    markModalSeen()
    expect(isModalSeen()).toBe(true)
    expect(localStorage.getItem(MODAL_SEEN_KEY)).toBe('1')
    clearModalSeen()
    expect(isModalSeen()).toBe(false)
  })
})
