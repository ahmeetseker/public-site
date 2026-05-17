/**
 * SavedSearchesList — /hesabim/aramalar React island (client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Reads `arsam.savedSearches.v1` from localStorage. For each entry it
 * computes a "current matching count" against a minimal LISTINGS dataset
 * passed in from the Astro page, then renders the row with:
 *   - human label / query summary
 *   - savedAt (TR locale)
 *   - matching count (live)
 *   - "Aramaya dön" link → /ara?q=...&tip=...
 *   - "Sil" button
 *
 * Empty state CTA → /ara.
 */
import { useEffect, useMemo, useState } from 'react'
import { SkeletonRow } from '@landx/ui/feedback'
import {
  EVENT_SAVED_SEARCHES_CHANGED,
  getSavedSearches,
  removeSearch,
  type SavedSearchEntry,
} from '../../lib/account-store'
import { withBase } from '../../lib/with-base'

export interface MinimalListing {
  id: string
  title: string
  city: string
  district: string
  type: string
  price: number
}

interface Props {
  /** Slim listings array used for matching-count computation. */
  listings: MinimalListing[]
}

function buildSearchURL(entry: SavedSearchEntry): string {
  const params = new URLSearchParams()
  if (entry.q) params.set('q', entry.q)
  for (const [k, v] of Object.entries(entry.filters ?? {})) {
    if (v === '' || v == null) continue
    params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `/ara?${qs}` : '/ara'
}

function summarize(entry: SavedSearchEntry): string {
  if (entry.label) return entry.label
  const parts: string[] = []
  if (entry.q) parts.push(entry.q)
  const f = entry.filters ?? {}
  if (typeof f.tip === 'string' && f.tip !== 'Tümü') parts.push(String(f.tip))
  if (typeof f.il === 'string') parts.push(String(f.il))
  if (typeof f.ilce === 'string') parts.push(String(f.ilce))
  if (typeof f.priceMin === 'number' && f.priceMin > 0) {
    parts.push(`min ${(f.priceMin / 1_000_000).toFixed(1)}M`)
  }
  if (typeof f.priceMax === 'number' && f.priceMax > 0) {
    parts.push(`max ${(f.priceMax / 1_000_000).toFixed(1)}M`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Tüm ilanlar'
}

function countMatches(entry: SavedSearchEntry, listings: MinimalListing[]): number {
  const f = entry.filters ?? {}
  const q = entry.q?.toLocaleLowerCase('tr-TR').trim()
  return listings.filter((l) => {
    if (typeof f.tip === 'string' && f.tip !== 'Tümü' && l.type !== f.tip) return false
    if (typeof f.il === 'string' && f.il && l.city !== f.il) return false
    if (typeof f.ilce === 'string' && f.ilce && !l.district.includes(String(f.ilce))) return false
    if (typeof f.priceMin === 'number' && l.price < f.priceMin) return false
    if (typeof f.priceMax === 'number' && f.priceMax > 0 && l.price > f.priceMax) return false
    if (q) {
      const hay = `${l.title} ${l.city} ${l.district}`.toLocaleLowerCase('tr-TR')
      if (!hay.includes(q)) return false
    }
    return true
  }).length
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function SavedSearchesList({ listings }: Props) {
  const [entries, setEntries] = useState<SavedSearchEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const sync = () => setEntries(getSavedSearches())
    sync()
    setMounted(true)
    window.addEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_SAVED_SEARCHES_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const rows = useMemo(
    () =>
      entries.map((e) => ({
        entry: e,
        summary: summarize(e),
        matches: countMatches(e, listings),
        href: buildSearchURL(e),
      })),
    [entries, listings],
  )

  if (!mounted) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-border bg-card"
        data-saved-searches-loading=""
        data-testid="saved-searches-skeleton"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Kayıtlı aramalar yükleniyor"
      >
        <SkeletonRow cells={3} />
        <SkeletonRow cells={3} />
        <SkeletonRow cells={3} />
        <SkeletonRow cells={3} />
        <SkeletonRow cells={3} />
        <SkeletonRow cells={3} />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        data-saved-searches-empty=""
      >
        <span className="font-serif text-4xl font-normal text-muted-foreground" aria-hidden="true">
          ⌕
        </span>
        <h2 className="font-serif text-xl tracking-tight">Henüz kayıtlı arama yok.</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          /ara'da filtrelerini ayarla, sonra "Aramayı kaydet" butonuna bas;
          eşleşmeler arttıkça e-postayla haberdar ol.
        </p>
        <a
          href={withBase('/ara')}
          className="mt-2 inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Yeni arama kaydet →
        </a>
      </div>
    )
  }

  return (
    <ul
      className="flex max-w-prose flex-col gap-3"
      data-saved-searches-list=""
      data-count={rows.length}
    >
      {rows.map(({ entry, summary, matches, href }) => (
        <li
          key={entry.id}
          data-saved-search={entry.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <div className="font-serif text-base tracking-tight">{summary}</div>
            <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {fmtDate(entry.savedAt)} · {matches} eşleşme
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={href}
              data-saved-search-resume={entry.id}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-foreground/5"
            >
              Aramaya dön →
            </a>
            <button
              type="button"
              onClick={() => removeSearch(entry.id)}
              data-saved-search-delete={entry.id}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
              aria-label="Aramayı sil"
            >
              Sil
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
