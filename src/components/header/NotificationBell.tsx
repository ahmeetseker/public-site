/**
 * NotificationBell — Header dropdown notification center (Wave F8.B).
 *
 * Lucide-style Bell icon + red badge with unread count. Click toggles a
 * dropdown showing the top 10 notifications newest-first. Clicking an item
 * marks it as read and navigates to its link (if any). "Tümünü gör" routes
 * to /hesabim/bildirimler (locale-aware).
 *
 * Mounted under `client:idle` in `SiteHeader.astro`; `document` is always
 * available at render time. SSR guard kept defensively for tests.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EVENT_NOTIFICATIONS_CHANGED,
  type AppNotification,
  type NotificationType,
  getNotifications,
  getUnreadCount,
  markAsRead,
  seedIfEmpty,
} from '@/lib/notifications'

type Locale = 'tr' | 'en'

interface Labels {
  bellAria: string
  menuTitle: string
  empty: string
  seeAll: string
  types: Record<NotificationType, string>
  /** Locale-aware relative-time formatter. */
  relativeTime: (ms: number) => string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    bellAria: 'Bildirimler',
    menuTitle: 'Bildirimler',
    empty: 'Henüz bildirim yok.',
    seeAll: 'Tümünü gör',
    types: {
      message: 'Mesaj',
      listing: 'İlan',
      system: 'Sistem',
    },
    relativeTime: (ms) => formatRelativeTime(ms, 'tr'),
  },
  en: {
    bellAria: 'Notifications',
    menuTitle: 'Notifications',
    empty: 'No notifications yet.',
    seeAll: 'See all',
    types: {
      message: 'Message',
      listing: 'Listing',
      system: 'System',
    },
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
  // Inline SVGs match the project's lucide-style 1.8 stroke convention.
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const locale = useMemo<Locale>(() => detectLocale(), [])
  const labels = LABELS[locale]
  const seeAllHref = locale === 'en' ? '/en/hesabim/bildirimler' : '/hesabim/bildirimler'

  // Seed + read initial state on mount. We re-read whenever storage changes
  // either via another tab (storage event) or another island in the same tab
  // (EVENT_NOTIFICATIONS_CHANGED custom event).
  useEffect(() => {
    seedIfEmpty()
    setItems(getNotifications().slice(0, 10))
    setUnread(getUnreadCount())

    function refresh() {
      setItems(getNotifications().slice(0, 10))
      setUnread(getUnreadCount())
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'arsam.notifications.v1') refresh()
    }
    window.addEventListener(EVENT_NOTIFICATIONS_CHANGED, refresh as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT_NOTIFICATIONS_CHANGED, refresh as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Outside-click + Escape close, only while open to avoid global listeners.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleItemClick(n: AppNotification, e: React.MouseEvent<HTMLAnchorElement>) {
    // Mark as read synchronously so the badge updates even if navigation is
    // intercepted (e.g. ctrl-click into a new tab still records the read).
    // markAsRead dispatches EVENT_NOTIFICATIONS_CHANGED, which our useEffect
    // listener consumes to refresh both items and unread — we deliberately
    // do NOT also setUnread here to avoid double-decrementing under React 19
    // batching (functional updater would see the post-event state).
    if (!n.read) {
      markAsRead(n.id)
    }
    if (!n.link) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative" data-testid="notification-bell-root">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.bellAria}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="notification-bell"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium leading-none text-white ring-2 ring-background"
            data-testid="notification-badge"
            aria-label={`${unread} ${locale === 'en' ? 'unread' : 'okunmadı'}`}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={labels.menuTitle}
          className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-border bg-card p-2 shadow-lg"
          data-testid="notification-menu"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {labels.menuTitle}
            </span>
            {unread > 0 && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-300">
                {unread}
              </span>
            )}
          </div>
          {items.length === 0 ? (
            <p
              className="px-3 py-6 text-center text-xs text-muted-foreground"
              data-testid="notification-empty"
            >
              {labels.empty}
            </p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.link ?? '#'}
                    role="menuitem"
                    onClick={(e) => handleItemClick(n, e)}
                    data-testid="notification-item"
                    data-notification-read={n.read ? 'true' : 'false'}
                    className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs transition hover:bg-accent ${
                      n.read ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        n.read ? 'bg-foreground/5' : 'bg-foreground/10'
                      }`}
                      aria-hidden="true"
                    >
                      <TypeIcon type={n.type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`truncate text-xs ${n.read ? '' : 'font-medium'}`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span
                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                        {labels.types[n.type]} · {labels.relativeTime(n.createdAt)}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a
            href={seeAllHref}
            className="mt-1 block w-full rounded-xl border border-transparent px-3 py-2 text-center text-xs font-medium text-foreground transition hover:border-border hover:bg-accent"
            data-testid="notification-see-all"
          >
            {labels.seeAll}
          </a>
        </div>
      )}
    </div>
  )
}
