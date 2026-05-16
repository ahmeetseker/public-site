// Header dropdown — History icon button + popover menu of recent listings.
// Lazy: list contents are only read from localStorage on `open` so SSR-render
// stays cheap and we always show the freshest data.
//
// Wave F24.B — newest-first date sort + max 12 cap applied at read time so the
// menu can never grow taller than the lib's own retention. Empty-state + clear
// button live behind the same testids the existing E2E (`recent-views.spec.ts`)
// already asserts against.
import { useEffect, useRef, useState } from 'react'
import { getRecent, clearRecent, type RecentItem } from '@/lib/recent-views'

const MAX_ITEMS = 12

// Locale detection — reads <html lang> at render time. Safe because this
// component only ever mounts under `client:idle` / `client:visible`, so the
// document is always available. SSR guard kept for tests.
function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang === 'en' ? 'en' : 'tr'
}

export default function RecentViewedDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<RecentItem[]>([])
  const ref = useRef<HTMLDivElement | null>(null)
  const locale = detectLocale()
  const labels =
    locale === 'en'
      ? {
          trigger: 'Recently viewed',
          empty: 'No listings viewed yet.',
          clear: 'Clear all',
        }
      : {
          trigger: 'Son baktıklarım',
          empty: 'Henüz ilan görüntülemediniz.',
          clear: 'Tümünü temizle',
        }

  useEffect(() => {
    if (open) {
      const fresh = getRecent()
        .slice()
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, MAX_ITEMS)
      setItems(fresh)
    }
  }, [open])

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

  return (
    <div ref={ref} className="relative" data-testid="recent-dropdown">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.trigger}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="recent-trigger"
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={labels.trigger}
          className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-border bg-card p-2 shadow-lg"
          data-testid="recent-menu"
        >
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {labels.empty}
            </p>
          ) : (
            <>
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {items.map((it) => (
                  <li key={it.slug}>
                    <a
                      href={`/ilan/${it.slug}`}
                      role="menuitem"
                      aria-label={it.title}
                      className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                    >
                      <img
                        src={it.image}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded-md object-cover"
                      />
                      <span className="line-clamp-2">{it.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  clearRecent()
                  setItems([])
                }}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-accent"
                data-testid="recent-clear"
              >
                {labels.clear}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
