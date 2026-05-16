import { useMemo, useState, type ReactElement } from 'react'
import { computeForecast, computeNegotiationAdvice } from '@landx/ai'

export interface NegotiationCoachProps {
  listingId: string
  listedPrice: number
}

export function NegotiationCoach({
  listingId,
  listedPrice,
}: NegotiationCoachProps): ReactElement {
  const [open, setOpen] = useState(false)
  const forecast = useMemo(
    () => computeForecast({ listingId, currentPrice: listedPrice }),
    [listingId, listedPrice],
  )
  const advice = useMemo(
    () =>
      computeNegotiationAdvice({
        listingId,
        listedPrice,
        avmExpected: forecast.expected,
      }),
    [listingId, listedPrice, forecast.expected],
  )

  const bandColor =
    advice.band === 'overpriced' ? 'text-amber-700 dark:text-amber-300' :
      advice.band === 'bargain' ? 'text-emerald-700 dark:text-emerald-300' :
        'text-foreground'

  const bandLabel =
    advice.band === 'overpriced' ? 'Yüksek fiyatlı' :
      advice.band === 'bargain' ? 'Fırsat' : 'Adil'

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="font-serif text-base">AI müzakere koçu</h3>
          <span className={`mt-1 inline-flex items-center text-xs font-medium ${bandColor}`}>
            {bandLabel} · sapma %{advice.deltaPct}
          </span>
        </div>
        <span className="font-mono text-xs">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Önerilen teklif</div>
            <div className="mt-1 text-lg font-medium tabular-nums">
              ₺{advice.suggestedOffer.toLocaleString('tr-TR')}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Gerekçe</div>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              {advice.rationale.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Bu öneri AVM mock'undan üretilmiştir, resmi danışmanlık değildir.
          </p>
        </div>
      )}
    </article>
  )
}

export default NegotiationCoach
