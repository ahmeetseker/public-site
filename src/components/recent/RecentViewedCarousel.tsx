// Mounted on /ara above the results grid. Mobile: snap-x horizontal carousel.
// Desktop: 6-column grid. Empty state → renders nothing (avoids reserving
// vertical space for users who haven't seen anything yet).
import { useEffect, useState } from 'react'
import { getRecent, type RecentItem } from '@/lib/recent-views'

// Currency is always TRY regardless of UI locale — keep tr-TR grouping.
function fmtPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR').format(price) + ' ₺'
}

function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang === 'en' ? 'en' : 'tr'
}

export default function RecentViewedCarousel() {
  const [items, setItems] = useState<RecentItem[]>([])
  const locale = detectLocale()
  const heading = locale === 'en' ? 'Recently viewed' : 'Son baktıklarınız'

  useEffect(() => {
    setItems(getRecent().slice(0, 6))
  }, [])

  if (items.length === 0) return null

  return (
    <section
      aria-label={heading}
      className="mb-6"
      data-testid="recent-carousel"
    >
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {heading}
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-6">
        {items.map((it) => (
          <a
            key={it.slug}
            href={`/ilan/${it.slug}`}
            className="block w-44 shrink-0 snap-start rounded-2xl border border-border bg-card p-2 transition hover:bg-accent md:w-auto"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
              <img
                src={it.image}
                alt={it.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{it.title}</div>
            <div className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {fmtPrice(it.price)}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
