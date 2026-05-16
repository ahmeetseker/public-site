/**
 * PlanCard — single plan tile within SubscriptionPlans.
 *
 * Wave F7.B.
 *
 * Plan name + monthly price + feature list + status badge ("Mevcut plan") or
 * action CTA ("Yükselt" / "Düşür"). Pure presentational — all click handlers
 * live in the parent `SubscriptionPlans` so we have one upgrade-confirm modal
 * scoped to the whole island.
 */
import type { PlanTier } from '../../lib/subscription'

export interface PlanCardProps {
  tier: PlanTier
  name: string
  price: number
  priceLabel: string
  /** Already-localized feature strings. */
  features: string[]
  /** Whether this tier is the buyer's current plan. */
  isCurrent: boolean
  /** Visual emphasis: premium = bordered + small ribbon. */
  emphasis?: boolean
  /** i18n: badge text when current. */
  currentBadge: string
  /** i18n: CTA when this tier > current (upgrade). */
  upgradeCta: string
  /** i18n: CTA when this tier < current (downgrade). */
  downgradeCta: string
  /** Direction of action vs. current plan. */
  direction: 'upgrade' | 'downgrade' | 'current'
  /** Click handler — parent owns the confirm modal. */
  onSelect: () => void
  /** i18n: "/ay" suffix on monthly price (or "/mo"). */
  perMonthSuffix: string
  /** i18n: "Şu anki planınız." sublabel, optional. */
  currentSublabel?: string
}

export default function PlanCard({
  tier,
  name,
  price: _price,
  priceLabel,
  features,
  isCurrent,
  emphasis = false,
  currentBadge,
  upgradeCta,
  downgradeCta,
  direction,
  onSelect,
  perMonthSuffix,
  currentSublabel,
}: PlanCardProps) {
  const borderClass = emphasis
    ? 'border-amber-400/60 ring-1 ring-amber-400/30 dark:border-amber-300/40 dark:ring-amber-300/20'
    : isCurrent
    ? 'border-foreground/20'
    : 'border-border'

  return (
    <article
      data-plan-card={tier}
      data-plan-current={isCurrent ? 'true' : 'false'}
      className={`relative flex flex-col rounded-2xl border bg-card p-5 transition hover:border-foreground/20 ${borderClass}`}
    >
      {emphasis && (
        <div className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white dark:bg-amber-400 dark:text-black">
          Premium
        </div>
      )}

      <header className="flex flex-col gap-1">
        <h3 className="font-serif text-lg tracking-tight">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-3xl font-medium tracking-tight" data-plan-price={tier}>
            {priceLabel}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{perMonthSuffix}</span>
        </div>
      </header>

      <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-foreground/90">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-0.5 inline-block h-4 w-4 shrink-0 text-foreground/60">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <footer className="mt-5 flex flex-col gap-1">
        {isCurrent ? (
          <>
            <div
              data-plan-current-badge
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-foreground/20 bg-foreground/5 px-3 py-2 text-sm font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
              {currentBadge}
            </div>
            {currentSublabel && (
              <p className="text-center text-xs text-muted-foreground">{currentSublabel}</p>
            )}
          </>
        ) : (
          <button
            type="button"
            data-plan-cta={tier}
            data-plan-direction={direction}
            onClick={onSelect}
            className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              direction === 'upgrade'
                ? 'bg-foreground text-background hover:opacity-90'
                : 'border border-border bg-background text-foreground hover:bg-foreground/5'
            }`}
          >
            {direction === 'upgrade' ? upgradeCta : downgradeCta}
          </button>
        )}
      </footer>
    </article>
  )
}
