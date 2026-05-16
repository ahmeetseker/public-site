import { type ReactElement } from 'react'

export interface MortgagePreApprovalCtaProps {
  price: number
  creditEligible: boolean
}

export function MortgagePreApprovalCta({
  price,
  creditEligible,
}: MortgagePreApprovalCtaProps): ReactElement {
  if (!creditEligible) {
    return (
      <article className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-serif text-base mb-2">Kredi</h3>
        <p className="text-sm text-muted-foreground">
          Bu ilan banka kredisine uygun olarak işaretlenmemiş. Banka şubenize danışın.
        </p>
      </article>
    )
  }

  const approxMonthly = Math.round((price * 0.7) / 120)
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-2">Banka ön-onay (simülasyon)</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Peşinat (%30)</div>
          <div className="mt-0.5 tabular-nums">₺{(price * 0.3).toLocaleString('tr-TR')}</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Aylık taksit (10y)</div>
          <div className="mt-0.5 font-medium tabular-nums">₺{approxMonthly.toLocaleString('tr-TR')}</div>
        </div>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex items-center rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        Banka ile iletişime geç →
      </button>
      <p className="mt-2 text-xs text-muted-foreground italic">
        Tahmini değer, gerçek faiz oranlarına göre değişir.
      </p>
    </article>
  )
}

export default MortgagePreApprovalCta
