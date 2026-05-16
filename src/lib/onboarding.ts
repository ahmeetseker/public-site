// Wave F8.C — Onboarding state persistence.
// localStorage-backed, SSR-safe, version-keyed.
// Spec §6 — schema arsam.onboarding.v1.
//
// First-visit detection contract: getOnboarding() === null  ⇒  show tour.
// All mutations write the full object back; reads tolerate corruption.

export const ONBOARDING_KEY = 'arsam.onboarding.v1'
export const TOTAL_STEPS = 5

export interface OnboardingState {
  completed: boolean
  currentStep: number
  completedSteps: number[]
  startedAt?: number
  finishedAt?: number
}

function isState(v: unknown): v is OnboardingState {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.completed === 'boolean' &&
    typeof o.currentStep === 'number' &&
    Array.isArray(o.completedSteps) &&
    o.completedSteps.every((n) => typeof n === 'number')
  )
}

function read(): OnboardingState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function write(state: OnboardingState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state))
  } catch {
    /* quota exceeded — silently drop */
  }
}

export function getOnboarding(): OnboardingState | null {
  return read()
}

export function startTour(): OnboardingState {
  const state: OnboardingState = {
    completed: false,
    currentStep: 1,
    completedSteps: [],
    startedAt: Date.now(),
  }
  write(state)
  return state
}

export function advanceStep(): OnboardingState | null {
  const cur = read()
  if (!cur) return null
  const completedSteps = cur.completedSteps.includes(cur.currentStep)
    ? cur.completedSteps
    : [...cur.completedSteps, cur.currentStep]
  const next: OnboardingState = {
    ...cur,
    currentStep: Math.min(cur.currentStep + 1, TOTAL_STEPS),
    completedSteps,
  }
  write(next)
  return next
}

export function skipTour(): OnboardingState | null {
  const cur = read()
  if (!cur) return null
  const next: OnboardingState = {
    ...cur,
    completed: true,
    finishedAt: Date.now(),
  }
  write(next)
  return next
}

export function completeTour(): OnboardingState | null {
  const cur = read()
  if (!cur) return null
  const completedSteps = cur.completedSteps.includes(cur.currentStep)
    ? cur.completedSteps
    : [...cur.completedSteps, cur.currentStep]
  const next: OnboardingState = {
    ...cur,
    completed: true,
    completedSteps,
    finishedAt: Date.now(),
  }
  write(next)
  return next
}

export function restartTour(): OnboardingState {
  const state: OnboardingState = {
    completed: false,
    currentStep: 1,
    completedSteps: [],
    startedAt: Date.now(),
  }
  write(state)
  return state
}
