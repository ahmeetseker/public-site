/**
 * compare-store — SSR-safe localStorage wrapper for /ara → /karsilastir flow.
 *
 * Faz 9.16 / Wave-11 / Agent-A52.
 *
 * Stores up to MAX=3 listing ids under `arsam.compare.v1` (JSON array).
 * Components subscribe to the `arsam:compare-changed` window event to stay in sync.
 *
 * All exports are guarded with `typeof window !== 'undefined'` so the same module
 * can be imported by client islands without breaking SSR (Astro static output).
 */

export const STORAGE_KEY = 'arsam.compare.v1'
export const EVENT_NAME = 'arsam:compare-changed'
export const MAX = 3

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function read(): string[] {
  const w = safeWindow()
  if (!w) return []
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX)
  } catch {
    return []
  }
}

function write(ids: string[]): void {
  const w = safeWindow()
  if (!w) return
  try {
    w.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX)))
  } catch {
    // quota / private-mode — swallow silently
  }
  try {
    w.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ids: ids.slice(0, MAX) } }))
  } catch {
    // CustomEvent unsupported — ignore
  }
}

export function getCompareIds(): string[] {
  return read()
}

export function hasId(id: string): boolean {
  return read().includes(id)
}

/** Add id; returns false if cap reached (and id not already present). */
export function addId(id: string): boolean {
  const current = read()
  if (current.includes(id)) return true
  if (current.length >= MAX) return false
  write([...current, id])
  return true
}

export function removeId(id: string): void {
  const current = read()
  const next = current.filter((v) => v !== id)
  if (next.length === current.length) return
  write(next)
}

/** Idempotent toggle. Returns true if id is now selected, false otherwise (incl. cap-blocked add). */
export function toggleId(id: string): boolean {
  const current = read()
  if (current.includes(id)) {
    write(current.filter((v) => v !== id))
    return false
  }
  if (current.length >= MAX) return false
  write([...current, id])
  return true
}

export function clear(): void {
  write([])
}

/** Replace the entire selection (used by SaveSelectionButton on /karsilastir). */
export function setIds(ids: string[]): void {
  // de-dupe + cap
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string' || !id) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= MAX) break
  }
  write(out)
}
