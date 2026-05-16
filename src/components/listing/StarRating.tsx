// StarRating — Wave F6.B.
//
// Two modes, one component:
//   - display (default): renders `value`/`max` filled stars, decorative.
//   - interactive (interactive=true): radio-style picker; arrow keys cycle,
//     onChange fires per click/key. Uses a hidden <input> group so screen
//     readers announce "1 star", "2 stars" etc.
//
// Token-only styling. No icon dependency — inline SVG paths.

import { useId } from 'react'

export interface StarRatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
  /** Accessible label for the whole rating group (interactive mode). */
  ariaLabel?: string
  /** Used by tests to scope queries (defaults to "star-rating"). */
  testId?: string
}

const SIZE_PX: Record<NonNullable<StarRatingProps['size']>, number> = {
  sm: 12,
  md: 16,
  lg: 22,
}

export default function StarRating({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  ariaLabel,
  testId = 'star-rating',
}: StarRatingProps) {
  const px = SIZE_PX[size]
  const safeValue = clampInt(value, 0, max)
  const name = useId()

  if (!interactive) {
    return (
      <span
        role="img"
        aria-label={ariaLabel ?? `${safeValue} / ${max}`}
        className="inline-flex items-center gap-0.5"
        data-testid={testId}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star key={i} filled={i < safeValue} px={px} />
        ))}
      </span>
    )
  }

  return (
    <span
      role="radiogroup"
      aria-label={ariaLabel ?? 'Puan ver'}
      className="inline-flex items-center gap-1"
      data-testid={testId}
    >
      {Array.from({ length: max }).map((_, i) => {
        const v = i + 1
        const checked = safeValue === v
        return (
          <label
            key={v}
            className="cursor-pointer rounded focus-within:ring-2 focus-within:ring-foreground/40"
            aria-label={`${v} / ${max}`}
            data-star-value={v}
          >
            <input
              type="radio"
              name={name}
              value={v}
              checked={checked}
              onChange={() => onChange?.(v)}
              className="sr-only"
            />
            <Star filled={v <= safeValue} px={px} interactive />
          </label>
        )
      })}
    </span>
  )
}

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

interface StarProps {
  filled: boolean
  px: number
  interactive?: boolean
}

function Star({ filled, px, interactive }: StarProps) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={[
        'shrink-0 transition',
        filled ? 'text-amber-500' : 'text-muted-foreground/40',
        interactive ? 'hover:text-amber-500' : '',
      ].join(' ')}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.08 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  )
}
