// Newsletter subscription helpers — Wave F8.D.
//
// localStorage-backed (single subscription per browser). The footer
// NewsletterForm + the 10s SignupModal both call `subscribe(email)`; the
// /abonelik-onay landing page (TR + EN) calls `confirmSubscription()` or
// `unsubscribe()` based on URL params.
//
// All API is SSR-safe — every call defensively handles
// `typeof localStorage === 'undefined'` and malformed JSON payloads.
//
// Keys
//   arsam.newsletter.v1            → Subscription record
//   arsam.newsletter-modal-seen.v1 → boolean (string '1') marker preventing
//                                    the SignupModal from re-appearing once
//                                    it has been dismissed or submitted.

export const STORAGE_KEY = 'arsam.newsletter.v1'
export const MODAL_SEEN_KEY = 'arsam.newsletter-modal-seen.v1'

export type SubscriptionStatus = 'pending' | 'confirmed' | 'unsubscribed'

export interface Subscription {
  email: string
  status: SubscriptionStatus
  subscribedAt: number
  confirmedAt?: number
  unsubscribedAt?: number
}

// RFC-lite — same regex VirtualTourPlaceholder ships with so both forms
// validate emails consistently.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function isSubscription(v: unknown): v is Subscription {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.email !== 'string' || !o.email) return false
  if (typeof o.subscribedAt !== 'number') return false
  if (o.status !== 'pending' && o.status !== 'confirmed' && o.status !== 'unsubscribed') {
    return false
  }
  if (o.confirmedAt !== undefined && typeof o.confirmedAt !== 'number') return false
  if (o.unsubscribedAt !== undefined && typeof o.unsubscribedAt !== 'number') return false
  return true
}

function read(): Subscription | null {
  const ls = safeStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isSubscription(parsed) ? parsed : null
  } catch {
    return null
  }
}

function write(sub: Subscription | null): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    if (sub === null) {
      ls.removeItem(STORAGE_KEY)
    } else {
      ls.setItem(STORAGE_KEY, JSON.stringify(sub))
    }
  } catch {
    /* quota — ignore */
  }
}

/** Returns the current subscription record, or null if none. */
export function getSubscription(): Subscription | null {
  return read()
}

/**
 * Build the deterministic mock confirmation token for an email.
 * Used to reproduce the "click the link in your email" flow client-side.
 */
export function mockToken(email: string): string {
  const normalized = email.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return `mock-${hash.toString(36)}`
}

export interface SubscribeResult {
  ok: boolean
  reason?: 'invalid-email' | 'already-subscribed'
  subscription?: Subscription
  token?: string
}

/**
 * Register a (mock) subscription. Re-subscribing the same email returns
 * the existing record with `reason: 'already-subscribed'` if status is still
 * pending or confirmed. Re-subscribing after a previous `unsubscribed`
 * resets status to `pending`.
 */
export function subscribe(email: string): SubscribeResult {
  const value = email.trim().toLowerCase()
  if (!EMAIL_RE.test(value)) return { ok: false, reason: 'invalid-email' }

  const existing = read()
  if (existing && existing.email === value && existing.status !== 'unsubscribed') {
    return {
      ok: true,
      reason: 'already-subscribed',
      subscription: existing,
      token: mockToken(value),
    }
  }

  const next: Subscription = {
    email: value,
    status: 'pending',
    subscribedAt: Date.now(),
  }
  write(next)
  return { ok: true, subscription: next, token: mockToken(value) }
}

/** Move the current subscription to `confirmed`. No-op if none exists. */
export function confirmSubscription(): Subscription | null {
  const current = read()
  if (!current) return null
  if (current.status === 'confirmed') return current
  const next: Subscription = {
    ...current,
    status: 'confirmed',
    confirmedAt: Date.now(),
  }
  write(next)
  return next
}

/** Mark current subscription as unsubscribed. */
export function unsubscribe(): Subscription | null {
  const current = read()
  if (!current) return null
  const next: Subscription = {
    ...current,
    status: 'unsubscribed',
    unsubscribedAt: Date.now(),
  }
  write(next)
  return next
}

/** Reset newsletter state (test helper). */
export function clearSubscription(): void {
  write(null)
}

/* ------------------------------------------------------------------ */
/* Modal-seen flag                                                      */
/* ------------------------------------------------------------------ */

export function isModalSeen(): boolean {
  const ls = safeStorage()
  if (!ls) return false
  try {
    return ls.getItem(MODAL_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markModalSeen(): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    ls.setItem(MODAL_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearModalSeen(): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    ls.removeItem(MODAL_SEEN_KEY)
  } catch {
    /* ignore */
  }
}
