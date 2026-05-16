/**
 * NotificationInbox — `/hesabim/bildirimler` page island (Wave F8.B).
 *
 * Renders the full notification list with filter chips (Tümü / Okunmadı /
 * Okundu), per-row delete + mark-as-read on click, and a "Tümünü okundu say"
 * CTA. Mounted under `client:visible` from `/hesabim/bildirimler.astro`.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  EVENT_NOTIFICATIONS_CHANGED,
  type AppNotification,
  type NotificationType,
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
  seedIfEmpty,
} from '../../lib/notifications'

type Locale = 'tr' | 'en'
type FilterKey = 'all' | 'unread' | 'read'

interface Labels {
  filters: Record<FilterKey, string>
  markAllRead: string
  delete: string
  empty: string
  types: Record<NotificationType, string>
  open: string
  unreadDot: string
  readBadge: string
  relativeTime: (ms: number) => string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    filters: { all: 'Tümü', unread: 'Okunmadı', read: 'Okundu' },
    markAllRead: 'Tümünü okundu say',
    delete: 'Sil',
    empty: 'Bu filtreye uygun bildirim yok.',
    types: { message: 'Mesaj', listing: 'İlan', system: 'Sistem' },
    open: 'Aç',
    unreadDot: 'Okunmamış',
    readBadge: 'Okundu',
    relativeTime: (ms) => formatRelativeTime(ms, 'tr'),
  },
  en: {
    filters: { all: 'All', unread: 'Unread', read: 'Read' },
    markAllRead: 'Mark all as read',
    delete: 'Delete',
    empty: 'No notifications match this filter.',
    types: { message: 'Message', listing: 'Listing', system: 'System' },
    open: 'Open',
    unreadDot: 'Unread',
    readBadge: 'Read',
    relativeTime: (ms) => formatRelativeTime(ms, 'en'),
  },
}

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

function formatRelativeTime(createdAt: number, locale: Locale): string {
  const delta = Date.now() - createdAt
  const minutes = Math.max(1, Math.round(delta / 60_000))
  if (locale === 'en') {
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.round(hours / 24)
    return `${days}d ago`
  }
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.round(hours / 24)
  return `${days} gün önce`
}

function TypeIcon({ type }: { type: NotificationType }) {
  if (type === 'message') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  }
  if (type === 'listing') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function NotificationInbox() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const locale = useMemo<Locale>(() => detectLocale(), [])
  const labels = LABELS[locale]

  useEffect(() => {
    seedIfEmpty()
    refresh()
    function onChange() {
      refresh()
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'arsam.notifications.v1') refresh()
    }
    window.addEventListener(EVENT_NOTIFICATIONS_CHANGED, onChange as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT_NOTIFICATIONS_CHANGED, onChange as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  function refresh() {
    setItems(getNotifications())
  }

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.read)
    if (filter === 'read') return items.filter((n) => n.read)
    return items
  }, [items, filter])

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((n) => !n.read).length,
      read: items.filter((n) => n.read).length,
    }),
    [items],
  )

  function handleOpen(n: AppNotification) {
    if (!n.read) markAsRead(n.id)
    refresh()
    if (n.link) {
      window.location.href = n.link
    }
  }

  function handleDelete(id: string) {
    deleteNotification(id)
    refresh()
  }

  function handleMarkAllRead() {
    markAllAsRead()
    refresh()
  }

  const FILTERS: FilterKey[] = ['all', 'unread', 'read']

  return (
    <div className="space-y-4" data-testid="notification-inbox">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={labels.filters.all}>
          {FILTERS.map((key) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                data-testid={`notification-filter-${key}`}
                data-active={active ? 'true' : 'false'}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-foreground/20 bg-foreground/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{labels.filters[key]}</span>
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={counts.unread === 0}
          data-testid="notification-mark-all-read"
          className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {labels.markAllRead}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
          data-testid="notification-inbox-empty"
        >
          {labels.empty}
        </div>
      ) : (
        <ul className="space-y-2" data-testid="notification-inbox-list">
          {filtered.map((n) => (
            <li
              key={n.id}
              data-testid="notification-row"
              data-notification-id={n.id}
              data-notification-read={n.read ? 'true' : 'false'}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                n.read
                  ? 'border-border bg-card'
                  : 'border-foreground/15 bg-foreground/5'
              }`}
            >
              <span
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground"
                aria-hidden="true"
              >
                <TypeIcon type={n.type} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm ${n.read ? '' : 'font-medium'}`}>
                    {n.title}
                  </span>
                  {!n.read ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-300"
                      data-testid="notification-unread-indicator"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span>{labels.unreadDot}</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {labels.readBadge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {labels.types[n.type]} · {labels.relativeTime(n.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpen(n)}
                  data-testid="notification-open"
                  className="rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-foreground/5"
                >
                  {labels.open}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  data-testid="notification-delete"
                  aria-label={labels.delete}
                  className="rounded-xl border border-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                >
                  {labels.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
