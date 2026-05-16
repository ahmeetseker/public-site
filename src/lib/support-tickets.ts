/**
 * support-tickets — /hesabim/destek localStorage adapter (Wave F7.D).
 *
 * `arsam.support-tickets.v1` schema: array of SupportTicket. Public-site is
 * SSG with no backend; this adapter persists the buyer's tickets entirely
 * client-side and simulates a 24-second support team response via setTimeout.
 *
 * The mock reply delay is configurable at module scope via setMockReplyDelay
 * so unit tests can advance fake timers deterministically. Production paths
 * leave the default 24_000 ms in place.
 */

export const SUPPORT_TICKETS_KEY = 'arsam.support-tickets.v1'
export const EVENT_SUPPORT_TICKETS_CHANGED = 'arsam:support-tickets-changed'

export type TicketCategory = 'hesap' | 'ilan' | 'odeme' | 'diger'
export type TicketStatus = 'open' | 'answered' | 'closed'

export interface SupportTicket {
  /** SUP-YYYY-NNN, monotonic within the calendar year of creation. */
  id: string
  category: TicketCategory
  subject: string
  message: string
  screenshotUrl?: string
  status: TicketStatus
  createdAt: number
  mockReply?: { body: string; repliedAt: number }
}

export interface CreateTicketInput {
  category: TicketCategory
  subject: string
  message: string
  screenshotUrl?: string
}

let MOCK_REPLY_DELAY_MS = 24_000

/**
 * Override the default 24-second mock reply delay. Used by vitest specs to
 * keep tests fast; never call from production code.
 */
export function setMockReplyDelay(ms: number): void {
  MOCK_REPLY_DELAY_MS = Math.max(0, ms)
}

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function isTicket(v: unknown): v is SupportTicket {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.subject === 'string' &&
    typeof o.message === 'string' &&
    typeof o.createdAt === 'number' &&
    (o.category === 'hesap' ||
      o.category === 'ilan' ||
      o.category === 'odeme' ||
      o.category === 'diger') &&
    (o.status === 'open' || o.status === 'answered' || o.status === 'closed')
  )
}

function readRaw(): SupportTicket[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = parsed.filter(isTicket)
    // Dedupe by id (last write wins for the same id).
    const seen = new Set<string>()
    const out: SupportTicket[] = []
    for (const t of valid) {
      if (seen.has(t.id)) continue
      seen.add(t.id)
      out.push(t)
    }
    return out
  } catch {
    return []
  }
}

function writeRaw(list: SupportTicket[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(list))
  } catch {
    /* quota / private-mode — swallow */
  }
  const w = safeWindow()
  if (w) {
    try {
      w.dispatchEvent(new CustomEvent(EVENT_SUPPORT_TICKETS_CHANGED, { detail: list }))
    } catch {
      /* ignore */
    }
  }
}

/** Returns all tickets, sorted newest first. */
export function getTickets(): SupportTicket[] {
  return [...readRaw()].sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Generates a SUP-YYYY-NNN id. Counter is the highest existing NNN within the
 * current year plus 1; falls back to 001 when the year has no prior tickets.
 */
function nextId(now: Date, existing: SupportTicket[]): string {
  const year = now.getFullYear()
  const prefix = `SUP-${year}-`
  let max = 0
  for (const t of existing) {
    if (!t.id.startsWith(prefix)) continue
    const tail = t.id.slice(prefix.length)
    const n = Number(tail)
    if (Number.isFinite(n) && n > max) max = n
  }
  const next = String(max + 1).padStart(3, '0')
  return `${prefix}${next}`
}

function categoryLabel(category: TicketCategory, locale: 'tr' | 'en'): string {
  const TR: Record<TicketCategory, string> = {
    hesap: 'hesap',
    ilan: 'ilan',
    odeme: 'ödeme',
    diger: 'diğer',
  }
  const EN: Record<TicketCategory, string> = {
    hesap: 'account',
    ilan: 'listing',
    odeme: 'payment',
    diger: 'other',
  }
  return locale === 'en' ? EN[category] : TR[category]
}

function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

function buildMockReplyBody(category: TicketCategory, locale: 'tr' | 'en'): string {
  const label = categoryLabel(category, locale)
  if (locale === 'en') {
    return `Our support team has reviewed your ${label} request. We will get back to you with detailed information within 24 hours.`
  }
  return `Destek ekibimiz ${label} hakkındaki talebinizi inceledi. 24 saat içinde detaylı dönüş yapacağız.`
}

/**
 * Persists a new ticket with status='open'. Schedules a setTimeout that, after
 * MOCK_REPLY_DELAY_MS, attaches a mockReply and flips status to 'answered'.
 *
 * Returns the persisted ticket synchronously (mockReply will be undefined).
 */
export function createTicket(input: CreateTicketInput): SupportTicket {
  const now = new Date()
  const current = readRaw()
  const id = nextId(now, current)
  const ticket: SupportTicket = {
    id,
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    screenshotUrl: input.screenshotUrl?.trim() || undefined,
    status: 'open',
    createdAt: now.getTime(),
  }
  writeRaw([...current, ticket])

  const locale = detectLocale()
  const w = safeWindow()
  const scheduler = w?.setTimeout ?? globalThis.setTimeout
  scheduler(() => {
    const list = readRaw()
    const idx = list.findIndex((t) => t.id === id)
    if (idx < 0) return // ticket removed before reply fired
    const target = list[idx]
    if (target.status === 'closed') return
    const updated: SupportTicket = {
      ...target,
      status: 'answered',
      mockReply: {
        body: buildMockReplyBody(target.category, locale),
        repliedAt: Date.now(),
      },
    }
    const next = [...list.slice(0, idx), updated, ...list.slice(idx + 1)]
    writeRaw(next)
  }, MOCK_REPLY_DELAY_MS)

  return ticket
}

/** Hard-deletes a ticket from storage. No-op if id missing. */
export function removeTicket(id: string): void {
  const current = readRaw()
  const next = current.filter((t) => t.id !== id)
  if (next.length === current.length) return
  writeRaw(next)
}

/** Flips status to 'closed' on the matching ticket. */
export function markAsClosed(id: string): void {
  const current = readRaw()
  const idx = current.findIndex((t) => t.id === id)
  if (idx < 0) return
  if (current[idx].status === 'closed') return
  const next = [
    ...current.slice(0, idx),
    { ...current[idx], status: 'closed' as TicketStatus },
    ...current.slice(idx + 1),
  ]
  writeRaw(next)
}
