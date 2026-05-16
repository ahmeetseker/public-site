// Homepage section, mounted below Hero. Same data + empty-state contract as
// the /ara carousel, just laid out as a uniform responsive grid.
//
// Wave F24.B — surfaced empty state (was `return null`), added a "Clear all"
// affordance, bumped max items 6 → 12, and made the date sort explicit so
// newest entries always lead. ARIA labels were tightened on the grid item
// links so each card announces title + price together rather than blasting
// the same heading on every card.
import { useEffect, useState } from 'react'
import { getRecent, clearRecent, type RecentItem } from '@/lib/recent-views'

// Currency is always TRY regardless of UI locale — keep tr-TR grouping.
function fmtPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR').format(price) + ' ₺'
}

function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang === 'en' ? 'en' : 'tr'
}

const MAX_ITEMS = 12

export default function RecentViewedSection() {
  const [items, setItems] = useState<RecentItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const locale = detectLocale()
  const labels =
    locale === 'en'
      ? {
          heading: 'Recently viewed',
          backLabel: 'Back to search →',
          empty: 'No listings viewed yet.',
          clear: 'Clear all',
          clearAria: 'Clear all recently viewed listings',
        }
      : {
          heading: 'Son baktıklarınız',
          backLabel: 'Aramaya dön →',
          empty: 'Henüz görüntülenen ilan yok.',
          clear: 'Tümünü temizle',
          clearAria: 'Son baktıklarınızı tümüyle temizle',
        }

  useEffect(() => {
    const recent = getRecent()
      .slice()
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, MAX_ITEMS)
    setItems(recent)
    setHydrated(true)
  }, [])

  // Pre-hydration we render nothing — the homepage doesn't reserve vertical
  // space until we know whether there's anything to show. Empty state only
  // shows post-hydration so SSR markup stays clean.
  if (!hydrated) return null

  if (items.length === 0) {
    return (
      <section
        aria-label={labels.heading}
        className="mx-auto max-w-[1400px] px-4 py-8 md:py-12"
        data-testid="recent-section"
        data-recent-empty="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground md:text-xl">
            {labels.heading}
          </h2>
          <a
            href="/ara"
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
          >
            {labels.backLabel}
          </a>
        </div>
        <p
          className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"
          data-testid="recent-empty"
        >
          {labels.empty}
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label={labels.heading}
      className="mx-auto max-w-[1400px] px-4 py-8 md:py-12"
      data-testid="recent-section"
      data-recent-count={items.length}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground md:text-xl">
          {labels.heading}
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              clearRecent()
              setItems([])
            }}
            aria-label={labels.clearAria}
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus-visible:underline"
            data-testid="recent-section-clear"
          >
            {labels.clear}
          </button>
          <a
            href="/ara"
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
          >
            {labels.backLabel}
          </a>
        </div>
      </div>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        data-testid="recent-grid"
      >
        {items.map((it) => (
          <li key={it.slug}>
            <a
              href={`/ilan/${it.slug}`}
              aria-label={`${it.title} · ${fmtPrice(it.price)}`}
              className="block rounded-2xl border border-border bg-card p-2 transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
                <img
                  src={it.image}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-2 line-clamp-2 text-xs font-medium text-foreground">
                {it.title}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {fmtPrice(it.price)}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
