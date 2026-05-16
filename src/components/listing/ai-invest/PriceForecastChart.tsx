/**
 * PriceForecastChart — F37 Faz 4.A / M bölüm.
 *
 * 12-ay AI fiyat tahmini grafiği. `computeForecast` ile hash-deterministic
 * range + expected hesaplanır. SVG line + band, faktörler chip listesi.
 */
import { useMemo, type ReactElement } from 'react'
import { computeForecast } from '@landx/ai'

export interface PriceForecastChartProps {
  listingId: string
  currentPrice: number
}

export function PriceForecastChart({
  listingId,
  currentPrice,
}: PriceForecastChartProps): ReactElement {
  const forecast = useMemo(
    () => computeForecast({ listingId, currentPrice }),
    [listingId, currentPrice],
  )

  // 12 ay için interpolation (current → expected linearly)
  const months = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    return {
      month: i,
      expected: currentPrice + (forecast.expected - currentPrice) * t,
      low: currentPrice + (forecast.rangeLow - currentPrice) * t,
      high: currentPrice + (forecast.rangeHigh - currentPrice) * t,
    }
  })

  const minY = Math.min(...months.map((m) => m.low)) * 0.95
  const maxY = Math.max(...months.map((m) => m.high)) * 1.05
  const range = maxY - minY

  const pathExpected = months
    .map((m, i) => `${i === 0 ? 'M' : 'L'} ${(i / 12) * 300} ${100 - ((m.expected - minY) / range) * 100}`)
    .join(' ')

  const bandPoints = months
    .map((m, i) => `${(i / 12) * 300},${100 - ((m.high - minY) / range) * 100}`)
    .concat(
      months
        .slice()
        .reverse()
        .map((m, i) => `${((12 - i) / 12) * 300},${100 - ((m.low - minY) / range) * 100}`),
    )
    .join(' ')

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-end justify-between">
        <h3 className="font-serif text-base">12 ay fiyat tahmini</h3>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
          Güven %{Math.round(forecast.confidence * 100)}
        </span>
      </div>
      <svg viewBox="0 0 300 100" className="w-full h-32" role="img" aria-label="Fiyat tahmin grafiği">
        <polygon points={bandPoints} fill="currentColor" opacity={0.1} />
        <path d={pathExpected} fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Düşük</div>
          <div className="font-mono tabular-nums">₺{forecast.rangeLow.toLocaleString('tr-TR')}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Beklenen</div>
          <div className="font-mono font-medium tabular-nums">₺{forecast.expected.toLocaleString('tr-TR')}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Yüksek</div>
          <div className="font-mono tabular-nums">₺{forecast.rangeHigh.toLocaleString('tr-TR')}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Etkenler</div>
        <ul className="flex flex-wrap gap-1">
          {forecast.factors.map((f) => (
            <li key={f} className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default PriceForecastChart
