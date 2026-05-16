/**
 * AccountStats — /hesabim hub stats grid (React island, client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Reads the four localStorage-backed buyer counters (favorites,
 * savedSearches, messages, profileCompletion) and renders 4 clickable cards
 * linking to the corresponding sub-pages. Subscribes to all three storage
 * events so values stay live as the user navigates between islands.
 *
 * Tokens-only — no `bg-white` / hex colors. Grid: `grid-cols-2 md:grid-cols-4`.
 */
import { useEffect, useState } from 'react'
import {
  EMPTY_PROFILE,
  EVENT_FAVORITES_CHANGED,
  EVENT_PROFILE_CHANGED,
  EVENT_SAVED_SEARCHES_CHANGED,
  getFavorites,
  getProfile,
  getSavedSearches,
  profileCompletionPercent,
} from '../../lib/account-store'
import { BUYER_MOCK_CONVERSATIONS } from '../../lib/buyer-mock'

interface Stat {
  href: string
  label: string
  value: string
  sub: string
}

export default function AccountStats() {
  const [favCount, setFavCount] = useState(0)
  const [searchCount, setSearchCount] = useState(0)
  const [profilePct, setProfilePct] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Conversations are a static fixture — message count doesn't change at runtime.
  const unread = BUYER_MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0)
  const messageCount = BUYER_MOCK_CONVERSATIONS.length

  useEffect(() => {
    const sync = () => {
      setFavCount(getFavorites().length)
      setSearchCount(getSavedSearches().length)
      setProfilePct(profileCompletionPercent(getProfile() ?? EMPTY_PROFILE))
    }
    sync()
    setMounted(true)
    window.addEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
    window.addEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
    window.addEventListener(EVENT_PROFILE_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
      window.removeEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
      window.removeEventListener(EVENT_PROFILE_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const stats: Stat[] = [
    {
      href: '/hesabim/favori',
      label: 'Favori arsa',
      value: `${favCount}`,
      sub: favCount === 0 ? 'Henüz favori yok' : `${favCount} kayıtlı`,
    },
    {
      href: '/hesabim/aramalar',
      label: 'Kayıtlı arama',
      value: `${searchCount}`,
      sub: searchCount === 0 ? 'Yeni arama kaydet' : `${searchCount} aktif`,
    },
    {
      href: '/hesabim/mesajlar',
      label: 'Yeni mesaj',
      value: `${unread}`,
      sub: `${messageCount} konuşma`,
    },
    {
      href: '/hesabim/profil',
      label: 'Profil tamam',
      value: `%${profilePct}`,
      sub: profilePct === 100 ? 'Tamamlandı' : 'Profili tamamla',
    },
  ]

  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      data-account-stats=""
      data-mounted={mounted ? 'true' : 'false'}
    >
      {stats.map((s) => (
        <a
          key={s.href}
          href={s.href}
          data-account-stat={s.label}
          className="group flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20"
        >
          <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
          <div className="font-serif text-2xl font-normal tracking-tight tabular-nums md:text-3xl">
            {s.value}
          </div>
          <div className="text-xs text-muted-foreground">{s.sub}</div>
        </a>
      ))}
    </div>
  )
}
