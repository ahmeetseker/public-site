/**
 * WizardShell — main React island for /ilan-ver/[1..4].
 *
 * Wave F4 / Agent-F4A.
 *
 * Responsibilities:
 *   1. Hydrate draft from `arsam.ilan-draft.v1` on mount (with EMPTY_DRAFT
 *      fallback for SSR + first paint).
 *   2. Sync draft on every keystroke (debounced to localStorage on every commit).
 *   3. Validate the active step; gate Next + step-jumping via `isStepComplete`.
 *   4. Auto-redirect to /ilan-ver/{n} mismatch when the URL step exceeds the
 *      reachable step (e.g. user lands on /ilan-ver/3 with empty draft).
 *   5. On step 4 Next → navigate to /ilan-ver/onizleme.
 *
 * `client:load` so the form is interactive on first paint (TBT < frame).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EMPTY_DRAFT,
  EVENT_NAME,
  canEnterStep,
  getDraft,
  resumeStep,
  setDraft,
  validateStep,
  type IlanDraft,
  type StepNumber,
} from '../../lib/ilan-draft'
import StepIndicator from './StepIndicator'
import Step1Konum from './Step1Konum'
import Step2Ozellikler from './Step2Ozellikler'
import Step3Fiyat from './Step3Fiyat'
import Step4Iletisim from './Step4Iletisim'

const LABELS = {
  tr: {
    back: 'Geri',
    saveDraft: 'Taslak kaydet',
    savedMsg: 'Taslak kaydedildi ✓',
    next: 'İleri',
    preview: 'Ön izleme',
  },
  en: {
    back: 'Back',
    saveDraft: 'Save draft',
    savedMsg: 'Draft saved ✓',
    next: 'Next',
    preview: 'Preview',
  },
} as const

export interface WizardShellProps {
  step: StepNumber
  locale?: 'tr' | 'en'
}

export default function WizardShell({ step, locale = 'tr' }: WizardShellProps) {
  const L = LABELS[locale]
  const basePath = locale === 'en' ? '/en/ilan-ver' : '/ilan-ver'
  const [draft, setDraftState] = useState<IlanDraft>(EMPTY_DRAFT)
  const [mounted, setMounted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Initial hydration from localStorage.
  useEffect(() => {
    const d = getDraft()
    setDraftState(d)
    setMounted(true)
    // Cross-tab + sibling-island sync.
    const sync = () => setDraftState(getDraft())
    window.addEventListener(EVENT_NAME, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // If the URL step is unreachable (previous step incomplete), bounce.
  useEffect(() => {
    if (!mounted) return
    if (!canEnterStep(step, draft)) {
      const target = resumeStep(draft)
      const safe = target > 4 ? 4 : target
      if (safe !== step) {
        window.location.replace(`${basePath}/${safe}`)
      }
    }
    // We intentionally do NOT depend on `draft` here — once the user starts
    // editing the current step we don't want to bounce them off it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, step])

  const errors = useMemo(() => validateStep(step, draft), [step, draft])
  const stepComplete = Object.keys(errors).length === 0

  const onChange = useCallback(
    (patch: Partial<IlanDraft>) => {
      setDraftState((prev) => {
        const next = { ...prev, ...patch } as IlanDraft
        if (patch.fotograflar) next.fotograflar = patch.fotograflar
        if (patch.etiketler) next.etiketler = patch.etiketler
        if (patch.photos) next.photos = patch.photos
        // Persist immediately so refresh/back-button never loses data.
        setDraft(next)
        return { ...next, updatedAt: new Date().toISOString() }
      })
      setShowErrors(false)
    },
    [],
  )

  function goPrev() {
    if (step === 1) return
    const target = (step - 1) as StepNumber
    setDraft({ lastStep: target })
    window.location.href = `${basePath}/${target}`
  }

  function goNext() {
    if (!stepComplete) {
      setShowErrors(true)
      return
    }
    if (step === 4) {
      setDraft({ lastStep: 4 })
      window.location.href = `${basePath}/onizleme`
      return
    }
    const target = (step + 1) as StepNumber
    const newLast: 1 | 2 | 3 | 4 = (Math.max(draft.lastStep, target) as 1 | 2 | 3 | 4)
    setDraft({ lastStep: newLast })
    window.location.href = `${basePath}/${target}`
  }

  function jumpTo(target: StepNumber) {
    if (!canEnterStep(target, draft)) return
    setDraft({ lastStep: Math.max(draft.lastStep, target) as 1 | 2 | 3 | 4 })
    window.location.href = `${basePath}/${target}`
  }

  function saveDraft() {
    setDraft({ lastStep: Math.max(draft.lastStep, step) as 1 | 2 | 3 | 4 })
    setSavedMsg(L.savedMsg)
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <div
      data-ilan-wizard=""
      data-step={step}
      data-mounted={mounted ? 'true' : 'false'}
      className="mx-auto max-w-2xl"
    >
      <StepIndicator current={step} draft={draft} onJump={jumpTo} locale={locale} />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          goNext()
        }}
        noValidate
        className="space-y-6"
      >
        {step === 1 && (
          <Step1Konum
            draft={draft}
            errors={errors}
            showErrors={showErrors}
            onChange={onChange}
            locale={locale}
          />
        )}
        {step === 2 && (
          <Step2Ozellikler
            draft={draft}
            errors={errors}
            showErrors={showErrors}
            onChange={onChange}
            locale={locale}
          />
        )}
        {step === 3 && (
          <Step3Fiyat
            draft={draft}
            errors={errors}
            showErrors={showErrors}
            onChange={onChange}
            locale={locale}
          />
        )}
        {step === 4 && (
          <Step4Iletisim
            draft={draft}
            errors={errors}
            showErrors={showErrors}
            onChange={onChange}
            locale={locale}
          />
        )}

        <nav className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              data-wizard-prev=""
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">←</span> {L.back}
            </button>
            <button
              type="button"
              onClick={saveDraft}
              data-wizard-save=""
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {L.saveDraft}
            </button>
            {savedMsg && (
              <span
                className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
                aria-live="polite"
                data-wizard-saved=""
              >
                {savedMsg}
              </span>
            )}
          </div>

          <button
            type="submit"
            data-wizard-next=""
            data-can-advance={stepComplete ? 'true' : 'false'}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
              stepComplete
                ? 'bg-foreground text-background hover:opacity-90'
                : 'bg-foreground/40 text-background cursor-not-allowed'
            }`}
          >
            {step === 4 ? L.preview : L.next}
            <span aria-hidden="true">→</span>
          </button>
        </nav>
      </form>
    </div>
  )
}
