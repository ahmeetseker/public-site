/**
 * Generic localStorage CRUD adapter — Wave F32 / Faz 1.
 *
 * Backs the new arsam-parity CRUD pages (billing, trust, identity, content)
 * with a frontend-only persistence layer. Each domain gets its own store via
 * `createLocalStore<T>(domain, seed)`.
 *
 * Constraints:
 * - SSR-safe: every method short-circuits when `window` is undefined so the
 *   Astro public-site build doesn't blow up. `list()` returns the seed,
 *   `subscribe()` is a no-op on the server.
 * - Cross-tab sync: `window.addEventListener('storage', ...)` fans out to
 *   subscribers when another tab mutates the same key.
 * - Storage key format: `landx:v1:<domain>` (e.g. `landx:v1:billing.payments`).
 * - JSON parse failures fall back to the seed (defensive against corrupted
 *   LS state from older builds).
 */

const KEY_PREFIX = 'landx:v1:'

export interface LocalStore<T extends { id: string }> {
  /** Returns a defensive shallow clone of the current dataset. */
  list: () => T[]
  /** Returns a single record by id, or `null` if not found. */
  get: (id: string) => T | null
  /** Inserts a new record (auto-assigns `id` via `crypto.randomUUID` or fallback). */
  create: (input: Omit<T, 'id'>) => T
  /** Patches a record. Returns the merged record, or `null` if id is missing. */
  update: (id: string, patch: Partial<T>) => T | null
  /** Removes a record by id. No-op when id is missing. */
  remove: (id: string) => void
  /** Re-seeds the store from the original seed array. Useful for tests + dev. */
  reset: () => void
  /**
   * Subscribes to storage changes (cross-tab + in-tab mutations). Returns
   * an unsubscribe function. No-op on server (returns a noop unsubscribe).
   */
  subscribe: (cb: () => void) => () => void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function makeId(): string {
  if (isBrowser() && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }
  // Fallback — collision-resistant enough for mock data.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function readRaw<T>(storageKey: string, seed: T[]): T[] {
  if (!isBrowser()) return seed
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw == null) return seed
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seed
    return parsed as T[]
  } catch {
    // Corrupted JSON — defensive fallback to seed.
    return seed
  }
}

function writeRaw<T>(storageKey: string, value: T[]): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Quota exceeded / private mode — silently swallow. Caller still gets
    // the in-memory mutation for the lifetime of the page.
  }
}

export function createLocalStore<T extends { id: string }>(
  domain: string,
  seed: T[],
): LocalStore<T> {
  const storageKey = `${KEY_PREFIX}${domain}`
  const subscribers = new Set<() => void>()

  // In-tab notification + cross-tab listener wiring. We attach the storage
  // listener lazily (only when at least one subscriber exists) so the SSR
  // path stays inert and unused stores don't bloat the listener set.
  let storageListenerAttached = false
  function attachStorageListener(): void {
    if (storageListenerAttached || !isBrowser()) return
    storageListenerAttached = true
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === storageKey) notify()
    })
  }

  function notify(): void {
    for (const cb of subscribers) cb()
  }

  function snapshot(): T[] {
    return readRaw<T>(storageKey, seed)
  }

  function persist(next: T[]): void {
    writeRaw(storageKey, next)
    notify()
  }

  return {
    list(): T[] {
      // Defensive shallow clone so callers can't mutate the store in place.
      return snapshot().map((row) => ({ ...row }))
    },

    get(id: string): T | null {
      const row = snapshot().find((r) => r.id === id)
      return row ? { ...row } : null
    },

    create(input: Omit<T, 'id'>): T {
      const created = { ...(input as object), id: makeId() } as T
      const next = [created, ...snapshot()]
      persist(next)
      return { ...created }
    },

    update(id: string, patch: Partial<T>): T | null {
      const current = snapshot()
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) return null
      const merged = { ...current[idx], ...patch, id } as T
      const next = current.slice()
      next[idx] = merged
      persist(next)
      return { ...merged }
    },

    remove(id: string): void {
      const current = snapshot()
      const next = current.filter((r) => r.id !== id)
      if (next.length === current.length) return
      persist(next)
    },

    reset(): void {
      if (!isBrowser()) return
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // Ignore — still notify so caches refetch from seed.
      }
      notify()
    },

    subscribe(cb: () => void): () => void {
      attachStorageListener()
      subscribers.add(cb)
      return () => {
        subscribers.delete(cb)
      }
    },
  }
}
