// Wave F9.C — Office contact form
// Stores submissions in localStorage under `arsam.office-contacts.v1`, shows
// a transient toast, and resets the form on success. KVKK checkbox is
// required; email + phone get cheap regex validation.
import { useEffect, useRef, useState } from 'react'

type Locale = 'tr' | 'en'

type Subject = 'general' | 'listing' | 'meeting'

interface FormState {
  name: string
  phone: string
  email: string
  subject: Subject
  message: string
  kvkk: boolean
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  subject: 'general',
  message: '',
  kvkk: false,
}

const STORAGE_KEY = 'arsam.office-contacts.v1'

const LABELS: Record<Locale, {
  eyebrow: string
  heading: string
  intro: string
  name: string
  namePh: string
  phone: string
  phonePh: string
  email: string
  emailPh: string
  subject: string
  subjectOptions: Record<Subject, string>
  message: string
  messagePh: string
  kvkk: string
  kvkkLink: string
  submit: string
  submitting: string
  toastOk: string
  errName: string
  errPhone: string
  errEmail: string
  errMessage: string
  errKvkk: string
}> = {
  tr: {
    eyebrow: 'BİZE YAZIN',
    heading: 'İletişim formu',
    intro: 'En geç 1 iş günü içinde dönüş yaparız.',
    name: 'Ad soyad',
    namePh: 'Adınızı giriniz',
    phone: 'Telefon',
    phonePh: '+90 5XX XXX XX XX',
    email: 'E-posta',
    emailPh: 'ornek@arsam.net',
    subject: 'Konu',
    subjectOptions: {
      general: 'Genel bilgi',
      listing: 'İlan hakkında',
      meeting: 'Görüşme talebi',
    },
    message: 'Mesajınız',
    messagePh: 'Sormak istediklerinizi yazın…',
    kvkk: 'KVKK aydınlatma metnini okudum, onaylıyorum.',
    kvkkLink: 'KVKK',
    submit: 'Gönder',
    submitting: 'Gönderiliyor…',
    toastOk: 'Mesajınız ulaştı ✓',
    errName: 'Adınızı giriniz.',
    errPhone: 'Geçerli bir telefon numarası giriniz.',
    errEmail: 'Geçerli bir e-posta giriniz.',
    errMessage: 'Mesaj boş olamaz.',
    errKvkk: 'KVKK onayı zorunludur.',
  },
  en: {
    eyebrow: 'WRITE TO US',
    heading: 'Contact form',
    intro: 'We reply within 1 business day.',
    name: 'Full name',
    namePh: 'Enter your name',
    phone: 'Phone',
    phonePh: '+90 5XX XXX XX XX',
    email: 'Email',
    emailPh: 'you@example.com',
    subject: 'Subject',
    subjectOptions: {
      general: 'General inquiry',
      listing: 'About a listing',
      meeting: 'Request a meeting',
    },
    message: 'Your message',
    messagePh: 'What would you like to ask?',
    kvkk: 'I have read and accept the privacy notice.',
    kvkkLink: 'Privacy',
    submit: 'Send',
    submitting: 'Sending…',
    toastOk: 'Message received ✓',
    errName: 'Please enter your name.',
    errPhone: 'Please enter a valid phone number.',
    errEmail: 'Please enter a valid email.',
    errMessage: 'Message cannot be empty.',
    errKvkk: 'Privacy consent is required.',
  },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ContactFormProps {
  officeId: string
  officeName: string
  locale: Locale
}

export default function ContactForm({ officeId, officeName, locale }: ContactFormProps) {
  const L = LABELS[locale]
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = L.errName
    // phone: digits + spaces + plus, at least 6 digits
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length < 6) next.phone = L.errPhone
    if (!EMAIL_RE.test(form.email.trim())) next.email = L.errEmail
    if (!form.message.trim()) next.message = L.errMessage
    if (!form.kvkk) next.kvkk = L.errKvkk
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  function persist() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const arr: unknown[] = raw ? JSON.parse(raw) : []
      const entry = {
        id: `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        officeId,
        officeName,
        locale,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
        kvkkAccepted: true,
        createdAt: Date.now(),
      }
      const list = Array.isArray(arr) ? arr : []
      list.push(entry)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      // localStorage may be unavailable (private mode, quota) — degrade silently
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return
    setSubmitting(true)
    // Simulate a network round-trip so the spinner state is visible.
    setTimeout(() => {
      persist()
      setSubmitting(false)
      showToast(L.toastOk)
      setForm(EMPTY)
    }, 350)
  }

  return (
    <section
      aria-labelledby="ofis-contact-title"
      data-office-contact-form=""
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {L.eyebrow}
      </div>
      <h2
        id="ofis-contact-title"
        className="mt-1 font-serif text-2xl font-normal tracking-tight md:text-3xl"
      >
        {L.heading}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{L.intro}</p>

      <form
        noValidate
        onSubmit={onSubmit}
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <label className="block">
          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.name}
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={L.namePh}
            data-contact-input="name"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ofis-contact-name-err' : undefined}
          />
          {errors.name ? (
            <span
              id="ofis-contact-name-err"
              role="alert"
              data-contact-error="name"
              className="mt-1 block font-mono text-xs text-red-600"
            >
              {errors.name}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.phone}
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder={L.phonePh}
            data-contact-input="phone"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'ofis-contact-phone-err' : undefined}
          />
          {errors.phone ? (
            <span
              id="ofis-contact-phone-err"
              role="alert"
              data-contact-error="phone"
              className="mt-1 block font-mono text-xs text-red-600"
            >
              {errors.phone}
            </span>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.email}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder={L.emailPh}
            data-contact-input="email"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'ofis-contact-email-err' : undefined}
          />
          {errors.email ? (
            <span
              id="ofis-contact-email-err"
              role="alert"
              data-contact-error="email"
              className="mt-1 block font-mono text-xs text-red-600"
            >
              {errors.email}
            </span>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.subject}
          </span>
          <select
            value={form.subject}
            onChange={(e) => update('subject', e.target.value as Subject)}
            data-contact-input="subject"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
          >
            <option value="general">{L.subjectOptions.general}</option>
            <option value="listing">{L.subjectOptions.listing}</option>
            <option value="meeting">{L.subjectOptions.meeting}</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.message}
          </span>
          <textarea
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder={L.messagePh}
            rows={4}
            data-contact-input="message"
            className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'ofis-contact-message-err' : undefined}
          />
          {errors.message ? (
            <span
              id="ofis-contact-message-err"
              role="alert"
              data-contact-error="message"
              className="mt-1 block font-mono text-xs text-red-600"
            >
              {errors.message}
            </span>
          ) : null}
        </label>

        <label className="flex items-start gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.kvkk}
            onChange={(e) => update('kvkk', e.target.checked)}
            data-contact-input="kvkk"
            className="mt-0.5"
            aria-invalid={Boolean(errors.kvkk)}
            aria-describedby={errors.kvkk ? 'ofis-contact-kvkk-err' : undefined}
          />
          <span className="text-xs text-muted-foreground">
            <a
              href={locale === 'en' ? '/en/legal/kvkk' : '/legal/kvkk'}
              className="underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {L.kvkkLink}
            </a>{' '}— {L.kvkk}
          </span>
        </label>
        {errors.kvkk ? (
          <span
            id="ofis-contact-kvkk-err"
            role="alert"
            data-contact-error="kvkk"
            className="font-mono text-xs text-red-600 sm:col-span-2"
          >
            {errors.kvkk}
          </span>
        ) : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            data-contact-submit=""
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 font-mono text-xs uppercase tracking-wide text-background transition hover:bg-foreground/85 disabled:opacity-60"
          >
            {submitting ? L.submitting : L.submit}
          </button>
        </div>
      </form>

      {/* Toast */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center"
      >
        {toast ? (
          <span
            data-contact-toast=""
            className="pointer-events-auto rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-foreground shadow-sm"
          >
            {toast}
          </span>
        ) : null}
      </div>
    </section>
  )
}
