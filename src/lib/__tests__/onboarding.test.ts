// Wave F8.C — Onboarding state CRUD tests.
// Schema: arsam.onboarding.v1 — { completed, currentStep, completedSteps, startedAt?, finishedAt? }

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getOnboarding,
  startTour,
  advanceStep,
  skipTour,
  completeTour,
  restartTour,
  ONBOARDING_KEY,
  TOTAL_STEPS,
} from '../onboarding'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('onboarding state CRUD', () => {
  it('returns null initially + survives malformed payload', () => {
    expect(getOnboarding()).toBeNull()
    localStorage.setItem(ONBOARDING_KEY, 'not-json')
    expect(getOnboarding()).toBeNull()
  })

  it('startTour creates a fresh state at step 1', () => {
    const state = startTour()
    expect(state.completed).toBe(false)
    expect(state.currentStep).toBe(1)
    expect(state.completedSteps).toEqual([])
    expect(typeof state.startedAt).toBe('number')

    const persisted = getOnboarding()
    expect(persisted).not.toBeNull()
    expect(persisted!.currentStep).toBe(1)
  })

  it('advanceStep increments currentStep and records completedSteps', () => {
    startTour()
    advanceStep()
    const state = getOnboarding()
    expect(state!.currentStep).toBe(2)
    expect(state!.completedSteps).toContain(1)
    advanceStep()
    const state2 = getOnboarding()
    expect(state2!.currentStep).toBe(3)
    expect(state2!.completedSteps).toEqual([1, 2])
  })

  it('skipTour marks completed=true and sets finishedAt', () => {
    startTour()
    advanceStep()
    skipTour()
    const state = getOnboarding()
    expect(state!.completed).toBe(true)
    expect(typeof state!.finishedAt).toBe('number')
  })

  it('completeTour finalizes the run (completed + all steps recorded)', () => {
    startTour()
    for (let i = 1; i < TOTAL_STEPS; i++) advanceStep()
    completeTour()
    const state = getOnboarding()
    expect(state!.completed).toBe(true)
    expect(state!.completedSteps).toContain(TOTAL_STEPS)
    expect(typeof state!.finishedAt).toBe('number')
  })

  it('restartTour clears finishedAt + resets to step 1 (replay path)', () => {
    startTour()
    completeTour()
    const fresh = restartTour()
    expect(fresh.completed).toBe(false)
    expect(fresh.currentStep).toBe(1)
    expect(fresh.completedSteps).toEqual([])
    expect(fresh.finishedAt).toBeUndefined()
  })

})
