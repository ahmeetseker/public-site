/**
 * Step 3 — Fiyat & detay (fiyat, açıklama, etiketler, foto upload).
 *
 * Wave F4 / Agent-F4A.
 * Wave F6.A — Real FotoUpload alt-section now sits next to the legacy slot
 *   grid (kept for back-compat: existing drafts may still carry slot meta).
 *   The metadata produced by FotoUpload flows into `draft.photos[]`; the
 *   3 legacy slots fade out once `photos.length > 0`.
 */
import { useState } from 'react'
import type { IlanDraft, PhotoMeta, PhotoSlot, StepErrors } from '../../lib/ilan-draft'
import FotoUpload from './FotoUpload'
import WizardAiValuation from './WizardAiValuation'

const LABELS = {
  tr: {
    eyebrow: 'Adım 3 · Fiyat & detay',
    headingPre: 'Fiyat ve ',
    headingAccent: 'hikâye',
    headingPost: '',
    intro: 'Açıklamayı iyi yaz — alıcılar burayı okur. Etiketler arama filtrelerini besler.',
    fiyat: 'Fiyat (TL)',
    fiyatPlaceholder: 'Örn: 8400000',
    summary: 'Özet',
    aciklama: 'Açıklama',
    aciklamaPlaceholder: 'Parselin konumu, çevre, imar, tapu, ulaşım — alıcının merak ettiği her şey.',
    chars: 'karakter',
    tagsLabel: 'Etiketler',
    tagsHint: '(Enter veya virgül ile ekle, en çok 8)',
    tagsPlaceholder: 'deniz manzaralı, yola cephe',
    removeTagAria: (tag: string) => `${tag} etiketini kaldır`,
    photosLegend: 'Fotoğraflar',
    photosHint: '(3 slot — gerçek yükleme yakında)',
    photoSlotAria: (id: number, filled: boolean) => `Fotoğraf slotu ${id} ${filled ? 'doldu' : 'boş'}`,
    photoSlotPlaceholder: (id: number) => `Foto ${id}`,
  },
  en: {
    eyebrow: 'Step 3 · Price & detail',
    headingPre: 'Price and ',
    headingAccent: 'story',
    headingPost: '',
    intro: 'Write a strong description — buyers read this. Tags feed the search filters.',
    fiyat: 'Price (TL)',
    fiyatPlaceholder: 'e.g. 8400000',
    summary: 'Summary',
    aciklama: 'Description',
    aciklamaPlaceholder: 'Location, surroundings, zoning, title, access — everything a buyer wants to know.',
    chars: 'characters',
    tagsLabel: 'Tags',
    tagsHint: '(add with Enter or comma, up to 8)',
    tagsPlaceholder: 'sea view, road access',
    removeTagAria: (tag: string) => `Remove tag ${tag}`,
    photosLegend: 'Photos',
    photosHint: '(3 slots — real upload coming soon)',
    photoSlotAria: (id: number, filled: boolean) => `Photo slot ${id} is ${filled ? 'filled' : 'empty'}`,
    photoSlotPlaceholder: (id: number) => `Photo ${id}`,
  },
} as const

export interface Step3Props {
  draft: IlanDraft
  errors: StepErrors
  showErrors: boolean
  onChange: (patch: Partial<IlanDraft>) => void
  locale?: 'tr' | 'en'
}

export default function Step3Fiyat({ draft, errors, showErrors, onChange, locale = 'tr' }: Step3Props) {
  const [chipInput, setChipInput] = useState('')
  const err = (key: string) => (showErrors ? errors[key] : undefined)
  const L = LABELS[locale]
  const numLocale = locale === 'en' ? 'en-US' : 'tr-TR'

  const fiyatNum = Number((draft.fiyat || '').replace(/[^\d]/g, '')) || 0
  const alanNum = Number(draft.alan) || 0
  const perM2 =
    fiyatNum > 0 && alanNum > 0
      ? `₺${new Intl.NumberFormat(numLocale).format(Math.round(fiyatNum / alanNum))}/m²`
      : '—'
  const fiyatFmt =
    fiyatNum > 0 ? `₺${new Intl.NumberFormat(numLocale).format(fiyatNum)}` : '—'

  function commitChip() {
    const v = chipInput.trim().replace(/,$/, '').trim()
    if (!v) return
    if (draft.etiketler.includes(v)) {
      setChipInput('')
      return
    }
    if (draft.etiketler.length >= 8) {
      setChipInput('')
      return
    }
    onChange({ etiketler: [...draft.etiketler, v] })
    setChipInput('')
  }

  function removeChip(tag: string) {
    onChange({ etiketler: draft.etiketler.filter((t) => t !== tag) })
  }

  function togglePhotoSlot(slotId: 1 | 2 | 3) {
    const next: PhotoSlot[] = draft.fotograflar.map((p) =>
      p.id === slotId ? { ...p, filled: !p.filled } : p,
    )
    onChange({ fotograflar: next })
  }

  function setPhotoLabel(slotId: 1 | 2 | 3, label: string) {
    const next: PhotoSlot[] = draft.fotograflar.map((p) =>
      p.id === slotId ? { ...p, label } : p,
    )
    onChange({ fotograflar: next })
  }

  function onPhotosChange(photos: PhotoMeta[]) {
    onChange({ photos })
  }

  // F6.A — once the user uploads even a single real photo, fade out the
  // legacy "3 slot" placeholder grid so we don't show two parallel photo UIs.
  const useLegacySlots = draft.photos.length === 0

  return (
    <section data-step="3" className="space-y-6">
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
        <Field id="fiyat" label={L.fiyat} error={err('fiyat')}>
          <input
            id="fiyat"
            type="text"
            inputMode="numeric"
            value={draft.fiyat}
            onChange={(e) => onChange({ fiyat: e.target.value.replace(/[^\d]/g, '') })}
            placeholder={L.fiyatPlaceholder}
            data-field="fiyat"
            className={inputClass(!!err('fiyat'))}
          />
        </Field>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {L.summary}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <span className="font-serif text-xl font-normal tabular-nums">{fiyatFmt}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {perM2}
            </span>
          </div>
        </div>
      </div>

      {/* F36.D — AI değerleme önerisi. Draft'tan deterministik listingId üretip
          generateValuation() ile seeded valuation gösteriyoruz. */}
      <WizardAiValuation draft={draft} />

      <Field id="aciklama" label={L.aciklama} error={err('aciklama')}>
        <textarea
          id="aciklama"
          rows={5}
          value={draft.aciklama}
          onChange={(e) => onChange({ aciklama: e.target.value })}
          placeholder={L.aciklamaPlaceholder}
          data-field="aciklama"
          className={`w-full rounded-xl border ${
            err('aciklama') ? 'border-rose-500/60' : 'border-border'
          } bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground`}
        />
        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
          {draft.aciklama.trim().length} {L.chars}
        </div>
      </Field>

      <div>
        <label
          htmlFor="etiket-input"
          className="mb-1.5 block font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          {L.tagsLabel}{' '}
          <span className="text-muted-foreground/70 normal-case tracking-normal">
            {L.tagsHint}
          </span>
        </label>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-foreground">
          {draft.etiketler.map((tag) => (
            <span
              key={tag}
              data-chip={tag}
              className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-xs text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeChip(tag)}
                className="text-foreground/60 hover:text-foreground"
                aria-label={L.removeTagAria(tag)}
                data-chip-remove={tag}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="etiket-input"
            type="text"
            value={chipInput}
            onChange={(e) => {
              const v = e.target.value
              if (v.endsWith(',')) {
                setChipInput(v.slice(0, -1))
                requestAnimationFrame(commitChip)
              } else {
                setChipInput(v)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitChip()
              } else if (e.key === 'Backspace' && !chipInput && draft.etiketler.length > 0) {
                removeChip(draft.etiketler[draft.etiketler.length - 1])
              }
            }}
            onBlur={commitChip}
            placeholder={draft.etiketler.length === 0 ? L.tagsPlaceholder : ''}
            data-field="etiket-input"
            className="flex-1 min-w-[120px] bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <FotoUpload
        initial={draft.photos}
        onChange={onPhotosChange}
        locale={locale}
      />

      {useLegacySlots && (
        // Backward-compat: existing pre-F6 drafts still carry slot meta. We
        // surface the toggle below the new uploader so a returning user with
        // intent-only slot data can keep using it until they upload real photos.
        <fieldset data-legacy-photo-slots="">
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {L.photosLegend}
            <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">
              {L.photosHint}
            </span>
          </legend>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {draft.fotograflar.map((slot) => (
              <div
                key={slot.id}
                data-photo-slot={slot.id}
                data-filled={slot.filled ? 'true' : 'false'}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border ${
                  slot.filled
                    ? 'border-foreground bg-foreground/5'
                    : 'border-dashed border-border bg-card/40'
                } p-2 transition`}
              >
                <button
                  type="button"
                  onClick={() => togglePhotoSlot(slot.id)}
                  aria-label={L.photoSlotAria(slot.id, slot.filled)}
                  data-photo-toggle={slot.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-xs text-foreground hover:bg-foreground/20"
                >
                  {slot.filled ? '✓' : '+'}
                </button>
                <input
                  type="text"
                  value={slot.label}
                  onChange={(e) => setPhotoLabel(slot.id, e.target.value)}
                  placeholder={L.photoSlotPlaceholder(slot.id)}
                  data-photo-label={slot.id}
                  className="w-full bg-transparent text-center text-xs text-muted-foreground outline-none focus:text-foreground"
                />
              </div>
            ))}
          </div>
        </fieldset>
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
