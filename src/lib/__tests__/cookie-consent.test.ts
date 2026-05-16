import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EVENT_NAME,
  STORAGE_KEY,
  acceptAll,
  clearConsent,
  getConsent,
  hasDecided,
  isAllowed,
  onConsentChanged,
  rejectAll,
  setConsent,
} from '../cookie-consent'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('cookie-consent storage', () => {
  it('getConsent returns null when nothing is stored', () => {
    expect(getConsent()).toBeNull()
    expect(hasDecided()).toBe(false)
  })

  it('acceptAll persists all three categories as true with a decidedAt timestamp', () => {
    const c = acceptAll()
    expect(c.functional).toBe(true)
    expect(c.analytics).toBe(true)
    expect(c.marketing).toBe(true)
    expect(typeof c.decidedAt).toBe('string')
    expect(c.decidedAt.length).toBeGreaterThan(0)

    const stored = getConsent()
    expect(stored).not.toBeNull()
    expect(stored?.analytics).toBe(true)
    expect(hasDecided()).toBe(true)
  })

  it('rejectAll persists all categories as false but still records decidedAt', () => {
    const c = rejectAll()
    expect(c.functional).toBe(false)
    expect(c.analytics).toBe(false)
    expect(c.marketing).toBe(false)
    expect(hasDecided()).toBe(true)
    expect(isAllowed('analytics')).toBe(false)
  })

  it('setConsent merges partials with deny-by-default for unset categories', () => {
    const c = setConsent({ functional: true })
    expect(c.functional).toBe(true)
    expect(c.analytics).toBe(false)
    expect(c.marketing).toBe(false)
    expect(isAllowed('functional')).toBe(true)
    expect(isAllowed('marketing')).toBe(false)
  })

  it('rejects malformed JSON in storage (returns null, does not throw)', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(getConsent()).toBeNull()
    expect(hasDecided()).toBe(false)
  })

  it('rejects payloads with wrong shape (returns null)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ functional: 'yes', analytics: true, marketing: false }),
    )
    expect(getConsent()).toBeNull()
  })

  it('isAllowed returns false for an undecided user (KVKK deny-by-default)', () => {
    expect(isAllowed('analytics')).toBe(false)
    expect(isAllowed('functional')).toBe(false)
    expect(isAllowed('marketing')).toBe(false)
  })

  it('clearConsent removes the stored record', () => {
    acceptAll()
    expect(hasDecided()).toBe(true)
    clearConsent()
    expect(hasDecided()).toBe(false)
  })

  it('dispatches a cookie-consent:changed event with the new record', () => {
    const handler = vi.fn()
    window.addEventListener(EVENT_NAME, handler as EventListener)
    const c = acceptAll()
    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as CustomEvent
    expect(event.detail).toEqual(c)
    window.removeEventListener(EVENT_NAME, handler as EventListener)
  })

  it('onConsentChanged subscribes + unsubscribes cleanly', () => {
    const handler = vi.fn()
    const off = onConsentChanged(handler)
    setConsent({ analytics: true })
    expect(handler).toHaveBeenCalledTimes(1)
    off()
    setConsent({ analytics: false })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
