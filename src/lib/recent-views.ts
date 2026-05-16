// Recently-viewed listings — F4.A.2.
// localStorage-backed, deduped by slug, FIFO-capped, SSR-safe.
// Key: arsam.recent.v1 — version bump if schema changes.

export const MAX_RECENT = 12
const KEY = 'arsam.recent.v1'

export interface RecentItem {
  slug: string
  title: string
  price: number
  currency: 'TRY'
  image: string
  addedAt: number
}

function isItem(v: unknown): v is RecentItem {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.slug === 'string' &&
    typeof o.title === 'string' &&
    typeof o.price === 'number' &&
    typeof o.image === 'string' &&
    typeof o.addedAt === 'number'
  )
}

function read(): RecentItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isItem)
  } catch {
    return []
  }
}

function write(items: RecentItem[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // quota exceeded — silently drop.
  }
}

export function getRecent(): RecentItem[] {
  return read()
}

export function addRecent(item: RecentItem): void {
  const current = read().filter((e) => e.slug !== item.slug)
  current.unshift(item)
  write(current.slice(0, MAX_RECENT))
}

export function clearRecent(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
