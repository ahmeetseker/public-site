/**
 * ReportForm — /sikayet anonim ilan şikayet island (Wave F32 W2A).
 *
 * Reads optional ?ilan=… query for prefill, validates kategori + 50ch
 * description, optional contact email. Submits via useCreateReport.
 * Wraps a local QueryClientProvider since public-site has no global one.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  queryClient,
  useCreateReport,
  type CreateReportInput,
  type Report,
} from '@landx/data'

type Locale = 'tr' | 'en'

const REASONS: Array<{ value: Report['reason']; tr: string; en: string }> = [
  { value: 'fraud_attempt', tr: 'Dolandırıcılık şüphesi', en: 'Suspected fraud' },
  { value: 'inappropriate_content', tr: 'Uygunsuz içerik', en: 'Inappropriate content' },
  { value: 'wrong_price', tr: 'Yanlış fiyat / yanıltıcı', en: 'Wrong / misleading price' },
  { value: 'wrong_location', tr: 'Yanlış konum', en: 'Wrong location' },
  { value: 'duplicate', tr: 'Tekrar eden ilan', en: 'Duplicate listing' },
  { value: 'fake_listing', tr: 'Sahte ilan', en: 'Fake listing' },
  { value: 'other', tr: 'Diğer', en: 'Other' },
]

const LABELS = {
  tr: {
    listingId: 'Şikayet edilen ilan ID',
    listingHelp: 'URL\'den otomatik dolduruldu (?ilan=…). Boşsa elle yaz.',
    listingPlaceholder: 'örn. LST-2026-0042',
    reason: 'Şikayet kategorisi',
    description: 'Açıklama',
    descriptionPlaceholder: 'Sorunu en az 50 karakter olacak şekilde anlat. Tarih, ekran görüntüsü detayı, neden şüphelendiğin gibi bilgileri eklersen ekibimiz daha hızlı incelemesini yapabilir.',
    descriptionError: 'Açıklama en az 50 karakter olmalı.',
    listingError: 'İlan ID zorunludur.',
    contact: 'İletişim e-postan (opsiyonel)',
    contactHelp: 'Sonuç hakkında dönüş yapmamızı istersen bırakabilirsin.',
    submit: 'Şikayeti gönder',
    submitting: 'Gönderiliyor…',
    success: 'Şikayetin alındı. Moderasyon ekibimiz 24 saat içinde inceler.',
    error: 'Şikayet gönderilemedi. Lütfen tekrar dene.',
    privacy: 'Şikayetin anonim — IP / cihaz bilgisi sadece kötüye kullanım önleme için tutulur.',
  },
  en: {
    listingId: 'Reported listing ID',
    listingHelp: 'Auto-filled from URL (?ilan=…). If empty, type it.',
    listingPlaceholder: 'e.g. LST-2026-0042',
    reason: 'Report category',
    description: 'Description',
    descriptionPlaceholder: 'Describe the issue in at least 50 characters. Include dates, screenshot details, why you suspect — this helps us review faster.',
    descriptionError: 'Description must be at least 50 characters.',
    listingError: 'Listing ID is required.',
    contact: 'Contact email (optional)',
    contactHelp: 'Leave it if you want us to follow up on the outcome.',
    submit: 'Submit report',
    submitting: 'Submitting…',
    success: 'Your report was received. Our moderation team will review within 24 hours.',
    error: 'Could not submit. Please try again.',
    privacy: 'Reports are anonymous — IP / device info is kept only for abuse prevention.',
  },
} as const

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

export default function ReportForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner />
    </QueryClientProvider>
  )
}

function Inner() {
  const [locale] = useState<Locale>(() => detectLocale())
  const [listingId, setListingId] = useState('')
  const [reason, setReason] = useState<Report['reason']>('fraud_attempt')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const mutation = useCreateReport()

  const L = LABELS[locale]
  const reasonLabels = REASONS.map((r) => ({
    value: r.value,
    label: locale === 'en' ? r.en : r.tr,
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const ilan = params.get('ilan')
    if (ilan) setListingId(ilan)
  }, [])

  const listingError = listingId.trim().length === 0
  const descriptionError = description.trim().length < 50
  const formInvalid = listingError || descriptionError

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (formInvalid) return
    const input: CreateReportInput = {
      listingId: listingId.trim(),
      reason,
      description: description.trim(),
      contactEmail: contactEmail.trim() || undefined,
    }
    mutation.mutate(input, {
      onSuccess: (created) => {
        setSuccess(created.id)
        setDescription('')
        setContactEmail('')
        setTouched(false)
      },
    })
  }

  if (success) {
    return (
      <div
        data-report-success={success}
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
      >
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          BAŞVURU NO · {success}
        </div>
        <p className="mt-2 font-serif text-lg tracking-tight">{L.success}</p>
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-4 inline-flex items-center rounded-full border border-emerald-500/30 bg-background px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
        >
          Yeni şikayet
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-report-form=""
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
      noValidate
    >
      <div>
        <label
          htmlFor="report-listing"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          {L.listingId}
        </label>
        <input
          id="report-listing"
          type="text"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          placeholder={L.listingPlaceholder}
          aria-invalid={touched && listingError}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{L.listingHelp}</p>
        {touched && listingError && (
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
            {L.listingError}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {L.reason}
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {reasonLabels.map((r) => (
            <label
              key={r.value}
              className={
                reason === r.value
                  ? 'flex cursor-pointer items-center gap-2 rounded-xl border border-foreground/20 bg-foreground/5 px-3 py-2 text-sm transition'
                  : 'flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition hover:bg-foreground/5'
              }
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="h-3.5 w-3.5"
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="report-description"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          {L.description}
        </label>
        <textarea
          id="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder={L.descriptionPlaceholder}
          aria-invalid={touched && descriptionError}
          className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:border-foreground"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={touched && descriptionError ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}>
            {touched && descriptionError ? L.descriptionError : `${description.trim().length} / 50+`}
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="report-email"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          {L.contact}
        </label>
        <input
          id="report-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="ornek@arsam.net"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{L.contactHelp}</p>
      </div>

      <p className="rounded-xl bg-foreground/[0.04] p-3 text-xs leading-relaxed text-muted-foreground">
        {L.privacy}
      </p>

      {mutation.isError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {L.error}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        data-report-submit=""
        className="self-start rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? L.submitting : L.submit}
      </button>
    </form>
  )
}
