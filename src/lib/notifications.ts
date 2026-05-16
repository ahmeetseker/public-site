/**
 * notifications — `arsam.notifications.v1` localStorage adapter (Wave F8.B).
 *
 * Notification center backing store for the header NotificationBell dropdown
 * and the `/hesabim/bildirimler` inbox page. Public-site is SSG with no
 * backend; this adapter persists notifications entirely client-side and seeds
 * a deterministic 5-item mock list on the first call to `seedIfEmpty()` so the
 * UI is never empty for demo users.
 *
 * Spec: `docs/superpowers/specs/2026-05-14-wave-f8-engagement-design.md` §5.
 */

export const NOTIFICATIONS_KEY = 'arsam.notifications.v1'
export const EVENT_NOTIFICATIONS_CHANGED = 'arsam:notifications-changed'

export type NotificationType = 'message' | 'listing' | 'system'

export interface AppNotification {
  /** ntf-NNN, monotonic */
  id: string
  type: NotificationType
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: number
}

/**
 * Deterministic seed timestamps are computed relative to a stable anchor so
 * tests get reproducible orderings. Real time is only used as a fallback when
 * Date.now() falls before the anchor (effectively never in production).
 */
const SEED_ANCHOR_MS = Date.parse('2026-05-14T12:00:00Z')

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function isNotification(v: unknown): v is AppNotification {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    (o.type === 'message' || o.type === 'listing' || o.type === 'system') &&
    typeof o.title === 'string' &&
    typeof o.body === 'string' &&
    typeof o.read === 'boolean' &&
    typeof o.createdAt === 'number' &&
    (o.link === undefined || typeof o.link === 'string')
  )
}

function readRaw(): AppNotification[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = parsed.filter(isNotification)
    // Dedupe by id — last write wins.
    const seen = new Set<string>()
    const out: AppNotification[] = []
    for (const n of valid) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      out.push(n)
    }
    return out
  } catch {
    return []
  }
}

function writeRaw(list: AppNotification[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list))
  } catch {
    /* quota / private-mode — swallow */
  }
  const w = safeWindow()
  if (w) {
    try {
      w.dispatchEvent(
        new CustomEvent(EVENT_NOTIFICATIONS_CHANGED, { detail: list }),
      )
    } catch {
      /* ignore */
    }
  }
}

/** Returns all notifications, sorted newest first. */
export function getNotifications(): AppNotification[] {
  return [...readRaw()].sort((a, b) => b.createdAt - a.createdAt)
}

/** Count of unread notifications (read=false). */
export function getUnreadCount(): number {
  return readRaw().reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
}

/** Flips read=true on the matching id. No-op if missing or already read. */
export function markAsRead(id: string): void {
  const current = readRaw()
  const idx = current.findIndex((n) => n.id === id)
  if (idx < 0) return
  if (current[idx].read) return
  const next = [
    ...current.slice(0, idx),
    { ...current[idx], read: true },
    ...current.slice(idx + 1),
  ]
  writeRaw(next)
}

/** Flips read=true on every notification. No-op if all already read. */
export function markAllAsRead(): void {
  const current = readRaw()
  if (current.every((n) => n.read)) return
  writeRaw(current.map((n) => ({ ...n, read: true })))
}

/** Hard-deletes a notification by id. */
export function deleteNotification(id: string): void {
  const current = readRaw()
  const next = current.filter((n) => n.id !== id)
  if (next.length === current.length) return
  writeRaw(next)
}

/**
 * Populates storage with 5 deterministic mock notifications if empty.
 *
 * Times are anchored to `SEED_ANCHOR_MS` so the on-screen ordering is stable
 * regardless of when the seed runs. Spec §5 fixes the labels + types + read
 * flags below; do NOT alter without spec update.
 */
export function seedIfEmpty(): void {
  if (readRaw().length > 0) return
  const anchor = SEED_ANCHOR_MS
  const seeded: AppNotification[] = [
    {
      id: 'ntf-001',
      type: 'system',
      title: "arsam.net'e hoş geldin",
      body: 'Yeni hesabını oluşturduğun için teşekkürler. İlk ilanını incelemek için keşfet.',
      link: '/',
      read: false,
      createdAt: anchor - 24 * 60 * 60 * 1000, // 1 gün önce
    },
    {
      id: 'ntf-002',
      type: 'listing',
      title: 'İlanın görüntülendi: Çeşme Arsa',
      body: 'Çeşme arsa ilanın son 3 saatte 12 kez görüntülendi.',
      link: '/hesabim/ilanlarim',
      read: false,
      createdAt: anchor - 3 * 60 * 60 * 1000, // 3 saat önce
    },
    {
      id: 'ntf-003',
      type: 'message',
      title: 'Yeni mesaj: Bodrum Emlak',
      body: 'Bodrum Emlak senin ilanına yeni bir mesaj bıraktı.',
      link: '/hesabim/mesajlar',
      read: true,
      createdAt: anchor - 1 * 60 * 60 * 1000, // 1 saat önce
    },
    {
      id: 'ntf-004',
      type: 'system',
      title: 'KVKK politikası güncellendi',
      body: 'KVKK aydınlatma metnimizi güncelledik — lütfen göz at.',
      link: '/hukuki/kvkk',
      read: true,
      createdAt: anchor - 2 * 24 * 60 * 60 * 1000, // 2 gün önce
    },
    {
      id: 'ntf-005',
      type: 'listing',
      title: 'Yeni ilan eşleşmesi: Datça',
      body: 'Kayıtlı aramana uyan yeni bir Datça ilanı yayınlandı.',
      link: '/ara?bolge=datca',
      read: false,
      createdAt: anchor - 5 * 60 * 1000, // 5 dakika önce
    },
  ]
  writeRaw(seeded)
}

/**
 * Test-only helper to wipe storage. Production code never calls this.
 * Exported so unit specs don't have to depend on the storage key constant
 * across multiple modules.
 */
export function clearAllNotifications(): void {
  writeRaw([])
}
