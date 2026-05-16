/**
 * Step 4 — İletişim & KVKK (ad, telefon, email, KVKK onayı).
 *
 * Wave F4 / Agent-F4A.
 *
 * KVKK checkbox is REQUIRED — without it the wizard can't reach preview.
 * The terminal CTA on this step is "Ön izleme" (handled by WizardShell).
 */
import type { IlanDraft, StepErrors } from '../../lib/ilan-draft'

const LABELS = {
  tr: {
    eyebrow: 'Adım 4 · İletişim',
    headingPre: 'Son adım — ',
    headingAccent: 'iletişim',
    headingPost: '',
    intro: 'Alıcılar buradan ulaşır. Telefon zorunlu, e-posta opsiyonel.',
    ad: 'Ad Soyad',
    adPlaceholder: 'Örn: Ayşe Yılmaz',
    telefon: 'Telefon',
    telefonPlaceholder: '+90 5XX XXX XX XX',
    email: 'E-posta (opsiyonel)',
    emailPlaceholder: 'ornek@arsam.net',
    kvkkConsentPre: 'Yayınlamak için kişisel verilerimin ',
    kvkkLinkLabel: 'KVKK aydınlatma metni',
    kvkkConsentMid: ' ve ',
    termsLinkLabel: 'kullanım şartları',
    kvkkConsentPost: ' uyarınca işlenmesini onaylıyorum.',
  },
  en: {
    eyebrow: 'Step 4 · Contact',
    headingPre: 'Last step — ',
    headingAccent: 'contact',
    headingPost: '',
    intro: 'Buyers reach you here. Phone is required, email is optional.',
    ad: 'Full name',
    adPlaceholder: 'e.g. Ayşe Yılmaz',
    telefon: 'Phone',
    telefonPlaceholder: '+90 5XX XXX XX XX',
    email: 'Email (optional)',
    emailPlaceholder: 'example@arsam.net',
    kvkkConsentPre: 'I consent to my personal data being processed under the ',
    kvkkLinkLabel: 'KVKK / privacy notice',
    kvkkConsentMid: ' and the ',
    termsLinkLabel: 'terms of use',
    kvkkConsentPost: ' for publishing.',
  },
} as const

export interface Step4Props {
  draft: IlanDraft
  errors: StepErrors
  showErrors: boolean
  onChange: (patch: Partial<IlanDraft>) => void
  locale?: 'tr' | 'en'
}

export default function Step4Iletisim({ draft, errors, showErrors, onChange, locale = 'tr' }: Step4Props) {
  const err = (key: string) => (showErrors ? errors[key] : undefined)
  const L = LABELS[locale]
  const kvkkHref = locale === 'en' ? '/en/kvkk' : '/kvkk'
  const termsHref = locale === 'en' ? '/en/kullanim-sartlari' : '/kullanim-sartlari'

  return (
    <section data-step="4" className="space-y-6">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {L.eyebrow}
        </div>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-4xl">
          {L.headingPre}<em className="font-serif italic font-normal">{L.headingAccent}</em>{L.headingPost}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {L.intro}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="ad" label={L.ad} error={err('ad')}>
          <input
            id="ad"
            type="text"
            value={draft.ad}
            onChange={(e) => onChange({ ad: e.target.value })}
            placeholder={L.adPlaceholder}
            data-field="ad"
            autoComplete="name"
            className={inputClass(!!err('ad'))}
          />
        </Field>
        <Field id="telefon" label={L.telefon} error={err('telefon')}>
          <input
            id="telefon"
            type="tel"
            value={draft.telefon}
            onChange={(e) => onChange({ telefon: e.target.value })}
            placeholder={L.telefonPlaceholder}
            data-field="telefon"
            autoComplete="tel"
            inputMode="tel"
            className={inputClass(!!err('telefon'))}
          />
        </Field>
        <Field id="email" label={L.email} error={err('email')}>
          <input
            id="email"
            type="email"
            value={draft.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder={L.emailPlaceholder}
            data-field="email"
            autoComplete="email"
            inputMode="email"
            className={inputClass(!!err('email'))}
          />
        </Field>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition ${
          err('kvkk')
            ? 'border-rose-500/60 bg-rose-500/5'
            : draft.kvkk
              ? 'border-foreground bg-foreground/5'
              : 'border-border bg-card'
        }`}
        data-field="kvkk-label"
      >
        <input
          type="checkbox"
          checked={draft.kvkk}
          onChange={(e) => onChange({ kvkk: e.target.checked })}
          className="mt-0.5 h-4 w-4 flex-none rounded border-border accent-foreground"
          data-field="kvkk"
          required
          aria-describedby="kvkk-desc"
        />
        <span className="text-foreground/90" id="kvkk-desc">
          {L.kvkkConsentPre}
          <a href={kvkkHref} target="_blank" rel="noopener" className="underline-offset-2 hover:underline">
            {L.kvkkLinkLabel}
          </a>
          {L.kvkkConsentMid}
          <a
            href={termsHref}
            target="_blank"
            rel="noopener"
            className="underline-offset-2 hover:underline"
          >
            {L.termsLinkLabel}
          </a>
          {L.kvkkConsentPost}
        </span>
      </label>
      {err('kvkk') && (
        <p className="-mt-3 text-xs text-rose-600 dark:text-rose-400" data-error="kvkk">
          {err('kvkk')}
        </p>
      )}
    </section>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" data-error={id}>
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xl border ${
    hasError ? 'border-rose-500/60' : 'border-border'
  } bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground min-h-11`
}
