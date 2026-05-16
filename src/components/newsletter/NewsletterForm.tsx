/**
 * NewsletterForm — Wave F8.D.
 *
 * Mounted from `SiteFooter.astro` via `<NewsletterForm client:visible />`.
 * The footer slot is pre-committed (commit 20061e8) — this file replaces
 * the previous stub.
 *
 * Behaviour
 *   - Email regex validation (lib/newsletter EMAIL_RE)
 *   - subscribe(email) → status="pending" + mock confirmation token
 *   - Toast ("Doğrulama e-postası yolladık (mock)" / "Confirmation email sent (mock)")
 *   - KVKK-safe wording rendered as fine-print under the form
 *   - locale-aware: reads `document.documentElement.lang` on mount
 *   - SSR-safe: no top-level browser API
 *
 * Test hooks
 *   data-testid="newsletter-form"
 *   data-testid="newsletter-email"
 *   data-testid="newsletter-submit"
 *   data-testid="newsletter-toast"
 *   data-testid="newsletter-error"
 */

import { useEffect, useState } from 'react'
import { EMAIL_RE, subscribe } from '@/lib/newsletter'
import { t } from '@/i18n'

type Locale = 'tr' | 'en'

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  const lang = document.documentElement.lang || 'tr'
  return lang.startsWith('en') ? 'en' : 'tr'
}

export interface NewsletterFormProps {
  /** Optional override (used by SignupModal so it can stay in step). */
  locale?: Locale
  /** Compact variant — used inside the modal where copy is duplicated above. */
  variant?: 'footer' | 'modal'
  /** Caller can react to a successful submit (e.g. close modal after delay). */
  onSubmitted?: (email: string) => void
}

export default function NewsletterForm({
  locale: localeProp,
  variant = 'footer',
  onSubmitted,
}: NewsletterFormProps) {
  const [locale, setLocale] = useState<Locale>(localeProp ?? 'tr')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!localeProp) setLocale(readLocale())
  }, [localeProp])

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus('error')
      setErrorMsg(t('newsletter.form.invalidEmail', locale))
      return
    }
    setStatus('submitting')
    setErrorMsg(null)
    // Run synchronously (localStorage) but micro-task defer so the loading
    // pill is visible for the brief moment a real network call would take.
    Promise.resolve().then(() => {
      const result = subscribe(value)
      if (!result.ok) {
        setStatus('error')
        setErrorMsg(t('newsletter.form.invalidEmail', locale))
        return
      }
      setStatus('done')
      setEmail('')
      onSubmitted?.(value)
    })
  }

  const labelCls =
    'font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'
  const inputCls =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20'
  const submitCls =
    'inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40'

  const showCopy = variant === 'footer'

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="newsletter-form"
      data-variant={variant}
      data-locale={locale}
      noValidate
      className="flex flex-col gap-2"
    >
      {showCopy && (
        <>
          <label htmlFor={`nl-email-${variant}`} className={labelCls}>
            {t('newsletter.form.label', locale)}
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('newsletter.form.description', locale)}
          </p>
        </>
      )}

      <div className="flex gap-2">
        <input
          id={`nl-email-${variant}`}
          // text-type so our regex validation runs (consistent with
          // VirtualTourPlaceholder pattern — sidesteps browser HTML5 popup).
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error' || status === 'done') {
              setStatus('idle')
              setErrorMsg(null)
            }
          }}
          placeholder={t('newsletter.form.placeholder', locale)}
          aria-label={t('newsletter.form.label', locale)}
          aria-invalid={status === 'error' || undefined}
          className={inputCls}
          data-testid="newsletter-email"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={submitCls}
          data-testid="newsletter-submit"
        >
          {status === 'submitting'
            ? t('newsletter.form.submitting', locale)
            : t('newsletter.form.submit', locale)}
        </button>
      </div>

      {status === 'error' && errorMsg && (
        <p
          role="alert"
          data-testid="newsletter-error"
          className="rounded-xl border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        >
          {errorMsg}
        </p>
      )}

      {status === 'done' && (
        <p
          role="status"
          aria-live="polite"
          data-testid="newsletter-toast"
          className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          {t('newsletter.form.toast', locale)}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground/80">
        {t('newsletter.form.kvkk', locale)}
      </p>
    </form>
  )
}
