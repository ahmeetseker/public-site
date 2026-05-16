/**
 * CategoryListingsIsland — /kategori/[slug] (Wave F32 / W4).
 *
 * Kategori arşivi liste görünümü + alt-kategori chip filter (tag-based).
 * Astro frontmatter listings'i `type` filtresinden geçirip props olarak verir;
 * island sadece chip seçimine göre client-side daraltır + render eder.
 *
 * Faz 1 hook (`useCategoryListings`) CategoryArchive metadata'sını döndürür
 * (kapsadığı listing id listesi + filter href'i). Public-site'da
 * QueryClientProvider olmadığı için Astro frontmatter mock'tan filter yapıyor;
 * island react-end render + interaktif chip'i yönetiyor.
 */
import { useMemo, useState } from 'react'
import { formatTLCompact, formatArea } from '@landx/ui/lib'
import type { Listing } from '@landx/data'

type Locale = 'tr' | 'en'

interface Props {
  listings: Listing[]
  locale?: Locale
}

const COPY = {
  tr: {
    all: 'Tümü',
    count: (n: number) => `${n} ilan`,
    empty: 'Bu filtre için ilan bulunamadı.',
    detail: 'İncele',
  },
  en: {
    all: 'All',
    count: (n: number) => `${n} listings`,
    empty: 'No listings match this filter.',
    detail: 'View',
  },
} as const

function slugify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoryListingsIsland({ listings, locale = 'tr' }: Props) {
  const copy = COPY[locale]
  const prefix = locale === 'en' ? '/en' : ''

  // Tag bazlı alt-kategori chip listesi (en sık 6 tag)
  const tagChips = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of listings) {
      for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))
  }, [listings])

  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(
    () => (activeTag ? listings.filter((l) => l.tags.includes(activeTag)) : listings),
    [listings, activeTag],
  )

  return (
    <div data-category-listings-island="" className="flex flex-col gap-5">
      {/* Chip filter */}
      {tagChips.length > 0 && (
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filtre"
          data-testid="category-chips"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTag === null}
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activeTag === null
                ? 'border-foreground/20 bg-foreground/10 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            data-chip="all"
          >
            {copy.all} · {listings.length}
          </button>
          {tagChips.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              role="tab"
              aria-selected={activeTag === tag}
              onClick={() => setActiveTag(tag)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeTag === tag
                  ? 'border-foreground/20 bg-foreground/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
              data-chip={tag}
            >
              {tag} · {count}
            </button>
          ))}
        </div>
      )}

      <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {copy.count(filtered.length)}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground"
          data-testid="category-empty"
        >
          {copy.empty}
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="category-grid"
        >
          {filtered.map((l) => {
            const href = `${prefix}/ilan/${slugify(l.title)}-${l.id}`
            return (
              <li key={l.id} data-listing-id={l.id}>
                <a
                  href={href}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20 hover:shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {l.id}
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {l.type}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 font-serif text-base leading-snug tracking-tight text-foreground">
                    {l.title}
                  </h3>
                  <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {l.city} · {l.district}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div className="font-serif text-lg font-medium tracking-tight">
                      {formatTLCompact(l.price)}
                    </div>
                    <div className="font-mono text-xs tabular-nums text-muted-foreground">
                      {formatArea(l.size)}
                    </div>
                  </div>
                  {l.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {l.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
