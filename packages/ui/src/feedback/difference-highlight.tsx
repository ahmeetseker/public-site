// DifferenceHighlight — Wave F24.B.
//
// Tiny presentational helper that takes a row of values (one per listing in
// the comparison) and renders each cell with a "best" / "worst" / "neutral"
// tint applied through token-based emerald/rose tier classes.
//
// Generic over the value type: callers supply a `comparator` that maps each
// value to a comparable number (e.g. `(l) => l.price`). When the metric is
// "lower is better" (₺/m², distance, days-on-market) the caller flips
// `invertBest: true` so the lowest scoring value gets the emerald tint.
//
// Edge cases:
//   - All values equal → every cell is `neutral` (no tint).
//   - Single value → the lone cell is `neutral` (best == worst).
//   - NaN / Infinity → treated as neutral (rendering falls back to the row's
//     plain `renderCell` output).
//
// Token policy: emerald-500/10 + emerald-700 (light) / emerald-300 (dark)
// match the existing emerald tier used by the search ranking pill (F12.A);
// rose-500/10 + rose-700/rose-300 are the symmetric "worst" pair.

import type { ReactNode } from 'react'

export type DifferenceTint = 'best' | 'worst' | 'neutral'

export interface DifferenceHighlightProps<T> {
  /** One value per listing column. */
  values: ReadonlyArray<T>
  /** Map each value to a comparable number. NaN/Infinity → no tint. */
  comparator: (value: T) => number
  /** When true the *lowest* numeric value is "best" (e.g. price/m²). */
  invertBest?: boolean
  /** Render a single cell, given its raw value + the tint to apply. */
  renderCell: (value: T, tint: DifferenceTint, index: number) => ReactNode
}

const TINT_BEST = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
const TINT_WORST = 'bg-rose-500/10 text-rose-700 dark:text-rose-300'

/**
 * Class fragment for the tint background + text colour. Callers can compose
 * this into their cell's own className via `cn()`. Exported for cases where
 * the renderCell wants to apply the tint to a nested element (e.g. the
 * value pill inside a card) rather than the row cell itself.
 */
export function tintClass(tint: DifferenceTint): string {
  if (tint === 'best') return TINT_BEST
  if (tint === 'worst') return TINT_WORST
  return ''
}

export function DifferenceHighlight<T>({
  values,
  comparator,
  invertBest = false,
  renderCell,
}: DifferenceHighlightProps<T>) {
  const numeric = values.map(comparator)
  const finite = numeric.filter((n) => Number.isFinite(n))
  const allEqual =
    finite.length === 0 || finite.every((n) => n === finite[0])
  const max = finite.length > 0 ? Math.max(...finite) : Number.NaN
  const min = finite.length > 0 ? Math.min(...finite) : Number.NaN

  return (
    <>
      {values.map((value, index) => {
        const score = numeric[index]
        let tint: DifferenceTint = 'neutral'
        if (!allEqual && Number.isFinite(score)) {
          const bestTarget = invertBest ? min : max
          const worstTarget = invertBest ? max : min
          if (score === bestTarget) tint = 'best'
          else if (score === worstTarget) tint = 'worst'
        }
        return renderCell(value, tint, index)
      })}
    </>
  )
}
