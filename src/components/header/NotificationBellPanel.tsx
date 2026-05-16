/**
 * NotificationBellPanel — panel-only notification list (Wave F32 / Task 3).
 *
 * Derived from `NotificationBell.tsx` but renders ONLY the dropdown panel —
 * no bell button, no popover toggle state. Mounts inside the shared
 * `DynamicIslandHeader` notifications slot, which owns the trigger + open
 * state. Behavior mirrors the original panel: top-10 newest, locale-aware
 * labels + relative time, mark-as-read on click, "Tümünü gör" footer link.
 *
 * Coexists with the original `NotificationBell.tsx` until Task 7 removes
 * the legacy `SiteHeader` mount.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  EVENT_NOTIFICATIONS_CHANGED,
  type AppNotification,
  type NotificationType,
  getNotifications,
  markAsRead,
  seedIfEmpty,
} from '@/lib/notifications'

type Locale = 'tr' | 'en'

interface Labels {
  menuTitle: string
  empty: string
  seeAll: string
  types: Record<NotificationType, string>
  /** Locale-aware relative-time formatter (input: createdAt epoch ms). */
  relativeTime: (ms: number) => string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
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

interface Props {
  locale?: Locale
  /**
   * Optional close callback passed from the shared header. When the user
   * clicks a notification link (or the "See all" footer link), we call
   * this so the parent can dismiss the popover on navigation. Pure-React
   * consumers may omit.
   */
  onClose?: () => void
}

export function NotificationBellPanel({ locale = 'tr', onClose }: Props) {
  const [items, setItems] = useState<AppNotification[]>([])
  const labels = useMemo(() => LABELS[locale], [locale])
  const seeAllHref = locale === 'en' ? '/en/hesabim/bildirimler' : '/hesabim/bildirimler'

  // Seed + read initial state on mount. Re-read whenever storage changes via
  // another tab (storage event) or another island in the same tab
  // (EVENT_NOTIFICATIONS_CHANGED custom event).
  useEffect(() => {
    seedIfEmpty()
    setItems(getNotifications().slice(0, 10))

    function refresh() {
      setItems(getNotifications().slice(0, 10))
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

  function handleItemClick(n: AppNotification, e: React.MouseEvent<HTMLAnchorElement>) {
    if (!n.read) {
      markAsRead(n.id)
    }
    if (!n.link) {
      e.preventDefault()
    }
    onClose?.()
  }

  return (
    <div
      role="menu"
      aria-label={labels.menuTitle}
      className="w-80 rounded-2xl border border-border bg-card p-2 shadow-lg"
      data-testid="notification-bell-panel"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {labels.menuTitle}
        </span>
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
        onClick={() => onClose?.()}
        className="mt-1 block w-full rounded-xl border border-transparent px-3 py-2 text-center text-xs font-medium text-foreground transition hover:border-border hover:bg-accent"
        data-testid="notification-see-all"
      >
        {labels.seeAll}
      </a>
    </div>
  )
}

export default NotificationBellPanel
