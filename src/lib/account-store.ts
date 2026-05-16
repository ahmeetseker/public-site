/**
 * account-store — SSR-safe localStorage wrapper for /hesabim/* buyer area.
 *
 * Wave F3 / Agent-F3E.
 *
 * The public-site is a static SSG build (no backend per-user state). The
 * /hesabim/* React islands therefore persist buyer-side state entirely in
 * localStorage. Three independent stores live under sibling keys so they can
 * be cleared or migrated separately:
 *
 *   arsam.favorites.v1     — string[] of listing ids (favorited by the user)
 *   arsam.savedSearches.v1 — SavedSearchEntry[] (query + filters + savedAt)
 *   arsam.profile.v1       — BuyerProfileLocal (form fields + preferences)
 *
 * Every mutation emits a custom window event so multiple islands on the same
 * page (e.g. AccountStats + FavoritesList) stay in sync without a global
 * store. Components subscribe via the corresponding EVENT_* constants.
 *
 * All exports are guarded with `typeof window !== 'undefined'` so the module
 * is safe to import from an SSR-rendered island (initial render returns the
 * empty/default value; effect-level read populates real state).
 */

export const FAVORITES_KEY = 'arsam.favorites.v1'
export const SAVED_SEARCHES_KEY = 'arsam.savedSearches.v1'
export const PROFILE_KEY = 'arsam.profile.v1'

export const EVENT_FAVORITES_CHANGED = 'arsam:favorites-changed'
export const EVENT_SAVED_SEARCHES_CHANGED = 'arsam:saved-searches-changed'
export const EVENT_PROFILE_CHANGED = 'arsam:profile-changed'

export interface SavedSearchEntry {
  /** Stable client-side id (timestamp-based). */
  id: string
  /** Free-text query (q=). */
  q: string
  /** Filter snapshot (tip, il, ilce, priceMin, priceMax, ...). */
  filters: Record<string, string | number>
  /** ISO timestamp of save. */
  savedAt: string
  /** Optional human label; falls back to q + filter summary. */
  label?: string
}

export type ContactPref = 'email' | 'phone' | 'whatsapp'

export interface BuyerProfileLocal {
  name: string
  phone: string
  email: string
  contactPref: ContactPref
  regions: string[]
}

export const EMPTY_PROFILE: BuyerProfileLocal = {
  name: '',
  phone: '',
  email: '',
  contactPref: 'email',
  regions: [],
}

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function readJSON<T>(key: string, fallback: T): T {
  const w = safeWindow()
  if (!w) return fallback
  try {
    const raw = w.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown, event: string): void {
  const w = safeWindow()
  if (!w) return
  try {
    w.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private-mode — swallow silently */
  }
  try {
    w.dispatchEvent(new CustomEvent(event, { detail: value }))
  } catch {
    /* CustomEvent unsupported — ignore */
  }
}

// ─────────────────────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────────────────────

export function getFavorites(): string[] {
  const raw = readJSON<unknown>(FAVORITES_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string')
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}

export function addFavorite(id: string): void {
  const current = getFavorites()
  if (current.includes(id)) return
  writeJSON(FAVORITES_KEY, [...current, id], EVENT_FAVORITES_CHANGED)
}

export function removeFavorite(id: string): void {
  const current = getFavorites()
  const next = current.filter((v) => v !== id)
  if (next.length === current.length) return
  writeJSON(FAVORITES_KEY, next, EVENT_FAVORITES_CHANGED)
}

export function toggleFavorite(id: string): boolean {
  const current = getFavorites()
  if (current.includes(id)) {
    writeJSON(FAVORITES_KEY, current.filter((v) => v !== id), EVENT_FAVORITES_CHANGED)
    return false
  }
  writeJSON(FAVORITES_KEY, [...current, id], EVENT_FAVORITES_CHANGED)
  return true
}

// ─────────────────────────────────────────────────────────────
// SAVED SEARCHES
// ─────────────────────────────────────────────────────────────

export function getSavedSearches(): SavedSearchEntry[] {
  const raw = readJSON<unknown>(SAVED_SEARCHES_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is SavedSearchEntry => {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return typeof o.id === 'string' && typeof o.savedAt === 'string'
  })
}

export function saveSearch(entry: Omit<SavedSearchEntry, 'id' | 'savedAt'> & { id?: string; savedAt?: string }): SavedSearchEntry {
  const current = getSavedSearches()
  const full: SavedSearchEntry = {
    id: entry.id ?? `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    q: entry.q ?? '',
    filters: entry.filters ?? {},
    savedAt: entry.savedAt ?? new Date().toISOString(),
    label: entry.label,
  }
  writeJSON(SAVED_SEARCHES_KEY, [...current, full], EVENT_SAVED_SEARCHES_CHANGED)
  return full
}

export function removeSearch(id: string): void {
  const current = getSavedSearches()
  const next = current.filter((s) => s.id !== id)
  if (next.length === current.length) return
  writeJSON(SAVED_SEARCHES_KEY, next, EVENT_SAVED_SEARCHES_CHANGED)
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export function getProfile(): BuyerProfileLocal {
  const raw = readJSON<unknown>(PROFILE_KEY, EMPTY_PROFILE)
  if (!raw || typeof raw !== 'object') return EMPTY_PROFILE
  const o = raw as Partial<BuyerProfileLocal>
  return {
    name: typeof o.name === 'string' ? o.name : '',
    phone: typeof o.phone === 'string' ? o.phone : '',
    email: typeof o.email === 'string' ? o.email : '',
    contactPref:
      o.contactPref === 'phone' || o.contactPref === 'whatsapp' ? o.contactPref : 'email',
    regions: Array.isArray(o.regions) ? o.regions.filter((r): r is string => typeof r === 'string') : [],
  }
}

export function saveProfile(profile: BuyerProfileLocal): void {
  writeJSON(PROFILE_KEY, profile, EVENT_PROFILE_CHANGED)
}

/**
 * Completion percent across the 5 tracked fields. Each non-empty field
 * contributes 20%. `regions` counts if at least 1 entry is selected.
 */
export function profileCompletionPercent(profile: BuyerProfileLocal): number {
  let filled = 0
  if (profile.name.trim()) filled++
  if (profile.phone.trim()) filled++
  if (profile.email.trim()) filled++
  if (profile.contactPref) filled++
  if (profile.regions.length > 0) filled++
  return Math.round((filled / 5) * 100)
}

// ─────────────────────────────────────────────────────────────
// CLEAR ALL (account delete)
// ─────────────────────────────────────────────────────────────

export function clearAll(): void {
  const w = safeWindow()
  if (!w) return
  try {
    w.localStorage.removeItem(FAVORITES_KEY)
    w.localStorage.removeItem(SAVED_SEARCHES_KEY)
    w.localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* ignore */
  }
  try {
    w.dispatchEvent(new CustomEvent(EVENT_FAVORITES_CHANGED, { detail: [] }))
    w.dispatchEvent(new CustomEvent(EVENT_SAVED_SEARCHES_CHANGED, { detail: [] }))
    w.dispatchEvent(new CustomEvent(EVENT_PROFILE_CHANGED, { detail: EMPTY_PROFILE }))
  } catch {
    /* ignore */
  }
}
