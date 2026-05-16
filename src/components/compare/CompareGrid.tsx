// CompareGrid — Wave F24.B.
//
// Responsive 6-up grid for the /karsilastir page. Each listing gets a
// vertically-stacked card with the same metric rows; the parent threads the
// rows through DifferenceHighlight so the "best" / "worst" cells across the
// row get an emerald/rose tint.
//
// Why a grid (not a table) at 6-up: a 7-column table (label + 6 values) blows
// past viewport budgets on every breakpoint below 2xl. Stacking values per
// listing keeps each card scannable and lets the diff tint sit inside the
// card chrome instead of on a striped row. Tablet collapses to 3-up; mobile
// to 2-up so the comparison is always at least pairwise.
//
// Token-only colours (border, card, foreground, muted-foreground, accent +
// the emerald/rose tier from DifferenceHighlight).

import type { Listing } from '@landx/data'

import {
  DifferenceHighlight,
  tintClass,
  type DifferenceTint,
} from '@landx/ui/feedback'

export interface CompareGridProps {
  listings: Listing[]
  locale: 'tr' | 'en'
}

const PRICE_FMT = new Intl.NumberFormat('tr-TR')

interface MetricRow {
  key: string
  trLabel: string
  enLabel: string
  /** Map a listing → numeric value used for ranking. */
  rank: (l: Listing) => number
  /** Format the cell display string. */
  format: (l: Listing, locale: 'tr' | 'en') => string
  /** When true the *lower* number wins (e.g. ₺/m²). */
  invertBest?: boolean
}

const METRICS: MetricRow[] = [
  {
    key: 'price',
    trLabel: 'Fiyat',
    enLabel: 'Price',
    rank: (l) => l.price,
    format: (l) => `${PRICE_FMT.format(l.price)} ₺`,
  },
  {
    key: 'size',
    trLabel: 'Alan (m²)',
    enLabel: 'Size (m²)',
    rank: (l) => l.size,
    format: (l, loc) =>
      `${l.size.toLocaleString(loc === 'en' ? 'en-US' : 'tr-TR')} m²`,
  },
  {
    key: 'pricePerSqm',
    trLabel: 'Fiyat / m²',
    enLabel: 'Price / m²',
    rank: (l) => Math.round(l.price / l.size),
    format: (l) => `${PRICE_FMT.format(Math.round(l.price / l.size))} ₺/m²`,
    invertBest: true,
  },
  {
    key: 'views',
    trLabel: 'Görüntülenme',
    enLabel: 'Views',
    rank: (l) => l.views,
    format: (l, loc) =>
      l.views.toLocaleString(loc === 'en' ? 'en-US' : 'tr-TR'),
  },
]

// Categorical (no tint) — rendered as plain rows after the ranked metrics.
interface CategoricalRow {
  key: string
  trLabel: string
  enLabel: string
  get: (l: Listing) => string
}

const CATEGORICAL: CategoricalRow[] = [
  {
    key: 'type',
    trLabel: 'Tür',
    enLabel: 'Type',
    get: (l) => l.type,
  },
  {
    key: 'district',
    trLabel: 'Bölge',
    enLabel: 'Region',
    get: (l) => `${l.district}, ${l.city}`,
  },
]

export default function CompareGrid({ listings, locale }: CompareGridProps) {
  if (listings.length === 0) return null
  const label = (m: { trLabel: string; enLabel: string }): string =>
    locale === 'en' ? m.enLabel : m.trLabel

  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      data-testid="compare-grid"
      data-compare-count={listings.length}
      data-compare-locale={locale}
    >
      {listings.map((l, columnIndex) => (
        <article
          key={l.id}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
          data-testid="compare-grid-card"
          data-listing-id={l.id}
          data-column-index={columnIndex}
        >
          {l.images && l.images[0] && (
            <a
              href={`${locale === 'en' ? '/en' : ''}/ilan/${l.id}`}
              className="block aspect-[16/10] w-full overflow-hidden bg-foreground/5"
              aria-label={l.title}
            >
              <img
                src={l.images[0]}
                alt={l.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </a>
          )}
          <div className="flex flex-1 flex-col p-4">
          <header className="mb-3 border-b border-border pb-2">
            <h3 className="line-clamp-2 text-sm font-medium text-foreground">
              {l.title}
            </h3>
            <p className="mt-1 truncate font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {l.district}, {l.city}
            </p>
          </header>

          <dl className="space-y-2 text-xs">
            {METRICS.map((metric) => {
              // For each metric we slice across all listings → produce the
              // per-column cell. DifferenceHighlight walks every column but
              // we render only the cell at `columnIndex` to keep the markup
              // tied to this card. Tints are computed once per row regardless.
              return (
                <DifferenceHighlight
                  key={metric.key}
                  values={listings}
                  comparator={metric.rank}
                  invertBest={metric.invertBest}
                  renderCell={(value, tint, idx) => {
                    if (idx !== columnIndex) return null
                    return (
                      <div
                        className="flex items-center justify-between gap-2"
                        data-row-key={metric.key}
                        data-diff-tint={tint}
                        data-testid="compare-grid-metric"
                      >
                        <dt className="text-muted-foreground">{label(metric)}</dt>
                        <dd
                          className={`rounded-md px-1.5 py-0.5 font-medium tabular-nums ${tintClass(
                            tint,
                          )}`}
                        >
                          {metric.format(value, locale)}
                        </dd>
                      </div>
                    )
                  }}
                />
              )
            })}

            {CATEGORICAL.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2"
                data-row-key={row.key}
                data-diff-tint={'neutral' satisfies DifferenceTint}
              >
                <dt className="text-muted-foreground">{label(row)}</dt>
                <dd className="text-right font-medium text-foreground">
                  {row.get(l)}
                </dd>
              </div>
            ))}
          </dl>

          <footer className="mt-3 border-t border-border pt-2">
            <a
              href={`${locale === 'en' ? '/en' : ''}/ilan/${l.id}`}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus-visible:underline"
            >
              {locale === 'en' ? 'View listing →' : 'İlanı gör →'}
            </a>
          </footer>
          </div>
        </article>
      ))}
    </div>
  )
}
