/**
 * ProfileForm — /hesabim/profil React island (client:idle).
 *
 * Wave F3 / Agent-F3E — initial rich form (name/phone/email + contactPref + regions).
 * Wave F5.A — extended with:
 *   - bilingual labels (TR/EN via document.documentElement.lang)
 *   - data-testid hooks for E2E (profile-form, profile-name, profile-email,
 *     profile-phone, profile-save, profile-toast)
 *   - dual-write: also persists the simple {name,email,phone} slice into
 *     `arsam.buyer-profile.v1` via `lib/buyer-profile.ts` so the bilingual
 *     E2E suite can assert on a stable contract decoupled from preferences.
 *
 * Persists the rich buyer profile (`arsam.profile.v1`) entirely in localStorage.
 * Fields: name, phone, email, contactPref, regions[]. A progress bar
 * (`bg-foreground/10` track + `bg-foreground` fill) shows completion percent.
 *
 * Layout: 1-col mobile, `md:grid-cols-2 gap-4`. Tokens only.
 */
import { useEffect, useState } from 'react'
import {
  EMPTY_PROFILE,
  EVENT_PROFILE_CHANGED,
  getProfile,
  profileCompletionPercent,
  saveProfile,
  type BuyerProfileLocal,
  type ContactPref,
} from '../../lib/account-store'
import { updateBuyerProfile } from '../../lib/buyer-profile'

const REGION_OPTIONS = [
  { slug: 'ayvalik', label: 'Ayvalık' },
  { slug: 'cesme', label: 'Çeşme' },
  { slug: 'urla', label: 'Urla' },
  { slug: 'datca', label: 'Datça' },
  { slug: 'bodrum', label: 'Bodrum' },
  { slug: 'fethiye', label: 'Fethiye' },
]

function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

const LABELS = {
  tr: {
    progressTitle: 'Profili tamamla',
    progressAria: 'Profil tamamlanma yüzdesi',
    progressValue: (n: number) => `%${n}`,
    contactSection: 'İletişim bilgileri',
    contactHelp: 'Ofisler ve bildirim sistemi bu bilgileri kullanır.',
    fullName: 'Ad Soyad',
    phone: 'Telefon',
    phonePlaceholder: '+90 5XX XXX XX XX',
    email: 'E-posta',
    emailPlaceholder: 'ornek@arsam.net',
    preferred: 'Tercih edilen iletişim',
    prefEmail: 'E-posta',
    prefPhone: 'Telefon',
    prefWhatsApp: 'WhatsApp',
    regionsTitle: 'İlgilendiğin bölgeler',
    regionsHelp: 'Bu bölgelerde yeni ilan çıktığında haber alırsın.',
    save: 'Kaydet',
    saved: 'Kaydedildi ✓',
    invalidEmail: 'Geçersiz e-posta',
    invalidPhone: 'Geçersiz telefon',
  },
  en: {
    progressTitle: 'Complete your profile',
    progressAria: 'Profile completion percent',
    progressValue: (n: number) => `${n}%`,
    contactSection: 'Contact details',
    contactHelp: 'Offices and notifications use these details.',
    fullName: 'Full name',
    phone: 'Phone',
    phonePlaceholder: '+90 5XX XXX XX XX',
    email: 'Email',
    emailPlaceholder: 'name@arsam.net',
    preferred: 'Preferred contact',
    prefEmail: 'Email',
    prefPhone: 'Phone',
    prefWhatsApp: 'WhatsApp',
    regionsTitle: 'Regions of interest',
    regionsHelp: 'You will be notified when new listings appear in these regions.',
    save: 'Save',
    saved: 'Profile updated ✓',
    invalidEmail: 'Invalid email',
    invalidPhone: 'Invalid phone',
  },
} as const

export default function ProfileForm() {
  const [locale, setLocale] = useState<'tr' | 'en'>('tr')
  const [profile, setProfile] = useState<BuyerProfileLocal>(EMPTY_PROFILE)
  const [savedMsg, setSavedMsg] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({})

  useEffect(() => {
    setLocale(detectLocale())
    setProfile(getProfile())
    setMounted(true)
    const sync = () => setProfile(getProfile())
    window.addEventListener(EVENT_PROFILE_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_PROFILE_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const L = LABELS[locale]

  function update<K extends keyof BuyerProfileLocal>(key: K, value: BuyerProfileLocal[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function toggleRegion(slug: string) {
    setProfile((p) => {
      const has = p.regions.includes(slug)
      const next = has ? p.regions.filter((r) => r !== slug) : [...p.regions, slug]
      return { ...p, regions: next }
    })
  }

  function validate(): boolean {
    const next: typeof errors = {}
    // Email validation is lenient (most users skip it on first save). Only
    // flag when explicitly typed and clearly malformed.
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      next.email = L.invalidEmail
    }
    if (profile.phone && !/^[+\d\s()-]{6,}$/.test(profile.phone)) {
      next.phone = L.invalidPhone
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!validate()) return
    saveProfile(profile)
    // F5.A — dual-write to the simple buyer-profile slice for the bilingual
    // E2E contract. Ignored on quota errors.
    updateBuyerProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    })
    setSavedMsg(L.saved)
    setTimeout(() => setSavedMsg(''), 2000)
  }

  const percent = profileCompletionPercent(profile)

  return (
    <form
      onSubmit={onSubmit}
      data-profile-form=""
      data-testid="profile-form"
      data-mounted={mounted ? 'true' : 'false'}
      className="flex flex-col gap-5"
    >
      <section
        className="rounded-2xl border border-border bg-card p-5"
        data-profile-progress=""
      >
        <div className="flex items-baseline justify-between gap-2 pb-2">
          <h2 className="font-serif text-lg tracking-tight">{L.progressTitle}</h2>
          <span
            className="font-mono text-xs tabular-nums text-muted-foreground"
            data-profile-percent={percent}
          >
            {L.progressValue(percent)}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={L.progressAria}
        >
          <div
            className="h-full bg-foreground transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="pb-3">
          <h2 className="font-serif text-lg tracking-tight">{L.contactSection}</h2>
          <p className="text-xs text-muted-foreground">{L.contactHelp}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.fullName}
            </span>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={(e) => update('name', e.target.value)}
              data-profile-name=""
              data-testid="profile-name"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.phone}
            </span>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={(e) => update('phone', e.target.value)}
              data-profile-phone=""
              data-testid="profile-phone"
              aria-invalid={!!errors.phone}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder={L.phonePlaceholder}
            />
            {errors.phone && (
              <p
                className="mt-1 font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
                data-testid="profile-phone-error"
              >
                {errors.phone}
              </p>
            )}
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.email}
            </span>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={(e) => update('email', e.target.value)}
              data-profile-email=""
              data-testid="profile-email"
              aria-invalid={!!errors.email}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder={L.emailPlaceholder}
            />
            {errors.email && (
              <p
                className="mt-1 font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
                data-testid="profile-email-error"
              >
                {errors.email}
              </p>
            )}
          </label>
          <fieldset className="md:col-span-2">
            <legend className="pb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.preferred}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(['email', 'phone', 'whatsapp'] as ContactPref[]).map((opt) => {
                const active = profile.contactPref === opt
                const optLabel =
                  opt === 'email' ? L.prefEmail : opt === 'phone' ? L.prefPhone : L.prefWhatsApp
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('contactPref', opt)}
                    data-profile-pref={opt}
                    data-active={active ? 'true' : 'false'}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    {optLabel}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="pb-3">
          <h2 className="font-serif text-lg tracking-tight">{L.regionsTitle}</h2>
          <p className="text-xs text-muted-foreground">{L.regionsHelp}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((r) => {
            const active = profile.regions.includes(r.slug)
            return (
              <button
                key={r.slug}
                type="button"
                onClick={() => toggleRegion(r.slug)}
                data-profile-region={r.slug}
                data-active={active ? 'true' : 'false'}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:bg-foreground/5'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <span
          className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
          data-profile-saved={savedMsg ? 'true' : 'false'}
          data-testid="profile-toast"
          aria-live="polite"
        >
          {savedMsg}
        </span>
        <button
          type="submit"
          data-profile-save=""
          data-testid="profile-save"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {L.save}
        </button>
      </div>
    </form>
  )
}
