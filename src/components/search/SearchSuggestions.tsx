/**
 * Wave F6 / Agent-F6D — /ara SearchSuggestions dropdown.
 *
 * Mounted via `client:idle` near the top of /ara. Renders a search input with
 * a focus-triggered dropdown containing 3 sections, in priority order:
 *
 *   1. Son aramalar — last 5 from `arsam.savedSearches.v1`
 *   2. Popüler bölgeler — hardcoded mock top 8 (deterministic across renders)
 *   3. İlan tipleri — Arsa / Konut / Ticari chips (URL filter)
 *
 * Keyboard nav (per spec §7): ↓/↑ moves a virtual cursor across all rows,
 * Enter activates the highlighted row, Esc closes. ARIA combobox pattern
 * with `aria-activedescendant` on the input.
 *
 * Selecting a saved-search row replays its q + filters; selecting a bölge
 * pushes `?il=<city>&q=<name>`; selecting a tip pushes `?tip=<value>`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getSavedSearches,
  EVENT_SAVED_SEARCHES_CHANGED,
  type SavedSearchEntry,
} from '../../lib/account-store'

type Locale = 'tr' | 'en'

interface Props {
  /** Server-rendered initial query (preserves SSR hydration boundary). */
  initialQuery?: string
  /** Inferred from page; passed in by the Astro caller. */
  locale?: Locale
  /** Path prefix for navigation — '' for tr, '/en' for en. */
  basePath?: string
}

/** Hardcoded popular regions — deterministic. (Spec §7 pre-decided list.) */
const POPULAR_BOLGELER: { slug: string; name: string; city: string }[] = [
  { slug: 'cesme', name: 'Çeşme', city: 'İzmir' },
  { slug: 'bodrum', name: 'Bodrum', city: 'Muğla' },
  { slug: 'kusadasi', name: 'Kuşadası', city: 'Aydın' },
  { slug: 'cunda', name: 'Cunda', city: 'Balıkesir' },
  { slug: 'kas', name: 'Kaş', city: 'Antalya' },
  { slug: 'datca', name: 'Datça', city: 'Muğla' },
  { slug: 'marmaris', name: 'Marmaris', city: 'Muğla' },
  { slug: 'alanya', name: 'Alanya', city: 'Antalya' },
]

const TIPS: { value: string; tr: string; en: string }[] = [
  { value: 'Tarla', tr: 'Tarla', en: 'Field' },
  { value: 'Zeytinlik', tr: 'Zeytinlik', en: 'Olive grove' },
  { value: 'Villa Arsası', tr: 'Villa arsası', en: 'Villa plot' },
]

const COPY = {
  tr: {
    placeholder: 'İlçe, bölge veya anahtar kelime ara…',
    label: 'Arama',
    recent: 'Son aramalar',
    regions: 'Popüler bölgeler',
    types: 'İlan tipleri',
    empty: 'Henüz kaydedilmiş arama yok.',
    submit: 'Ara',
  },
  en: {
    placeholder: 'Search district, region or keyword…',
    label: 'Search',
    recent: 'Recent searches',
    regions: 'Popular regions',
    types: 'Listing types',
    empty: 'No saved searches yet.',
    submit: 'Search',
  },
} as const

type Row =
  | { kind: 'recent'; entry: SavedSearchEntry }
  | { kind: 'region'; slug: string; name: string; city: string }
  | { kind: 'tip'; value: string; label: string }

function searchUrl(basePath: string, params: Record<string, string>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${basePath}/ara?${qs}` : `${basePath}/ara`
}

function savedSearchUrl(basePath: string, entry: SavedSearchEntry): string {
  const params: Record<string, string> = {}
  if (entry.q) params.q = entry.q
  for (const [k, v] of Object.entries(entry.filters)) {
    if (v !== undefined && v !== null && String(v).length > 0) params[k] = String(v)
  }
  return searchUrl(basePath, params)
}

export default function SearchSuggestions({
  initialQuery = '',
  locale = 'tr',
  basePath = '',
}: Props) {
  const copy = COPY[locale]
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<SavedSearchEntry[]>([])
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = 'search-suggestions-listbox'

  // Hydrate from localStorage on mount, and listen for cross-tab updates.
  useEffect(() => {
    const load = () => {
      const all = getSavedSearches()
      const sorted = [...all].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      )
      setRecents(sorted.slice(0, 5))
    }
    load()
    if (typeof window === 'undefined') return
    window.addEventListener(EVENT_SAVED_SEARCHES_CHANGED, load)
    return () => window.removeEventListener(EVENT_SAVED_SEARCHES_CHANGED, load)
  }, [])

  // Click-away closes the dropdown.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = []
    for (const entry of recents) r.push({ kind: 'recent', entry })
    for (const b of POPULAR_BOLGELER) r.push({ kind: 'region', slug: b.slug, name: b.name, city: b.city })
    for (const t of TIPS) r.push({ kind: 'tip', value: t.value, label: locale === 'en' ? t.en : t.tr })
    return r
  }, [recents, locale])

  const navigateTo = useCallback(
    (href: string) => {
      if (typeof window !== 'undefined') {
        window.location.href = href
      }
    },
    [],
  )

  const onActivate = useCallback(
    (row: Row) => {
      if (row.kind === 'recent') {
        navigateTo(savedSearchUrl(basePath, row.entry))
      } else if (row.kind === 'region') {
        navigateTo(searchUrl(basePath, { q: row.name, il: row.city }))
      } else {
        navigateTo(searchUrl(basePath, { tip: row.value }))
      }
    },
    [basePath, navigateTo],
  )

  const submitFreeText = useCallback(() => {
    const q = query.trim()
    navigateTo(searchUrl(basePath, q ? { q } : {}))
  }, [basePath, navigateTo, query])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive(0)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            submitFreeText()
          }
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((prev) => (rows.length === 0 ? -1 : (prev + 1) % rows.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((prev) => {
          if (rows.length === 0) return -1
          return prev <= 0 ? rows.length - 1 : prev - 1
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (active >= 0 && active < rows.length) {
          onActivate(rows[active])
        } else {
          submitFreeText()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      }
    },
    [active, onActivate, open, rows, submitFreeText],
  )

  const optionId = (i: number) => `search-suggestion-option-${i}`

  return (
    <div
      ref={containerRef}
      data-search-suggestions=""
      className="relative w-full"
    >
      <label htmlFor="search-suggestions-input" className="sr-only">
        {copy.label}
      </label>
      <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/15">
        <span aria-hidden className="font-mono text-xs text-muted-foreground">⌕</span>
        <input
          ref={inputRef}
          id="search-suggestions-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={copy.placeholder}
          autoComplete="off"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          role="combobox"
          data-search-suggestions-input=""
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={submitFreeText}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition hover:opacity-90"
        >
          {copy.submit}
        </button>
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={copy.label}
          data-search-suggestions-dropdown=""
          className="absolute left-0 right-0 z-30 mt-1 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg"
        >
          {recents.length > 0 && (
            <Section title={copy.recent} dataSection="recent">
              {recents.map((entry, i) => (
                <Option
                  key={entry.id}
                  id={optionId(i)}
                  active={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onActivate({ kind: 'recent', entry })}
                  dataKind="recent"
                >
                  <span aria-hidden className="font-mono text-xs text-muted-foreground">⟲</span>
                  <span className="truncate">{entry.label || entry.q || copy.recent}</span>
                </Option>
              ))}
            </Section>
          )}

          {recents.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">{copy.empty}</div>
          )}

          <Section title={copy.regions} dataSection="regions">
            {POPULAR_BOLGELER.map((b, idx) => {
              const i = recents.length + idx
              return (
                <Option
                  key={b.slug}
                  id={optionId(i)}
                  active={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onActivate({ kind: 'region', slug: b.slug, name: b.name, city: b.city })}
                  dataKind="region"
                >
                  <span aria-hidden className="font-mono text-xs text-muted-foreground">◉</span>
                  <span className="truncate">{b.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{b.city}</span>
                </Option>
              )
            })}
          </Section>

          <Section title={copy.types} dataSection="types">
            {TIPS.map((t, idx) => {
              const i = recents.length + POPULAR_BOLGELER.length + idx
              const label = locale === 'en' ? t.en : t.tr
              return (
                <Option
                  key={t.value}
                  id={optionId(i)}
                  active={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onActivate({ kind: 'tip', value: t.value, label })}
                  dataKind="tip"
                >
                  <span aria-hidden className="font-mono text-xs text-muted-foreground">▣</span>
                  <span className="truncate">{label}</span>
                </Option>
              )
            })}
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  dataSection,
  children,
}: {
  title: string
  dataSection: string
  children: React.ReactNode
}) {
  return (
    <div data-search-suggestion-section={dataSection} className="py-1">
      <div className="px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      <ul className="m-0 list-none p-0">{children}</ul>
    </div>
  )
}

function Option({
  id,
  active,
  onMouseEnter,
  onClick,
  dataKind,
  children,
}: {
  id: string
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
  dataKind: string
  children: React.ReactNode
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      data-search-suggestion-option=""
      data-search-suggestion-kind={dataKind}
      data-search-suggestion-active={active ? 'true' : undefined}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={[
        'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        active ? 'bg-foreground/10 text-foreground' : 'text-foreground/80 hover:bg-foreground/5',
      ].join(' ')}
    >
      {children}
    </li>
  )
}
