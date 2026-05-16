/**
 * Step 1 — Konum (il, ilçe, ilan tipi).
 *
 * Wave F4 / Agent-F4A.
 *
 * Pure controlled component. State flows through props from WizardShell.
 * Errors come from `validateStep(1, draft)` and are shown only after a
 * blur or submit attempt — WizardShell sets `showErrors`.
 */
import type { IlanDraft, IlanTip, StepErrors } from '../../lib/ilan-draft'
import TkgmParcelLookup from '../wizard/TkgmParcelLookup'

const IL_OPTIONS = ['Balıkesir', 'İzmir', 'Muğla', 'Aydın', 'Antalya', 'Çanakkale']

const LABELS = {
  tr: {
    eyebrow: 'Adım 1 · Konum',
    headingPre: 'Arsa ',
    headingAccent: 'nerede',
    headingPost: '?',
    intro: 'İl, ilçe ve ilan tipini seç. Daha sonra adres detayını ekleyeceksin.',
    il: 'İl',
    ilce: 'İlçe / Mahalle',
    ilcePlaceholder: 'Örn: Ayvalık · Cunda',
    selectPlaceholder: 'Seç…',
    tipLegend: 'İlan tipi',
    tipLabels: {
      imarli: 'İmarlı arsa',
      tarla: 'Tarla',
      zeytinlik: 'Zeytinlik',
      'villa-arsasi': 'Villa arsası',
    } as Record<IlanTip, string>,
  },
  en: {
    eyebrow: 'Step 1 · Location',
    headingPre: 'Where is the ',
    headingAccent: 'land',
    headingPost: '?',
    intro: 'Pick the city, district and listing type. You can add address details later.',
    il: 'City',
    ilce: 'District / Neighborhood',
    ilcePlaceholder: 'e.g. Ayvalık · Cunda',
    selectPlaceholder: 'Select…',
    tipLegend: 'Listing type',
    tipLabels: {
      imarli: 'Buildable',
      tarla: 'Field',
      zeytinlik: 'Olive grove',
      'villa-arsasi': 'Villa plot',
    } as Record<IlanTip, string>,
  },
} as const

const TIP_VALUES: IlanTip[] = ['imarli', 'tarla', 'zeytinlik', 'villa-arsasi']

export interface Step1Props {
  draft: IlanDraft
  errors: StepErrors
  showErrors: boolean
  onChange: (patch: Partial<IlanDraft>) => void
  locale?: 'tr' | 'en'
}

export default function Step1Konum({ draft, errors, showErrors, onChange, locale = 'tr' }: Step1Props) {
  const err = (key: string) => (showErrors ? errors[key] : undefined)
  const L = LABELS[locale]

  return (
    <section data-step="1" className="space-y-6">
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
        <Field id="il" label={L.il} error={err('il')}>
          <select
            id="il"
            value={draft.il}
            onChange={(e) => onChange({ il: e.target.value })}
            data-field="il"
            className={inputClass(!!err('il'))}
          >
            <option value="">{L.selectPlaceholder}</option>
            {/* TKGM widget "Form'a kopyala" sonucu IL_OPTIONS dışı bir il
                gelebilir (ör. İstanbul / Ankara / Bursa) — değer kaybolmasın
                diye dinamik option ekliyoruz. */}
            {draft.il && !IL_OPTIONS.includes(draft.il) && (
              <option value={draft.il}>{draft.il}</option>
            )}
            {IL_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ilce" label={L.ilce} error={err('ilce')}>
          <input
            id="ilce"
            type="text"
            value={draft.ilce}
            onChange={(e) => onChange({ ilce: e.target.value })}
            placeholder={L.ilcePlaceholder}
            data-field="ilce"
            className={inputClass(!!err('ilce'))}
            autoComplete="off"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {L.tipLegend}
        </legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TIP_VALUES.map((value) => {
            const active = draft.tip === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ tip: value })}
                data-field="tip"
                data-value={value}
                data-active={active ? 'true' : 'false'}
                className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm transition ${
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-foreground hover:border-foreground/40'
                }`}
              >
                {L.tipLabels[value]}
              </button>
            )
          })}
        </div>
        {err('tip') && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" data-error="tip">
            {err('tip')}
          </p>
        )}
      </fieldset>

      {locale === 'tr' && (
        <TkgmParcelLookup
          initialIl={draft.il}
          initialIlce={draft.ilce}
          onParcelLookup={(parcel) => {
            onChange({
              il: parcel.il,
              ilce: parcel.mahalle ? `${parcel.ilce} · ${parcel.mahalle}` : parcel.ilce,
              alan: String(parcel.yuzolcumu),
            })
          }}
        />
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
