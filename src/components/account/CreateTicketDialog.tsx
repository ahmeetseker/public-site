/**
 * CreateTicketDialog — /hesabim/destek "Yeni talep oluştur" modal (Wave F7.D).
 *
 * Renders a controlled modal form (kategori radio × 4, konu, mesaj, optional
 * screenshot URL). Client-side validation; submit persists via createTicket
 * then closes itself and lets the parent SupportTickets island refresh via
 * the storage event.
 */
import { useEffect, useRef, useState } from 'react'
import { createTicket, type TicketCategory } from '../../lib/support-tickets'

type Locale = 'tr' | 'en'

const LABELS = {
  tr: {
    title: 'Yeni destek talebi',
    intro: 'Aşağıdaki formu doldur — destek ekibimiz en kısa sürede yanıtlar.',
    category: 'Kategori',
    cat: {
      hesap: 'Hesap',
      ilan: 'İlan',
      odeme: 'Ödeme',
      diger: 'Diğer',
    },
    subject: 'Konu',
    subjectPlaceholder: 'Kısa bir başlık yaz (örn: hesabıma giremiyorum)',
    subjectError: 'Konu zorunludur (maks 100 karakter).',
    message: 'Mesaj',
    messagePlaceholder: 'Sorunu mümkün olduğunca ayrıntılı anlat (en az 20 karakter).',
    messageError: 'Mesaj en az 20 karakter olmalı.',
    screenshot: 'Ekran görüntüsü URL (opsiyonel)',
    screenshotPlaceholder: 'https://...',
    screenshotError: 'Geçerli bir URL gir.',
    submit: 'Talebi gönder',
    cancel: 'Vazgeç',
    toastSuccess: 'Talep oluşturuldu ✓',
  },
  en: {
    title: 'New support ticket',
    intro: 'Fill in the form — our support team will get back to you shortly.',
    category: 'Category',
    cat: {
      hesap: 'Account',
      ilan: 'Listing',
      odeme: 'Payment',
      diger: 'Other',
    },
    subject: 'Subject',
    subjectPlaceholder: 'Short headline (e.g. cannot sign in to my account)',
    subjectError: 'Subject is required (max 100 chars).',
    message: 'Message',
    messagePlaceholder: 'Describe the issue in as much detail as possible (min 20 chars).',
    messageError: 'Message must be at least 20 characters.',
    screenshot: 'Screenshot URL (optional)',
    screenshotPlaceholder: 'https://...',
    screenshotError: 'Enter a valid URL.',
    submit: 'Send ticket',
    cancel: 'Cancel',
    toastSuccess: 'Ticket created ✓',
  },
} as const

const CATEGORIES: TicketCategory[] = ['hesap', 'ilan', 'odeme', 'diger']

interface Props {
  open: boolean
  locale: Locale
  onClose: () => void
  onCreated?: () => void
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CreateTicketDialog({
  open,
  locale,
  onClose,
  onCreated,
}: Props) {
  const L = LABELS[locale]
  const [category, setCategory] = useState<TicketCategory>('hesap')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [errors, setErrors] = useState<{
    subject?: string
    message?: string
    screenshotUrl?: string
  }>({})
  const [toast, setToast] = useState('')
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  // Reset form whenever the dialog opens so stale state doesn't bleed across
  // sessions; focus the cancel button so Esc / outside-click feel ambient.
  useEffect(() => {
    if (!open) return
    setCategory('hesap')
    setSubject('')
    setMessage('')
    setScreenshotUrl('')
    setErrors({})
    setToast('')
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function validate(): boolean {
    const next: typeof errors = {}
    const trimmedSubject = subject.trim()
    if (!trimmedSubject || trimmedSubject.length > 100) {
      next.subject = L.subjectError
    }
    if (message.trim().length < 20) {
      next.message = L.messageError
    }
    const trimmedUrl = screenshotUrl.trim()
    if (trimmedUrl && !isValidUrl(trimmedUrl)) {
      next.screenshotUrl = L.screenshotError
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!validate()) return
    createTicket({
      category,
      subject: subject.trim(),
      message: message.trim(),
      screenshotUrl: screenshotUrl.trim() || undefined,
    })
    setToast(L.toastSuccess)
    onCreated?.()
    // Brief delay so the toast is visible before the modal disappears.
    setTimeout(() => {
      onClose()
    }, 500)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ticket-title"
      data-create-ticket-dialog=""
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <h3
          id="create-ticket-title"
          className="font-serif text-xl tracking-tight"
        >
          {L.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{L.intro}</p>

        <fieldset className="mt-5">
          <legend className="pb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {L.category}
          </legend>
          <div className="flex flex-wrap gap-2" data-ticket-categories="">
            {CATEGORIES.map((cat) => {
              const active = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  data-ticket-category={cat}
                  data-active={active ? 'true' : 'false'}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {L.cat[cat]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="mt-5 flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {L.subject}
          </span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 100))}
            placeholder={L.subjectPlaceholder}
            data-ticket-subject=""
            maxLength={100}
            aria-invalid={!!errors.subject}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
          {errors.subject && (
            <p
              className="mt-1 font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
              data-ticket-subject-error=""
            >
              {errors.subject}
            </p>
          )}
        </label>

        <label className="mt-4 flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {L.message}
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={L.messagePlaceholder}
            data-ticket-message=""
            rows={5}
            aria-invalid={!!errors.message}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
          {errors.message && (
            <p
              className="mt-1 font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
              data-ticket-message-error=""
            >
              {errors.message}
            </p>
          )}
        </label>

        <label className="mt-4 flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {L.screenshot}
          </span>
          <input
            type="url"
            value={screenshotUrl}
            onChange={(e) => setScreenshotUrl(e.target.value)}
            placeholder={L.screenshotPlaceholder}
            data-ticket-screenshot=""
            aria-invalid={!!errors.screenshotUrl}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
          {errors.screenshotUrl && (
            <p
              className="mt-1 font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
              data-ticket-screenshot-error=""
            >
              {errors.screenshotUrl}
            </p>
          )}
        </label>

        {toast && (
          <p
            className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
            data-ticket-toast=""
            role="status"
            aria-live="polite"
          >
            {toast}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            data-ticket-cancel=""
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          >
            {L.cancel}
          </button>
          <button
            type="submit"
            data-ticket-submit=""
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {L.submit}
          </button>
        </div>
      </form>
    </div>
  )
}
