// Wave F8.C — Onboarding tour (5-step modal carousel).
// Mounted from RootLayout.astro as <OnboardingTour client:idle />.
//
// Behaviour (spec §6, simplified karar):
//   - Wait 2s after mount, check getOnboarding() === null → start tour.
//   - 5 step modal carousel (NO real-element spotlight — pragmatic mock).
//   - Backdrop + centered card + step counter + Next/Back/Skip/Finish CTAs.
//   - Locale resolved from <html lang>; falls back to 'tr'.
//   - Esc key + backdrop click = Skip (markAsSkipped → close).
//   - Body scroll locked while open, restored on close.

import { useEffect, useRef, useState } from 'react'
import {
  getOnboarding,
  startTour,
  advanceStep,
  skipTour,
  completeTour,
  TOTAL_STEPS,
} from '@/lib/onboarding'
import { useDict } from '@/i18n'
import type { Locale } from '@/i18n'
import TourStep from './TourStep'

interface StepCopy {
  title: string
  body: string
}

interface OnboardingDict {
  modalTitle: string
  steps: Record<string, StepCopy>
  ctas: { next: string; back: string; skip: string; finish: string }
}

const GLYPHS = ['ARA', 'BLG', 'FAV', 'KAR', 'ILN']

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang === 'en' ? 'en' : 'tr'
}

export default function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [locale, setLocale] = useState<Locale>('tr')
  const cardRef = useRef<HTMLDivElement | null>(null)
  const finishBtnFocus = useRef<HTMLButtonElement | null>(null)

  // First-visit detection (2s delay).
  useEffect(() => {
    setLocale(detectLocale())
    if (typeof window === 'undefined') return
    const state = getOnboarding()
    if (state !== null) return // returning visitor — never auto-open.

    const id = window.setTimeout(() => {
      const fresh = startTour()
      setStep(fresh.currentStep)
      setOpen(true)
    }, 2000)
    return () => window.clearTimeout(id)
  }, [])

  // Body scroll lock + Esc handler while open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dict = useDict('onboarding', locale) as OnboardingDict
  const stepDict =
    dict.steps && (dict.steps[String(step)] || dict.steps[`step${step}`])
  // Defensive copy in case dict is missing (helps in test envs).
  const title = stepDict?.title ?? `Step ${step}`
  const body = stepDict?.body ?? ''
  const ctas =
    dict.ctas ||
    ({ next: 'İleri', back: 'Geri', skip: 'Atla', finish: 'Bitir' } as OnboardingDict['ctas'])
  const modalTitle = dict.modalTitle || 'arsam.net turu'

  function handleNext() {
    const next = advanceStep()
    if (!next) return
    setStep(next.currentStep)
  }
  function handleBack() {
    if (step <= 1) return
    setStep((s) => Math.max(1, s - 1))
  }
  function handleSkip() {
    skipTour()
    setOpen(false)
  }
  function handleFinish() {
    completeTour()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      aria-label={modalTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-4 backdrop-blur-sm"
      data-testid="onboarding-tour"
      data-step={step}
      data-print-hide=""
      onClick={(e) => {
        // Backdrop click = skip (closing convention used in F4 LightboxModal).
        if (e.target === e.currentTarget) handleSkip()
      }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl"
        data-testid="onboarding-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {modalTitle}
          </p>
          <button
            type="button"
            onClick={handleSkip}
            aria-label={ctas.skip}
            className="rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            data-testid="onboarding-close"
            ref={finishBtnFocus}
          >
            ✕
          </button>
        </div>

        <TourStep
          index={step}
          total={TOTAL_STEPS}
          title={title}
          body={body}
          glyph={GLYPHS[step - 1] ?? `${step}`}
          isFirst={step === 1}
          isLast={step === TOTAL_STEPS}
          ctas={ctas}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          onFinish={handleFinish}
        />

        <div
          className="mt-5 flex items-center justify-center gap-1.5"
          aria-hidden
          data-testid="onboarding-progress"
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition ${
                i + 1 <= step ? 'w-6 bg-foreground' : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
