// Wave F8.C — Onboarding TourStep card.
// Single-step renderer used by OnboardingTour. Pure presentational —
// parent owns state + handlers.
//
// Visual: icon header + title + body + step counter + CTA row.
// Glyph is text (emoji-free in source per project rules) — keep semantic.

export interface TourStepProps {
  index: number // 1-based
  total: number
  title: string
  body: string
  glyph: string // short ASCII identifier rendered as the step icon
  isFirst: boolean
  isLast: boolean
  /** Localized button labels. */
  ctas: {
    next: string
    back: string
    skip: string
    finish: string
  }
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
}

export default function TourStep({
  index,
  total,
  title,
  body,
  glyph,
  isFirst,
  isLast,
  ctas,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: TourStepProps) {
  return (
    <div className="flex w-full flex-col gap-5" data-testid="tour-step" data-step={index}>
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-accent text-base font-semibold text-foreground"
          data-testid="tour-step-glyph"
        >
          {glyph}
        </span>
        <span
          className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
          data-testid="tour-step-counter"
        >
          {index} / {total}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2
          id="onboarding-step-title"
          className="text-xl font-semibold leading-tight text-foreground"
          data-testid="tour-step-title"
        >
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground" data-testid="tour-step-body">
          {body}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          data-testid="tour-skip"
        >
          {ctas.skip}
        </button>

        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              data-testid="tour-back"
            >
              {ctas.back}
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              onClick={onFinish}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              data-testid="tour-finish"
            >
              {ctas.finish}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              data-testid="tour-next"
            >
              {ctas.next}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
