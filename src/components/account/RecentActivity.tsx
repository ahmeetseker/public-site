/**
 * RecentActivity — /hesabim hub activity feed (React island, client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Mixes static mock activity (BUYER_MOCK_ACTIVITY) with live entries derived
 * from localStorage (recent saved searches + favorites). 4 items max, sorted
 * by descending timestamp.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  EVENT_FAVORITES_CHANGED,
  EVENT_SAVED_SEARCHES_CHANGED,
  getFavorites,
  getSavedSearches,
} from '../../lib/account-store'
import { BUYER_MOCK_ACTIVITY, type MockActivity } from '../../lib/buyer-mock'

const ICON_GLYPH: Record<MockActivity['kind'], string> = {
  favorite: '♥',
  search: '⌕',
  message: '✉',
  price: '₺',
}

function relTime(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'şimdi'
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

export default function RecentActivity() {
  const [favs, setFavs] = useState<string[]>([])
  const [searches, setSearches] = useState<{ id: string; q: string; savedAt: string; label?: string }[]>([])

  useEffect(() => {
    const sync = () => {
      setFavs(getFavorites())
      setSearches(getSavedSearches())
    }
    sync()
    window.addEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
    window.addEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
      window.removeEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const items = useMemo<MockActivity[]>(() => {
    const live: MockActivity[] = []
    if (favs.length > 0) {
      live.push({
        id: 'live-fav',
        kind: 'favorite',
        text: `${favs.length} ilan favorilerinde`,
        at: new Date().toISOString(),
      })
    }
    if (searches.length > 0) {
      const latest = [...searches].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]
      if (latest) {
        live.push({
          id: `live-search-${latest.id}`,
          kind: 'search',
          text: `"${latest.label ?? latest.q ?? 'Arama'}" kaydedildi`,
          at: latest.savedAt,
        })
      }
    }
    const merged = [...live, ...BUYER_MOCK_ACTIVITY]
    return merged.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4)
  }, [favs, searches])

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5"
      data-account-recent-activity=""
    >
      <header className="flex items-baseline justify-between gap-2 pb-3">
        <h2 className="font-serif text-lg tracking-tight">Son hareketler</h2>
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          SON GÜNLER
        </span>
      </header>
      <ol className="flex flex-col">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm text-foreground"
            >
              {ICON_GLYPH[item.kind]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{item.text}</p>
              <time
                dateTime={item.at}
                className="font-mono text-xs text-muted-foreground"
              >
                {relTime(item.at)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
