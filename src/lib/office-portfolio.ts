// Wave F9.C — Office portfolio helpers
// Deterministic seeders for /ofis/[slug] portfolio, agent roster, opening hours.
//
// All outputs are derived from the office id so SSR + CSR + snapshot tests
// agree. No network, no localStorage, no Date.now() in pure helpers (the
// `isOfficeOpenNow` helper is the only time-dependent function and accepts an
// injectable `now` for testability).

import { LISTINGS, OFFICES, type Listing } from '@landx/data'

export type AgentRole = 'satis' | 'kiralama' | 'koord'

export interface OfficeAgent {
  id: string
  name: string
  role: AgentRole
  phone: string
  email: string
  avatarInitials: string
}

export interface DayHours {
  /** 0 = Monday … 6 = Sunday (TR convention) */
  dayIdx: number
  /** Minutes from 00:00 (e.g. 540 = 09:00). null when closed. */
  openMin: number | null
  /** Minutes from 00:00 (e.g. 1080 = 18:00). null when closed. */
  closeMin: number | null
}

// ---------------------------------------------------------------------------
// Deterministic hash — kept local so tests are independent of @landx/data
// ---------------------------------------------------------------------------

function seedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1_000_003
  return Math.abs(h)
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${pad2(h)}:${pad2(m)}`
}

// ---------------------------------------------------------------------------
// Portfolio — top 6 listings per office
// ---------------------------------------------------------------------------

/**
 * Return the top 6 active listings for the given office. We don't store an
 * `officeId` on Listing yet — so we derive deterministically:
 *   listingIdx % OFFICES.length === officeIdx
 * filtered to status === 'Aktif'.
 */
export function getOfficeListings(officeId: string, limit = 6): Listing[] {
  const officeIdx = OFFICES.findIndex((o) => o.id === officeId)
  if (officeIdx < 0) return []
  const officeCount = OFFICES.length
  const matched: Listing[] = []
  for (let i = 0; i < LISTINGS.length; i++) {
    if (i % officeCount !== officeIdx) continue
    const l = LISTINGS[i]
    if (l.status !== 'Aktif') continue
    matched.push(l)
    if (matched.length >= limit) break
  }
  return matched
}

// ---------------------------------------------------------------------------
// Agent seeder — exactly 3 per office, deterministic
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Deniz', 'Ela', 'Cem', 'Naz', 'Bora', 'Yağmur',
  'Selin', 'Kerem', 'Mert', 'Pınar', 'Tolga', 'Eda',
] as const

const LAST_NAMES = [
  'Yıldız', 'Koç', 'Aksoy', 'Doğan', 'Erdem', 'Şahin',
  'Aydın', 'Kara', 'Demir', 'Çelik', 'Polat', 'Arslan',
] as const

const ROLES: readonly AgentRole[] = ['satis', 'kiralama', 'koord'] as const

function makePhone(seed: number): string {
  // +90 5XX XXX XX XX — keep the 5XX block deterministic, fan-out remaining digits
  const p1 = 500 + (seed % 49) // 500..548
  const p2 = (seed * 7) % 1000
  const p3 = (seed * 13) % 100
  const p4 = (seed * 17) % 100
  return `+90 ${p1} ${String(p2).padStart(3, '0')} ${String(p3).padStart(2, '0')} ${String(p4).padStart(2, '0')}`
}

function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Seed exactly 3 agents for an office id. Roles rotate satis / kiralama /
 * koord; name + phone + email are derived from a stable hash.
 */
export function seedAgents(officeId: string): OfficeAgent[] {
  const base = seedHash(officeId)
  const agents: OfficeAgent[] = []
  for (let i = 0; i < 3; i++) {
    const seed = base + i * 101
    const first = FIRST_NAMES[(seed) % FIRST_NAMES.length]
    const last = LAST_NAMES[(seed >> 2) % LAST_NAMES.length]
    const name = `${first} ${last}`
    const role = ROLES[i] // deterministic role rotation
    const slug = `${first}.${last}`.toLowerCase().replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g')
    agents.push({
      id: `${officeId}-agent-${i + 1}`,
      name,
      role,
      phone: makePhone(seed),
      email: `${slug}@${officeId}.arsam.net`,
      avatarInitials: initialsFor(name),
    })
  }
  return agents
}

// ---------------------------------------------------------------------------
// Opening hours — 7-day grid + live "open now"
// ---------------------------------------------------------------------------

/**
 * Deterministic 7-day grid. Baseline:
 *   Pzt-Cum 09:00-18:00
 *   Cmt     10:00-15:00
 *   Pzr     closed
 * Variations by seed: some offices open earlier/later, some open Sunday.
 */
export function getOpeningHours(officeId: string): DayHours[] {
  const seed = seedHash(officeId)
  const openShift = seed % 3 // 0, 1, or 2 hours later
  const closeShift = (seed >> 2) % 3 // 0..2 hours later
  const opensSunday = (seed >> 4) % 4 === 0 // ~25% offices open Sunday
  const earlyClose = (seed >> 5) % 5 === 0 // ~20% close early Saturday

  return Array.from({ length: 7 }, (_, dayIdx): DayHours => {
    if (dayIdx <= 4) {
      // Mon-Fri
      return {
        dayIdx,
        openMin: 9 * 60 + openShift * 30,
        closeMin: 18 * 60 + closeShift * 30,
      }
    }
    if (dayIdx === 5) {
      // Saturday
      return {
        dayIdx,
        openMin: 10 * 60,
        closeMin: earlyClose ? 13 * 60 : 15 * 60,
      }
    }
    // Sunday
    return opensSunday
      ? { dayIdx, openMin: 11 * 60, closeMin: 16 * 60 }
      : { dayIdx, openMin: null, closeMin: null }
  })
}

/**
 * Map a JS Date `getDay()` (0 = Sunday) to our internal index (0 = Monday).
 */
export function dateToDayIdx(d: Date): number {
  const js = d.getDay() // 0=Sun..6=Sat
  return js === 0 ? 6 : js - 1
}

/**
 * Is the office currently open? Pure: pass `now` for tests, defaults to live.
 */
export function isOfficeOpenNow(officeId: string, now: Date = new Date()): boolean {
  const grid = getOpeningHours(officeId)
  const dayIdx = dateToDayIdx(now)
  const slot = grid[dayIdx]
  if (slot.openMin === null || slot.closeMin === null) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= slot.openMin && mins < slot.closeMin
}

/**
 * Localised name for a day index. Pzt-Paz / Mon-Sun.
 */
export function dayName(dayIdx: number, locale: 'tr' | 'en' = 'tr'): string {
  const TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (locale === 'en' ? EN : TR)[dayIdx]
}

// ---------------------------------------------------------------------------
// Office coordinates — deterministic lat/lng since OFFICES has no geo field.
// We derive from the matched listings' centroid so the map marker lands in
// the same town as the office.
// ---------------------------------------------------------------------------

export function getOfficeCoords(officeId: string): { lat: number; lng: number } | null {
  const listings = getOfficeListings(officeId, 6)
  if (listings.length === 0) {
    // Fall back to district centroid via the office's first listing in LISTINGS
    const office = OFFICES.find((o) => o.id === officeId)
    if (!office) return null
    const fallback = LISTINGS.find((l) => l.district.includes(office.district))
    if (!fallback) return null
    return { lat: fallback.lat, lng: fallback.lng }
  }
  const lat = listings.reduce((s, l) => s + l.lat, 0) / listings.length
  const lng = listings.reduce((s, l) => s + l.lng, 0) / listings.length
  return { lat, lng }
}
