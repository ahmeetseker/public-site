/**
 * UserAnalyticsIsland — /hesabim/analitik (Wave F32 / W4).
 *
 * Bireysel kullanıcı ilan analitiği. KPI cards üstte (4 kart), altta 30 günlük
 * çoklu seri line chart (views/clicks/messages), en altta top-5 ilan tablosu.
 *
 * Public-site'da QueryClientProvider yok — Faz 1 hook'ları (useUserAnalytics)
 * doğrudan TanStack Query'ye bağlı, bu yüzden mock seed'i import ediyoruz.
 * Faz 3+'ta QueryClientProvider wrap'i eklenince hook geçişi tek satır olur.
 *
 * Recharts ResponsiveContainer ResizeObserver kullanır → `client:only="react"`
 * direktifi ile yüklenmeli (Astro SSR ile uyumsuz).
 */
import { useMemo, useState } from 'react'
import { LazyChart } from '@landx/ui/charts'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { USER_ANALYTICS } from '@landx/data'

type Locale = 'tr' | 'en'

interface Props {
  locale?: Locale
}

const COPY = {
  tr: {
    rangeLabel: 'Son 30 gün',
    kpis: {
      views: 'Toplam görüntülenme',
      clicks: 'Tıklama',
      messages: 'Mesaj',
      ctr: 'CTR (Tıklama / Gösterim)',
    },
    chartTitle: 'Günlük etkileşim',
    chartHint: 'Hover ile günlük detay',
    series: { views: 'Görüntülenme', clicks: 'Tıklama', messages: 'Mesaj' },
    topTitle: 'En çok görüntülenen ilanların',
    topEmphasis: 'ilk 5’i',
    topHeader: { rank: '#', title: 'İlan', views: 'Görüntülenme' },
    chartAria: '30 günlük görüntülenme, tıklama ve mesaj zaman serisi',
  },
  en: {
    rangeLabel: 'Last 30 days',
    kpis: {
      views: 'Total views',
      clicks: 'Clicks',
      messages: 'Messages',
      ctr: 'CTR (clicks / views)',
    },
    chartTitle: 'Daily engagement',
    chartHint: 'Hover for daily detail',
    series: { views: 'Views', clicks: 'Clicks', messages: 'Messages' },
    topTitle: 'Top 5',
    topEmphasis: 'most viewed',
    topHeader: { rank: '#', title: 'Listing', views: 'Views' },
    chartAria: '30-day time series of views, clicks and messages',
  },
} as const

function formatNumber(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')
}

function formatPercent(p: number, locale: Locale): string {
  // p is 0..1
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(p)
}

function formatChartDate(iso: string, locale: Locale): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export default function UserAnalyticsIsland({ locale = 'tr' }: Props) {
  const copy = COPY[locale]
  const data = USER_ANALYTICS

  // Recharts X axis label: kısa "12 May" formatı
  const chartData = useMemo(
    () =>
      data.daily.map((d) => ({
        ...d,
        label: formatChartDate(d.date, locale),
      })),
    [data.daily, locale],
  )

  const kpis = [
    { key: 'views', label: copy.kpis.views, value: formatNumber(data.totals.views, locale) },
    { key: 'clicks', label: copy.kpis.clicks, value: formatNumber(data.totals.clicks, locale) },
    { key: 'messages', label: copy.kpis.messages, value: formatNumber(data.totals.messages, locale) },
    { key: 'ctr', label: copy.kpis.ctr, value: formatPercent(data.totals.ctr, locale) },
  ]

  const [activeSeries, setActiveSeries] = useState<'views' | 'clicks' | 'messages'>('views')

  return (
    <div data-user-analytics-island="" className="flex flex-col gap-6">
      {/* KPI cards */}
      <section
        aria-label={copy.kpis.views + ' / ' + copy.kpis.clicks}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        data-testid="analytics-kpis"
      >
        {kpis.map((k) => (
          <div
            key={k.key}
            data-kpi={k.key}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4"
          >
            <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {k.label}
            </div>
            <div className="font-serif text-2xl font-normal tracking-tight tabular-nums md:text-3xl">
              {k.value}
            </div>
            <div className="font-mono text-xs text-muted-foreground">{copy.rangeLabel}</div>
          </div>
        ))}
      </section>

      {/* Chart */}
      <section
        aria-label={copy.chartTitle}
        className="rounded-2xl border border-border bg-card p-4 md:p-5"
        data-testid="analytics-chart"
      >
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg tracking-tight">{copy.chartTitle}</h2>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {copy.chartHint}
            </p>
          </div>
          <div className="flex gap-1.5" role="tablist" aria-label={copy.chartTitle}>
            {(['views', 'clicks', 'messages'] as const).map((s) => {
              const isActive = activeSeries === s
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveSeries(s)}
                  className={`rounded-full px-2.5 py-1 font-mono text-xs uppercase tracking-wide transition ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                  data-series={s}
                >
                  {copy.series[s]}
                </button>
              )
            })}
          </div>
        </header>

        <LazyChart height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
              role="img"
              aria-label={copy.chartAria}
            >
              <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
                tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={42}
                tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }}
              />
              <Tooltip
                cursor={{ stroke: 'currentColor', strokeOpacity: 0.12 }}
                contentStyle={{
                  background: 'var(--card, #fff)',
                  border: '1px solid var(--border, #e5e5e5)',
                  borderRadius: 12,
                  fontSize: 12,
                  padding: '8px 10px',
                }}
              />
              <Line
                type="monotone"
                dataKey={activeSeries}
                name={copy.series[activeSeries]}
                stroke="currentColor"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </LazyChart>
      </section>

      {/* Top 5 listings */}
      <section
        aria-label={copy.topTitle}
        className="rounded-2xl border border-border bg-card p-4 md:p-5"
        data-testid="analytics-top"
      >
        <h2 className="mb-3 font-serif text-lg tracking-tight">
          {copy.topTitle}{' '}
          <em className="font-serif italic font-normal text-foreground/80">{copy.topEmphasis}</em>
        </h2>
        <ol className="flex flex-col divide-y divide-border" aria-label={copy.topTitle}>
          <li className="hidden grid-cols-[32px_1fr_120px] gap-3 py-2 font-mono text-xs uppercase tracking-wide text-muted-foreground md:grid">
            <span>{copy.topHeader.rank}</span>
            <span>{copy.topHeader.title}</span>
            <span className="text-right">{copy.topHeader.views}</span>
          </li>
          {data.topListings.map((it, idx) => (
            <li
              key={it.id}
              data-listing-id={it.id}
              className="grid grid-cols-[32px_1fr_auto] items-center gap-3 py-3"
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{it.title}</div>
                <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {it.id}
                </div>
              </div>
              <span className="font-serif text-base tabular-nums text-foreground">
                {formatNumber(it.views, locale)}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
