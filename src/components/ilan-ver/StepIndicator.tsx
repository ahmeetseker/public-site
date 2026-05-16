/**
 * StepIndicator — horizontal 4-dot progress bar for /ilan-ver wizard.
 *
 * Wave F4 / Agent-F4A.
 *
 * Tokens only:
 *   bg-foreground       — completed (steps below current)
 *   bg-foreground/30    — current dot
 *   bg-foreground/10    — upcoming
 *
 * Horizontal scroll on mobile (rare — 4 dots fit on most screens).
 * Each step is a clickable button if it's reachable; otherwise disabled.
 */
import type { IlanDraft, StepNumber } from '../../lib/ilan-draft'
import { canEnterStep, isStepComplete } from '../../lib/ilan-draft'

const LABELS = {
  tr: {
    nav: 'İlan ver adımları',
    steps: ['Konum', 'Özellikler', 'Fiyat', 'İletişim'],
    stepAria: (n: number, label: string) => `Adım ${n} — ${label}`,
  },
  en: {
    nav: 'List a property steps',
    steps: ['Location', 'Features', 'Price', 'Contact'],
    stepAria: (n: number, label: string) => `Step ${n} — ${label}`,
  },
} as const

const STEP_NUMBERS: StepNumber[] = [1, 2, 3, 4]

export interface StepIndicatorProps {
  current: StepNumber
  draft: IlanDraft
  onJump?: (step: StepNumber) => void
  locale?: 'tr' | 'en'
}

export default function StepIndicator({ current, draft, onJump, locale = 'tr' }: StepIndicatorProps) {
  const L = LABELS[locale]
  return (
    <nav
      aria-label={L.nav}
      data-step-indicator=""
      data-current={current}
      className="mb-8 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      <ol className="flex min-w-max items-center gap-2 md:min-w-0 md:grid md:grid-cols-4 md:gap-3">
        {STEP_NUMBERS.map((n, idx) => {
          const s = { n, label: L.steps[idx] }
          const done = s.n < current && isStepComplete(s.n, draft)
          const isCurrent = s.n === current
          const reachable = canEnterStep(s.n, draft)
          const dotClass = done
            ? 'bg-foreground'
            : isCurrent
              ? 'bg-foreground/30'
              : 'bg-foreground/10'
          const labelClass = isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
          const interactive = !!onJump && reachable && !isCurrent
          const Inner = (
            <>
              <span
                aria-hidden="true"
                className={`block h-1 w-full rounded-full ${dotClass}`}
              />
              <span className="mt-2 flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
                    done
                      ? 'bg-foreground text-background'
                      : isCurrent
                        ? 'border border-foreground/60 text-foreground'
                        : 'border border-border text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : s.n}
                </span>
                <span className={`text-xs ${labelClass}`}>{s.label}</span>
              </span>
            </>
          )
          return (
            <li
              key={s.n}
              data-step={s.n}
              data-state={isCurrent ? 'current' : done ? 'done' : 'upcoming'}
              className="flex min-w-[120px] flex-col md:min-w-0"
            >
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onJump && onJump(s.n)}
                  className="flex w-full flex-col items-stretch text-left transition hover:opacity-80"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={L.stepAria(s.n, s.label)}
                >
                  {Inner}
                </button>
              ) : (
                <div
                  className="flex w-full flex-col items-stretch"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={L.stepAria(s.n, s.label)}
                >
                  {Inner}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
