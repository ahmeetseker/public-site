/**
 * CookieConsentModal — Wave F13.D.
 *
 * Mounted from RootLayout.astro via `<CookieConsentModal client:idle />`.
 * Listens for `cookie-consent:open-modal` on `window` (dispatched from the
 * banner's "Customize" / "Ayarla" button) and opens a 4-category toggle modal:
 *
 *   - strict     (always on, disabled toggle)
 *   - functional
 *   - analytics
 *   - marketing
 *
 * "Kaydet" / "Save" persists via `setConsent()` which fires the
 * `cookie-consent:changed` event the banner + web-vitals init listen for.
 * "İptal" / "Cancel" closes without writing.
 *
 * Token-only colours. No external UI dependency.
 */

import { useEffect, useRef, useState } from 'react'
import { announce, trapFocus } from '@/lib/a11y'
import { getConsent, setConsent } from '@/lib/cookie-consent'
import { t } from '@/i18n'

type Locale = 'tr' | 'en'

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  const lang = document.documentElement.lang || 'tr'
  return lang.startsWith('en') ? 'en' : 'tr'
}

interface DraftState {
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const DEFAULT_DRAFT: DraftState = {
  functional: false,
  analytics: false,
  marketing: false,
}

export default function CookieConsentModal() {
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>('tr')
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT)
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Listen for the open trigger from the banner.
  useEffect(() => {
    setLocale(readLocale())

    function onOpen() {
      const current = getConsent()
      setDraft(
        current
          ? {
              functional: current.functional,
              analytics: current.analytics,
              marketing: current.marketing,
            }
          : DEFAULT_DRAFT,
      )
      setOpen(true)
    }

    window.addEventListener('cookie-consent:open-modal', onOpen)
    return () => window.removeEventListener('cookie-consent:open-modal', onOpen)
  }, [])

  // Esc to close + focus trap entry (Wave F23.C: shared `trapFocus`).
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const dialog = dialogRef.current
    let teardown: (() => void) | null = null
    if (dialog) {
      teardown = trapFocus(dialog, {
        initialFocus: cancelRef.current ?? undefined,
        restoreFocus: true,
      })
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      teardown?.()
    }
  }, [open])

  function handleSave() {
    setConsent({
      functional: draft.functional,
      analytics: draft.analytics,
      marketing: draft.marketing,
    })
    // Wave F23.C — announce the save to the singleton live region so screen
    // readers confirm the action even though the modal closes immediately.
    announce(
      locale === 'en' ? 'Cookie preferences saved' : 'Çerez tercihleri kaydedildi',
    )
    setOpen(false)
  }

  if (!open) return null

  const strictLabel = t('cookieConsent.modal.categories.strict.label', locale)
  const strictDesc = t('cookieConsent.modal.categories.strict.description', locale)
  const functionalLabel = t('cookieConsent.modal.categories.functional.label', locale)
  const functionalDesc = t('cookieConsent.modal.categories.functional.description', locale)
  const analyticsLabel = t('cookieConsent.modal.categories.analytics.label', locale)
  const analyticsDesc = t('cookieConsent.modal.categories.analytics.description', locale)
  const marketingLabel = t('cookieConsent.modal.categories.marketing.label', locale)
  const marketingDesc = t('cookieConsent.modal.categories.marketing.description', locale)
  const title = t('cookieConsent.modal.title', locale)
  const intro = t('cookieConsent.modal.intro', locale)
  const ariaLabel = t('cookieConsent.modal.ariaLabel', locale)
  const save = t('cookieConsent.modal.save', locale)
  const cancel = t('cookieConsent.modal.cancel', locale)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-modal-title"
      aria-label={ariaLabel}
      data-testid="cookie-consent-modal"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 [animation:cc-backdrop-in_160ms_ease-out_both]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      {/* Wave F28.B — fade-in for backdrop + modal card. Global
          `prefers-reduced-motion` rule (in _theme.css) collapses both
          animations to ~0ms automatically. */}
      <style>{`
        @keyframes cc-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-card-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        ref={dialogRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl [animation:cc-card-in_180ms_ease-out_both]"
      >
        <div className="border-b border-border px-6 py-4">
          <h2
            id="cookie-consent-modal-title"
            className="font-serif text-2xl font-normal tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <CategoryRow
            id="cc-strict"
            label={strictLabel}
            description={strictDesc}
            checked
            disabled
            onChange={() => undefined}
          />
          <CategoryRow
            id="cc-functional"
            label={functionalLabel}
            description={functionalDesc}
            checked={draft.functional}
            onChange={(v) => setDraft((d) => ({ ...d, functional: v }))}
            testId="cookie-consent-toggle-functional"
          />
          <CategoryRow
            id="cc-analytics"
            label={analyticsLabel}
            description={analyticsDesc}
            checked={draft.analytics}
            onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
            testId="cookie-consent-toggle-analytics"
          />
          <CategoryRow
            id="cc-marketing"
            label={marketingLabel}
            description={marketingDesc}
            checked={draft.marketing}
            onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
            testId="cookie-consent-toggle-marketing"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => setOpen(false)}
            data-testid="cookie-consent-modal-cancel"
            className="rounded-full border border-border bg-background px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            {cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            data-testid="cookie-consent-modal-save"
            className="rounded-full border border-foreground bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {save}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CategoryRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  testId?: string
}

function CategoryRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
  testId,
}: CategoryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label
          htmlFor={id}
          className="font-mono text-xs uppercase tracking-[0.14em] text-foreground"
        >
          {label}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        data-testid={testId}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          'relative mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-border transition',
          checked ? 'bg-foreground' : 'bg-background',
          disabled ? 'cursor-not-allowed opacity-60' : '',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition',
            checked ? 'translate-x-6 bg-background' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
