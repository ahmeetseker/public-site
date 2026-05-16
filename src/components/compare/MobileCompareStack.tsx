import type { Listing } from '@landx/data'

import { findDiffs, type CompareRow } from '@/lib/compare-diff'

export interface MobileCompareStackProps {
  listings: Listing[]
  locale: 'tr' | 'en'
}

interface RowDef {
  key: string
  tr: string
  en: string
  get: (l: Listing) => unknown
  fmt?: (v: unknown) => string
}

const PRICE_FMT = new Intl.NumberFormat('tr-TR')

const ROW_DEFS: RowDef[] = [
  {
    key: 'price',
    tr: 'Fiyat',
    en: 'Price',
    get: (l) => l.price,
    fmt: (v) => `${PRICE_FMT.format(Number(v))} ₺`,
  },
  {
    key: 'size',
    tr: 'Alan',
    en: 'Size',
    get: (l) => l.size,
    fmt: (v) => `${v} m²`,
  },
  {
    key: 'district',
    tr: 'Bölge',
    en: 'Region',
    get: (l) => `${l.district}, ${l.city}`,
  },
  {
    key: 'zoning',
    tr: 'İmar',
    en: 'Zoning',
    get: (l) => l.zoning ?? null,
    fmt: (v) => (v ? String(v) : '—'),
  },
  {
    key: 'titleStatus',
    tr: 'Tapu',
    en: 'Title',
    get: (l) => l.titleStatus ?? null,
    fmt: (v) => (v ? String(v) : '—'),
  },
  {
    key: 'hasRoad',
    tr: 'Yol',
    en: 'Road',
    get: (l) => l.hasRoad ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
  {
    key: 'hasWater',
    tr: 'Su',
    en: 'Water',
    get: (l) => l.hasWater ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
  {
    key: 'hasElectricity',
    tr: 'Elektrik',
    en: 'Electricity',
    get: (l) => l.hasElectricity ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
]

export default function MobileCompareStack({
  listings,
  locale,
}: MobileCompareStackProps) {
  const compareRows: CompareRow[] = ROW_DEFS.map((r) => ({
    key: r.key,
    values: listings.map(r.get),
  }))
  const diffs = findDiffs(compareRows)
  const label = (r: RowDef): string => (locale === 'en' ? r.en : r.tr)

  // Wave F9.A — 4-listing comparison stacks vertically; scroll-snap-y keeps
  // each card "snapped" so users can flick through. Beyond 4 we'd want a
  // horizontal carousel, but spec caps at 4.
  return (
    <div
      className="space-y-4 snap-y snap-mandatory md:hidden"
      data-testid="compare-mobile"
      data-compare-count={listings.length}
    >
      {listings.map((l) => (
        <article
          key={l.id}
          className="snap-start rounded-2xl border border-border bg-card p-4"
          data-testid="compare-mobile-card"
        >
          <header className="sticky top-0 -mx-4 -mt-4 mb-3 rounded-t-2xl border-b border-border bg-card px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">{l.title}</h3>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {l.district}, {l.city}
            </p>
          </header>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
            {ROW_DEFS.map((row) => {
              const isDiff = diffs.has(row.key)
              const raw = row.get(l)
              return (
                <div
                  key={row.key}
                  className="contents"
                  data-row-key={row.key}
                  data-diff={isDiff ? 'true' : 'false'}
                >
                  <dt className="text-muted-foreground">
                    {label(row)}
                    {isDiff && (
                      <span
                        className="ml-1 text-[9px] text-foreground/60"
                        aria-label={locale === 'en' ? 'differs' : 'farklı'}
                      >
                        •
                      </span>
                    )}
                  </dt>
                  <dd
                    className={
                      isDiff
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {row.fmt ? row.fmt(raw) : String(raw)}
                  </dd>
                </div>
              )
            })}
          </dl>
        </article>
      ))}
    </div>
  )
}
