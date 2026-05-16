/**
 * Wave F6 / Agent-F6D — /bölge[slug] stat panel.
 *
 * Renders 4 stat cards + the 12-month PriceTrendChart. Pure presentational —
 * stats are computed eagerly from the same listings the page already has,
 * so the island hydrates with the same numbers the SSR card would have
 * shown (deterministic). Locale-aware copy & formatting.
 */
import { useMemo } from 'react'
import type { Listing } from '@landx/data'
import { computeStats } from '../../lib/bolge-stats'
import PriceTrendChart from './PriceTrendChart'

type Locale = 'tr' | 'en'

interface Props {
  /** Bolge slug — deterministic seed for the trend chart. */
  bolge: string
  /** Listings already filtered to this bolge by the caller. */
  listings: Listing[]
  locale?: Locale
}

const COPY = {
  tr: {
    heading: 'Bölge istatistikleri',
    avgPricePerSqm: 'Ortalama ₺/m²',
    totalListings: 'Toplam ilan',
    newLast30Days: 'Son 30 günde yeni',
    sizeRange: 'Parsel aralığı',
    sizeRangeUnit: 'm²',
    trendHeading: 'Son 12 ayın fiyat trendi',
    noData: 'Bu bölge için yeterli veri yok.',
  },
  en: {
    heading: 'Region statistics',
    avgPricePerSqm: 'Average ₺/m²',
    totalListings: 'Total listings',
    newLast30Days: 'New in last 30 days',
    sizeRange: 'Plot size range',
    sizeRangeUnit: 'm²',
    trendHeading: 'Last 12 months price trend',
    noData: 'Not enough data for this region.',
  },
} as const

function fmt(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')
}

export default function BolgeStats({ bolge, listings, locale = 'tr' }: Props) {
  const copy = COPY[locale]
  const stats = useMemo(() => computeStats(bolge, listings), [bolge, listings])

  const cards = [
    {
      key: 'avgPricePerSqm',
      label: copy.avgPricePerSqm,
      value: stats.avgPricePerSqm > 0 ? fmt(stats.avgPricePerSqm, locale) : '—',
    },
    {
      key: 'totalListings',
      label: copy.totalListings,
      value: fmt(stats.totalListings, locale),
    },
    {
      key: 'newLast30Days',
      label: copy.newLast30Days,
      value: fmt(stats.newLast30Days, locale),
    },
    {
      key: 'sizeRange',
      label: copy.sizeRange,
      value:
        stats.smallestSize > 0 && stats.largestSize > 0
          ? `${fmt(stats.smallestSize, locale)} – ${fmt(stats.largestSize, locale)} ${copy.sizeRangeUnit}`
          : '—',
    },
  ]

  return (
    <section
      data-bolge-stats=""
      data-bolge={bolge}
      className="mx-auto max-w-[1280px] px-4 py-6 md:py-8"
    >
      <h2 className="font-serif text-2xl font-normal tracking-tight md:text-3xl">
        {copy.heading}
      </h2>

      <div
        data-bolge-stats-cards=""
        className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      >
        {cards.map((c) => (
          <div
            key={c.key}
            data-bolge-stats-card={c.key}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-2 font-mono text-2xl font-normal tabular-nums text-foreground md:text-3xl">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        data-bolge-stats-trend=""
        className="mt-6 rounded-2xl border border-border bg-card p-4 md:p-5"
      >
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {copy.trendHeading}
        </div>
        <PriceTrendChart data={stats.monthlyTrend} locale={locale} ariaLabel={copy.trendHeading} />
      </div>
    </section>
  )
}
