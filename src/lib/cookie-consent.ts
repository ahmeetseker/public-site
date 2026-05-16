// Cookie consent storage + event bus — Wave F13.D.
//
// Contract
//   Storage key: arsam.cookie-consent.v1
//   Shape:
//     {
//       functional: boolean    // navigation memory, theme, language pref
//       analytics:  boolean    // web-vitals, page views
//       marketing:  boolean    // outbound campaigns (future-proof; no consumers today)
//       decidedAt:  string     // ISO timestamp — presence = decision was made
//     }
//
// A null/undefined record (or a record without `decidedAt`) means the user has
// not yet decided; UI must show the banner.
//
// Consumers subscribe to the global `cookie-consent:changed` CustomEvent on
// `window` (detail = full CookieConsent record). The web-vitals init script in
// RootLayout.astro reads `analytics` to gate registration.
//
// All API is SSR-safe — every call checks `typeof window`/`typeof localStorage`
// before touching browser globals.

export const STORAGE_KEY = 'arsam.cookie-consent.v1'
export const EVENT_NAME = 'cookie-consent:changed'

export interface CookieConsent {
  functional: boolean
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

export type ConsentCategory = 'functional' | 'analytics' | 'marketing'

function safeStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function isConsent(v: unknown): v is CookieConsent {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.functional === 'boolean' &&
    typeof o.analytics === 'boolean' &&
    typeof o.marketing === 'boolean' &&
    typeof o.decidedAt === 'string' &&
    o.decidedAt.length > 0
  )
}

/**
 * Read the persisted consent record. Returns `null` when nothing valid is
 * stored (i.e. the user has not yet decided).
 */
export function getConsent(): CookieConsent | null {
  const ls = safeStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Whether the user has made a decision. False ⇒ banner must be shown.
 */
export function hasDecided(): boolean {
  return getConsent() !== null
}

/**
 * Persist a consent record, then dispatch a `cookie-consent:changed` event.
 * `decidedAt` is filled in automatically when not provided.
 */
export function setConsent(
  partial: Partial<Omit<CookieConsent, 'decidedAt'>> & { decidedAt?: string },
): CookieConsent {
  const next: CookieConsent = {
    functional: partial.functional ?? false,
    analytics: partial.analytics ?? false,
    marketing: partial.marketing ?? false,
    decidedAt: partial.decidedAt ?? new Date().toISOString(),
  }
  const ls = safeStorage()
  if (ls) {
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // private mode / quota — fall through and still dispatch the event.
    }
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }))
    } catch {
      // Older test envs without CustomEvent — silent.
    }
  }
  return next
}

/** Convenience: "Tümünü kabul et" — all three categories true. */
export function acceptAll(): CookieConsent {
  return setConsent({ functional: true, analytics: true, marketing: true })
}

/** Convenience: "Sadece zorunlu" — all categories false (only strict cookies). */
export function rejectAll(): CookieConsent {
  return setConsent({ functional: false, analytics: false, marketing: false })
}

/**
 * Clear the stored consent. Primarily a test helper; could also back a future
 * "Tercihleri sıfırla" affordance on the cookie policy page.
 */
export function clearConsent(): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    ls.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Check whether a given category is currently allowed. Undecided ⇒ false
 * (deny-by-default — matches KVKK / GDPR baseline).
 */
export function isAllowed(category: ConsentCategory): boolean {
  const c = getConsent()
  if (!c) return false
  return c[category] === true
}

/**
 * Subscribe to consent changes. Returns an unsubscribe function. SSR-safe:
 * subscribing on the server is a no-op that returns a no-op unsubscriber.
 */
export function onConsentChanged(
  handler: (consent: CookieConsent) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<CookieConsent>).detail
    if (isConsent(detail)) handler(detail)
  }
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
