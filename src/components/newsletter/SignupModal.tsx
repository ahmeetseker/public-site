/**
 * NewsletterSignupModal — Wave F8.D.
 *
 * Mounted from `RootLayout.astro` via `<NewsletterSignupModal client:idle />`.
 * The layout slot is pre-committed (commit 20061e8) — this file replaces
 * the previous stub.
 *
 * Behaviour
 *   - After mount, schedule a setTimeout (default 10_000ms) before showing.
 *   - Skip when:
 *       arsam.newsletter-modal-seen.v1 === '1'
 *       OR getSubscription() is non-null (already subscribed)
 *   - Submit (form) OR dismiss ("Şimdi değil") sets the modal-seen flag
 *     and closes — modal never re-appears in subsequent visits.
 *   - Test-only fast-path: `window.__newsletterModalDelay = 100` overrides
 *     the 10s delay so playwright doesn't have to wait. Real users only get
 *     the 10s path.
 *   - locale-aware via `document.documentElement.lang`.
 *
 * Test hooks
 *   data-testid="newsletter-modal"
 *   data-testid="newsletter-modal-dismiss"
 *   (form inherits NewsletterForm's testids inside the modal)
 */

import { useEffect, useRef, useState } from 'react'
import NewsletterForm from './NewsletterForm'
import { getSubscription, isModalSeen, markModalSeen } from '@/lib/newsletter'
import { t } from '@/i18n'

type Locale = 'tr' | 'en'

const DEFAULT_DELAY_MS = 10_000

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  const lang = document.documentElement.lang || 'tr'
  return lang.startsWith('en') ? 'en' : 'tr'
}

declare global {
  // Test override — allows playwright to compress the 10s timer.
  interface Window {
    __newsletterModalDelay?: number
  }
}

export default function NewsletterSignupModal() {
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>('tr')
  const dismissRef = useRef<HTMLButtonElement | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setLocale(readLocale())

    // Bail conditions evaluated on mount.
    if (isModalSeen()) return
    if (getSubscription() !== null) return

    const override =
      typeof window !== 'undefined' && typeof window.__newsletterModalDelay === 'number'
        ? window.__newsletterModalDelay
        : DEFAULT_DELAY_MS

    timerRef.current = window.setTimeout(() => {
      // Re-check at the moment we open (page may have subscribed via footer).
      if (isModalSeen()) return
      if (getSubscription() !== null) return
      setOpen(true)
    }, Math.max(0, override))

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Esc + focus restore.
  useEffect(() => {
    if (!open) return
    dismissRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    markModalSeen()
    setOpen(false)
  }

  function handleSubmitted() {
    // Form already wrote the subscription. Mark seen + close after a short
    // dwell so the user can read the toast (rendered by the form itself).
    markModalSeen()
    window.setTimeout(() => setOpen(false), 1800)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
      aria-label={t('newsletter.modal.ariaLabel', locale)}
      data-testid="newsletter-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="newsletter-modal-title"
            className="font-serif text-2xl font-normal tracking-tight"
          >
            {t('newsletter.modal.title', locale)}
          </h2>
          <button
            ref={dismissRef}
            type="button"
            onClick={close}
            className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            aria-label={t('newsletter.modal.dismiss', locale)}
            data-testid="newsletter-modal-dismiss"
          >
            {t('newsletter.modal.dismiss', locale)}
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {t('newsletter.modal.body', locale)}
        </p>

        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50/60 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
          data-testid="newsletter-modal-promo"
        >
          <span aria-hidden="true">★</span>
          <span>{t('newsletter.modal.promo', locale)}</span>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <NewsletterForm
            locale={locale}
            variant="modal"
            onSubmitted={handleSubmitted}
          />
        </div>
      </div>
    </div>
  )
}
