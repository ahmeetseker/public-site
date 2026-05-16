/**
 * Wave F6 / Agent-F6D — pure SVG 12-bar trend chart for /bölge[slug].
 *
 * No chart lib. Each bar carries a native `<title>` for desktop hover tooltips
 * (works as a tooltip in every browser without extra JS) and a React-driven
 * floating tooltip for richer styling. The active bar tracks pointer events
 * so we get a visual highlight on hover/focus — and Tab focus keeps the bars
 * keyboard-discoverable, satisfying a11y for vanilla SVG charts.
 */
import { useId, useMemo, useState } from 'react'

type Locale = 'tr' | 'en'

interface Props {
  /** 12 deterministic monthly values from `computeStats()`. */
  data: number[]
  /** Optional aria label override. */
  ariaLabel?: string
  locale?: Locale
}

const COPY = {
  tr: {
    monthsShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    valueLabel: '₺/m²',
    chartLabel: 'Aylık fiyat trendi',
  },
  en: {
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    valueLabel: '₺/m²',
    chartLabel: 'Monthly price trend',
  },
} as const

const VIEW_W = 320
const VIEW_H = 120
const PADDING_X = 8
const PADDING_TOP = 8
const PADDING_BOTTOM = 22

function formatNumber(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')
}

/** Snap the calendar month label to the *trailing* 12 months ending on the current one. */
function monthLabels(locale: Locale): string[] {
  const names = COPY[locale].monthsShort
  const now = new Date()
  const currentIdx = now.getMonth() // 0..11
  const labels: string[] = []
  for (let offset = 11; offset >= 0; offset--) {
    const m = (((currentIdx - offset) % 12) + 12) % 12
    labels.push(names[m])
  }
  return labels
}

export default function PriceTrendChart({ data, ariaLabel, locale = 'tr' }: Props) {
  const copy = COPY[locale]
  const reactId = useId()
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const bars = useMemo(() => {
    const max = Math.max(1, ...data)
    const chartW = VIEW_W - PADDING_X * 2
    const chartH = VIEW_H - PADDING_TOP - PADDING_BOTTOM
    const slot = chartW / data.length
    const barW = Math.max(6, slot - 4)
    return data.map((v, i) => {
      const h = (v / max) * chartH
      const x = PADDING_X + slot * i + (slot - barW) / 2
      const y = PADDING_TOP + (chartH - h)
      return { x, y, w: barW, h, v, i }
    })
  }, [data])

  const labels = useMemo(() => monthLabels(locale), [locale])

  return (
    <figure
      data-price-trend-chart=""
      data-locale={locale}
      className="relative w-full"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={ariaLabel ?? copy.chartLabel}
        preserveAspectRatio="none"
        className="block h-32 w-full"
      >
        {bars.map((b) => {
          const isActive = activeIdx === b.i
          return (
            <g
              key={b.i}
              tabIndex={0}
              data-price-trend-bar=""
              data-month-index={b.i}
              onMouseEnter={() => setActiveIdx(b.i)}
              onMouseLeave={() => setActiveIdx((cur) => (cur === b.i ? null : cur))}
              onFocus={() => setActiveIdx(b.i)}
              onBlur={() => setActiveIdx((cur) => (cur === b.i ? null : cur))}
              className="cursor-pointer outline-none"
              aria-describedby={`${reactId}-tip-${b.i}`}
            >
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={2}
                ry={2}
                className={isActive ? 'fill-foreground' : 'fill-foreground/55'}
              >
                <title>{`${labels[b.i]} · ${formatNumber(b.v, locale)} ${copy.valueLabel}`}</title>
              </rect>
              {/* Visually hidden description for screen readers */}
              <desc id={`${reactId}-tip-${b.i}`}>{`${labels[b.i]} ${formatNumber(b.v, locale)} ${copy.valueLabel}`}</desc>
            </g>
          )
        })}
        {bars.map((b) => (
          <text
            key={`l-${b.i}`}
            x={b.x + b.w / 2}
            y={VIEW_H - 6}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[8px]"
          >
            {labels[b.i]}
          </text>
        ))}
      </svg>

      {activeIdx !== null && (
        <div
          data-price-trend-tooltip=""
          className="pointer-events-none absolute left-0 top-0 inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs shadow-md"
          style={{
            transform: `translate(${(bars[activeIdx].x / VIEW_W) * 100}%, -100%)`,
          }}
        >
          <span className="font-mono text-muted-foreground">{labels[activeIdx]}</span>
          <span className="tabular-nums text-foreground">
            {formatNumber(bars[activeIdx].v, locale)} {copy.valueLabel}
          </span>
        </div>
      )}
    </figure>
  )
}
