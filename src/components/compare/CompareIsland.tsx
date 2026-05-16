import { useEffect, useState } from 'react'

import { LISTINGS, type Listing } from '@landx/data'

import CompareGrid from './CompareGrid'
import CompareShareButton from './CompareShareButton'
import CompareTable from './CompareTable'
import MobileCompareStack from './MobileCompareStack'

const LS_KEY = 'arsam.compare.v1'
// Wave F9.A: bumped 3 → 4. Wave F24.B: bumped 4 → 6 to power the 6-up
// CompareGrid (`grid-cols-2 md:grid-cols-3 xl:grid-cols-6`). URL slice +
// table grid + mobile stack are all in lockstep on this constant. The
// `arsam.compare.v1` writer in `lib/compare-store.ts` still keeps its own
// per-picker cap; this `MAX` only governs how many ids the karsilastir page
// will render at once.
const MAX = 6

export interface CompareIslandProps {
  locale: 'tr' | 'en'
}

function readIdsFromUrl(): string[] {
  if (typeof window === 'undefined') return []
  const sp = new URLSearchParams(window.location.search)
  const raw = sp.get('ids') ?? ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX)
}

function readIdsFromStorage(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v): v is string => typeof v === 'string')
      .slice(0, MAX)
  } catch {
    return []
  }
}

export default function CompareIsland({ locale }: CompareIslandProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [resolved, setResolved] = useState(false)
  // Wave F9.A — transient "only-differences" filter. We deliberately don't
  // persist this in localStorage: the toggle resets between sessions so the
  // default render always shows all rows (avoids the "where did my data go"
  // confusion when someone returns to /karsilastir with the filter still on).
  const [onlyDiff, setOnlyDiff] = useState(false)

  useEffect(() => {
    let ids = readIdsFromUrl()
    if (ids.length === 0) ids = readIdsFromStorage()
    const found = ids
      .map((id) => LISTINGS.find((l) => l.id === id))
      .filter((l): l is Listing => !!l)
    setListings(found)
    setResolved(true)
  }, [])

  if (!resolved) {
    return (
      <div className="space-y-3" data-testid="compare-loading">
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div
        className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"
        data-testid="compare-empty-client"
      >
        {locale === 'en'
          ? 'No listings selected. Browse listings and tap "Compare" on at least 2.'
          : 'Henüz karşılaştırma seçimi yok. İlanlara göz atın ve en az 2 tanesine "Karşılaştır" deyin.'}
      </div>
    )
  }

  return (
    <div
      className="space-y-4"
      data-only-diff={onlyDiff ? 'true' : 'false'}
      data-compare-root=""
    >
      <CompareShareButton
        ids={listings.map((l) => l.id)}
        locale={locale}
        onlyDiff={onlyDiff}
        onToggleOnlyDiff={() => setOnlyDiff((v) => !v)}
      />
      {/* Wave F24.B — primary view is the 6-up CompareGrid. We keep the
          F9.A CompareTable / MobileCompareStack rendered below as the
          "full diff" detail view; print/PDF export still flows through the
          table because it has all the legacy fields (zoning, tapu, yol…).
          The grid is the "at-a-glance" comparison and is the only view that
          uses DifferenceHighlight (emerald/rose tint on the best/worst). */}
      <CompareGrid listings={listings} locale={locale} />
      <CompareTable listings={listings} locale={locale} />
      <MobileCompareStack listings={listings} locale={locale} />
    </div>
  )
}
