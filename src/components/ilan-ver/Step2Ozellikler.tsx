/**
 * Step 2 — Özellikler (alan, imar, tapu, koordinatlar).
 *
 * Wave F4 / Agent-F4A.
 * Wave F6.A — "Haritada seç" link now opens a real Leaflet MapPicker modal.
 *   Picker is lazy-mounted (state-gated) so the Leaflet chunk only loads when
 *   the user actually opens the picker (reuses the F4.B Leaflet chunk).
 */
import { useState } from 'react'
import type { IlanDraft, ImarDurumu, StepErrors, TapuTipi } from '../../lib/ilan-draft'
import MapPicker from './MapPicker'

const IMAR_VALUES: ImarDurumu[] = ['konut', 'ticari', 'karma', 'tarim', 'yok']
const TAPU_VALUES: TapuTipi[] = ['mustakil', 'hisseli']

const LABELS = {
  tr: {
    eyebrow: 'Adım 2 · Özellikler',
    headingPre: 'Arsa ',
    headingAccent: 'özellikleri',
    headingPost: '',
    intro: 'Büyüklük, imar durumu, tapu tipi. Koordinatlar opsiyonel.',
    alan: 'Büyüklük (m²)',
    alanPlaceholder: 'Örn: 1240',
    imar: 'İmar durumu',
    selectPlaceholder: 'Seç…',
    imarLabels: {
      konut: 'Konut',
      ticari: 'Ticari',
      karma: 'Karma',
      tarim: 'Tarım',
      yok: 'İmarsız',
    } as Record<ImarDurumu, string>,
    tapuLegend: 'Tapu tipi',
    tapuLabels: {
      mustakil: 'Müstakil',
      hisseli: 'Hisseli',
    } as Record<TapuTipi, string>,
    koordLegend: 'Koordinatlar',
    koordHint: 'Opsiyonel — alıcı haritada gösterir.',
    pickOnMap: 'Haritada seç',
    lat: 'Enlem',
    lng: 'Boylam',
  },
  en: {
    eyebrow: 'Step 2 · Features',
    headingPre: 'Land ',
    headingAccent: 'features',
    headingPost: '',
    intro: 'Size, zoning, title type. Coordinates are optional.',
    alan: 'Size (m²)',
    alanPlaceholder: 'e.g. 1240',
    imar: 'Zoning',
    selectPlaceholder: 'Select…',
    imarLabels: {
      konut: 'Residential',
      ticari: 'Commercial',
      karma: 'Mixed',
      tarim: 'Agricultural',
      yok: 'Unzoned',
    } as Record<ImarDurumu, string>,
    tapuLegend: 'Title type',
    tapuLabels: {
      mustakil: 'Sole title',
      hisseli: 'Shared title',
    } as Record<TapuTipi, string>,
    koordLegend: 'Coordinates',
    koordHint: 'Optional — buyers see this on the map.',
    pickOnMap: 'Pick on map',
    lat: 'Latitude',
    lng: 'Longitude',
  },
} as const

export interface Step2Props {
  draft: IlanDraft
  errors: StepErrors
  showErrors: boolean
  onChange: (patch: Partial<IlanDraft>) => void
  locale?: 'tr' | 'en'
}

export default function Step2Ozellikler({ draft, errors, showErrors, onChange, locale = 'tr' }: Step2Props) {
  const err = (key: string) => (showErrors ? errors[key] : undefined)
  const L = LABELS[locale]
  const [mapOpen, setMapOpen] = useState(false)

  return (
    <section data-step="2" className="space-y-6">
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
        <Field id="alan" label={L.alan} error={err('alan')}>
          <input
            id="alan"
            type="number"
            min="1"
            inputMode="numeric"
            value={draft.alan}
            onChange={(e) => onChange({ alan: e.target.value })}
            placeholder={L.alanPlaceholder}
            data-field="alan"
            className={inputClass(!!err('alan'))}
          />
        </Field>
        <Field id="imar" label={L.imar} error={err('imar')}>
          <select
            id="imar"
            value={draft.imar}
            onChange={(e) => onChange({ imar: e.target.value as ImarDurumu })}
            data-field="imar"
            className={inputClass(!!err('imar'))}
          >
            <option value="">{L.selectPlaceholder}</option>
            {IMAR_VALUES.map((value) => (
              <option key={value} value={value}>
                {L.imarLabels[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {L.tapuLegend}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TAPU_VALUES.map((value) => {
            const active = draft.tapu === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ tapu: value })}
                data-field="tapu"
                data-value={value}
                data-active={active ? 'true' : 'false'}
                className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm transition ${
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-foreground hover:border-foreground/40'
                }`}
              >
                {L.tapuLabels[value]}
              </button>
            )
          })}
        </div>
        {err('tapu') && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" data-error="tapu">
            {err('tapu')}
          </p>
        )}
      </fieldset>

      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-4">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {L.koordLegend}
            </div>
            <p className="text-xs text-muted-foreground">
              {L.koordHint}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setMapOpen(true)
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            data-field="harita-link"
            data-map-open=""
          >
            {L.pickOnMap}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field id="lat" label={L.lat} error={err('lat')}>
            <input
              id="lat"
              type="text"
              inputMode="decimal"
              value={draft.lat}
              onChange={(e) => onChange({ lat: e.target.value })}
              placeholder="39.3245"
              data-field="lat"
              className={inputClass(!!err('lat'))}
            />
          </Field>
          <Field id="lng" label={L.lng} error={err('lng')}>
            <input
              id="lng"
              type="text"
              inputMode="decimal"
              value={draft.lng}
              onChange={(e) => onChange({ lng: e.target.value })}
              placeholder="26.6918"
              data-field="lng"
              className={inputClass(!!err('lng'))}
            />
          </Field>
        </div>
      </div>

      {mapOpen && (
        <MapPicker
          initialLat={draft.lat}
          initialLng={draft.lng}
          locale={locale}
          onCancel={() => setMapOpen(false)}
          onConfirm={({ lat, lng }) => {
            // Draft schema keeps lat/lng as strings (Step2 inputs are text);
            // toFixed(5) gives ~1 m precision which is plenty for an arsa pin.
            onChange({ lat: lat.toFixed(5), lng: lng.toFixed(5) })
            setMapOpen(false)
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
