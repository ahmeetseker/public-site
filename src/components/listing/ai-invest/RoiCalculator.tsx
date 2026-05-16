import { useState, useMemo, type ReactElement, type ChangeEvent } from 'react'
import { computeRoi } from '@landx/ai'

export interface RoiCalculatorProps {
  listingId: string
  price: number
  /** Default tahmini aylık kira — undefined ise %5 yıllık yield varsayılır. */
  defaultMonthlyRent?: number
}

export function RoiCalculator({
  price,
  defaultMonthlyRent,
}: RoiCalculatorProps): ReactElement {
  const initial = defaultMonthlyRent ?? Math.round((price * 0.05) / 12)
  const [monthlyRent, setMonthlyRent] = useState(initial)

  const roi = useMemo(() => computeRoi({ price, monthlyRent }), [price, monthlyRent])

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-3">Yatırım getirisi hesabı</h3>
      <label className="block">
        <span className="text-xs text-muted-foreground">Aylık kira (TL)</span>
        <input
          type="range"
          min={Math.round(initial * 0.5)}
          max={Math.round(initial * 1.8)}
          step={500}
          value={monthlyRent}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMonthlyRent(Number(e.target.value))}
          className="mt-1 w-full"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            ₺{roi.rangeLow.toLocaleString('tr-TR')}
          </span>
          <span className="font-mono font-medium tabular-nums">
            ₺{monthlyRent.toLocaleString('tr-TR')}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            ₺{roi.rangeHigh.toLocaleString('tr-TR')}
          </span>
        </div>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Yıllık getiri</div>
          <div className="mt-0.5 text-lg font-medium tabular-nums">%{roi.yieldPct}</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Geri ödeme</div>
          <div className="mt-0.5 text-lg font-medium tabular-nums">{roi.paybackYears} yıl</div>
        </div>
      </div>
    </article>
  )
}

export default RoiCalculator
