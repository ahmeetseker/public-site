/**
 * Wave F28.0 — Shared motion helpers.
 *
 * `useReducedMotion` returns a stable boolean tracking the user's
 * `prefers-reduced-motion` system preference. `motionGate` is a tiny
 * branch helper that picks between a "full motion" value and a
 * reduced/disabled equivalent — used in framer-motion `transition`,
 * `animate`, and spring configs across the three LandX apps.
 *
 * SSR-safe: when window/matchMedia is missing the hook returns `false`
 * (i.e. assume animations are fine), the gate prefers the full value.
 */

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    try {
      return window.matchMedia(QUERY).matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    return undefined
  }, [])

  return reduced
}

/**
 * Pick the right value at render time. Pass `reducedValue` for
 * `prefers-reduced-motion: reduce` users, `fullValue` for everyone else.
 *
 * ```tsx
 * <motion.div transition={motionGate({ duration: 0 }, STANDARD_TRANSITION)} />
 * ```
 */
export function motionGate<T>(reducedValue: T, fullValue: T): T {
  if (typeof window === 'undefined' || !window.matchMedia) return fullValue
  try {
    return window.matchMedia(QUERY).matches ? reducedValue : fullValue
  } catch {
    return fullValue
  }
}

export const REDUCED_MOTION_TRANSITION = { duration: 0 } as const

export const STANDARD_SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const

export const FAST_FADE = { duration: 0.16, ease: 'easeOut' } as const

export const SLOW_FADE = { duration: 0.32, ease: 'easeOut' } as const
