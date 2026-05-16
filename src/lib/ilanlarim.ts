// İlanlarım — published listings localStorage adapter (Wave F5.E).
//
// SSR-safe CRUD (technically C/R/D — we don't update in place; remove + re-add)
// over `arsam.ilanlarim.v1`. Drives /hesabim/ilanlarim close-the-loop:
//   1. Wizard `IlanOnizleme.submit()` pushes a new entry before `clearDraft()`.
//   2. /hesabim/ilanlarim React island lists newest first, supports delete.
//
// Entry shape is intentionally flat — no `Listing` reuse — because the published
// list is purely user-authored, lives only in the browser, and never joins
// against the static `@landx/data` catalog. Capped at MAX_ENTRIES so a misbehaving
// loop can't blow the 5 MB localStorage budget.

const KEY = 'arsam.ilanlarim.v1'
const MAX_ENTRIES = 50

export type IlanStatus = 'aktif' | 'pasif' | 'taslak'

export interface IlanlarimEntry {
  ref: string
  title: string
  district: string
  city: string
  price: number
  area: number
  zoning?: string
  status: IlanStatus
  createdAt: number
  thumbnail?: string
}

function isEntry(v: unknown): v is IlanlarimEntry {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.ref === 'string' &&
    typeof o.title === 'string' &&
    typeof o.district === 'string' &&
    typeof o.city === 'string' &&
    typeof o.price === 'number' &&
    typeof o.area === 'number' &&
    typeof o.status === 'string' &&
    typeof o.createdAt === 'number'
  )
}

function read(): IlanlarimEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry)
  } catch {
    return []
  }
}

function write(items: IlanlarimEntry[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ENTRIES)))
  } catch {
    /* quota — silent */
  }
}

export function getIlanlarim(): IlanlarimEntry[] {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function addIlan(
  entry: Omit<IlanlarimEntry, 'createdAt' | 'status'> &
    Partial<Pick<IlanlarimEntry, 'status'>>,
): IlanlarimEntry {
  const full: IlanlarimEntry = {
    ...entry,
    status: entry.status ?? 'aktif',
    createdAt: Date.now(),
  }
  const current = read().filter((e) => e.ref !== full.ref)
  current.unshift(full)
  write(current)
  return full
}

export function removeIlan(ref: string): void {
  write(read().filter((e) => e.ref !== ref))
}

export function clearIlanlarim(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const ILANLARIM_KEY = KEY
export const ILANLARIM_MAX = MAX_ENTRIES
