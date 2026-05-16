// Vitest: subscription.ts adapter (Wave F7.B).
//
// Spec: docs/superpowers/specs/2026-05-13-wave-f7-auth-subscription-settings-design.md §5
//
// 8 cases — initial state, upgrade flow, cancel flow, invoice append, dedupe,
// malformed payload, downgrade, history cap.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  SUBSCRIPTION_KEY,
  cancelSubscription,
  clearSubscription,
  getSubscription,
  upgradeTo,
} from '../subscription'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('subscription', () => {
  it('initial state — getSubscription returns free default when empty', () => {
    const sub = getSubscription()
    expect(sub.currentPlan).toBe('free')
    expect(sub.invoiceHistory).toEqual([])
    expect(sub.renewsAt).toBeNull()
    expect(sub.cancelledAt).toBeNull()
  })

  it('upgrade flow — upgradeTo(pro) sets plan + appends invoice', () => {
    const before = Date.now()
    const sub = upgradeTo('pro')
    expect(sub.currentPlan).toBe('pro')
    expect(sub.invoiceHistory).toHaveLength(1)
    const inv = sub.invoiceHistory[0]
    expect(inv.plan).toBe('pro')
    expect(inv.amount).toBe(29)
    expect(inv.status).toBe('paid')
    expect(inv.paidAt).toBeGreaterThanOrEqual(before)
    expect(inv.id).toMatch(/^INV-\d{4}-\d{3,}$/)
    expect(sub.renewsAt).toBeGreaterThan(before)
  })

  it('cancel flow — cancelSubscription returns to free and stamps cancelledAt', () => {
    upgradeTo('pro')
    const cancelled = cancelSubscription()
    expect(cancelled.currentPlan).toBe('free')
    expect(cancelled.cancelledAt).not.toBeNull()
    expect(cancelled.renewsAt).toBeNull()
    // invoice history is preserved on cancel
    expect(cancelled.invoiceHistory).toHaveLength(1)
  })

  it('invoice append — each upgrade adds a new invoice with monotonic seq', () => {
    const a = upgradeTo('pro')
    const b = upgradeTo('premium')
    expect(b.invoiceHistory).toHaveLength(2)
    // newest first
    expect(b.invoiceHistory[0].plan).toBe('premium')
    expect(b.invoiceHistory[0].amount).toBe(49)
    expect(b.invoiceHistory[1].plan).toBe('pro')
    // ids are unique
    expect(b.invoiceHistory[0].id).not.toBe(b.invoiceHistory[1].id)
    expect(a.invoiceHistory[0].id).toBe(b.invoiceHistory[1].id)
  })

  it('no-op upgrade — upgrading to the current plan does not append a duplicate invoice', () => {
    upgradeTo('pro')
    const second = upgradeTo('pro')
    expect(second.invoiceHistory).toHaveLength(1)
    expect(second.currentPlan).toBe('pro')
  })

  it('survives malformed payload — getSubscription returns default', () => {
    localStorage.setItem(SUBSCRIPTION_KEY, '{not json')
    const sub = getSubscription()
    expect(sub.currentPlan).toBe('free')
    expect(sub.invoiceHistory).toEqual([])
  })

  it('downgrade — pro → free is a cancel (no upgrade-style invoice for free)', () => {
    upgradeTo('pro')
    const down = upgradeTo('free')
    expect(down.currentPlan).toBe('free')
    // moving to free shouldn't create a paid invoice (price = 0)
    expect(down.invoiceHistory).toHaveLength(1)
    expect(down.invoiceHistory[0].plan).toBe('pro')
  })

  it('history cap — only the latest 12 invoices are retained', () => {
    // Toggle pro/premium 14 times → 14 invoices, but cap to 12.
    for (let i = 0; i < 7; i++) {
      upgradeTo('pro')
      upgradeTo('premium')
    }
    const sub = getSubscription()
    expect(sub.invoiceHistory.length).toBeLessThanOrEqual(12)
    expect(sub.currentPlan).toBe('premium')
  })

  it('clearSubscription removes the localStorage key', () => {
    upgradeTo('pro')
    clearSubscription()
    expect(localStorage.getItem(SUBSCRIPTION_KEY)).toBeNull()
    // and getSubscription falls back to default
    expect(getSubscription().currentPlan).toBe('free')
  })
})
