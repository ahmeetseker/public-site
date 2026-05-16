/**
 * WizardAiValuation — F36.D
 *
 * Mount: `/ilan-ver/3` (Step 3 Fiyat) — AI değerleme önerisi.
 *
 * Wizard'da henüz ilan oluşturulmadığı için gerçek `listingId` yok.
 * Draft'taki temel alanlardan (il, ilce, alan, imar, tapu) deterministik bir
 * synthetic id üretip `AiValuationCard`'a aktarıyoruz; `generateValuation()`
 * helper'ı bu id üzerinden seeded random walk ile valuation üretir (aynı
 * input → aynı çıktı). Kullanıcı temel alanları doldurana kadar "AI tahmin
 * almak için önce konumu ve özellikleri doldur" placeholder gösterilir.
 *
 * Hook stratejisi: tek bir `useTransition` ile draftKey hesabını lazyle —
 * her keystroke'da yeniden render olmasın diye Step3Fiyat'ın `useTransition`
 * pencereleri içinde kalıyoruz.
 */

import { useMemo } from 'react'
import AiValuationCard from '../ai/AiValuationCard'
import type { IlanDraft } from '../../lib/ilan-draft'

interface Props {
  draft: IlanDraft
}

/**
 * Wizard'da AI değerleme için gerekli minimum alan seti.
 * Hepsi dolu değilse istemiyoruz — yanıltıcı tahmin vermek istemeyiz.
 */
function isReadyForValuation(draft: IlanDraft): boolean {
  return (
    !!draft.il &&
    !!draft.ilce &&
    !!draft.alan &&
    Number(draft.alan) > 0 &&
    !!draft.imar &&
    !!draft.tapu
  )
}

/**
 * Draft fields'den deterministik synthetic listingId üret.
 * Aynı input set → aynı id → aynı valuation (cache hit).
 */
function buildDraftListingId(draft: IlanDraft): string {
  const parts = [
    draft.il || '?',
    draft.ilce || '?',
    draft.alan || '0',
    draft.imar || '?',
    draft.tapu || '?',
  ]
  return `draft-${parts.join('-').toLocaleLowerCase('tr-TR').replace(/\s+/g, '_')}`
}

export default function WizardAiValuation({ draft }: Props) {
  const ready = isReadyForValuation(draft)
  const listingId = useMemo(() => buildDraftListingId(draft), [
    draft.il,
    draft.ilce,
    draft.alan,
    draft.imar,
    draft.tapu,
  ])

  return (
    <section
      data-wizard-ai-valuation=""
      aria-labelledby="wizard-ai-heading"
      className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-4 md:p-5"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            AI · Fiyat Önerisi
          </div>
          <h3
            id="wizard-ai-heading"
            className="mt-1 font-serif text-lg font-normal tracking-tight md:text-xl"
          >
            <em className="font-serif italic font-normal">AI</em> tahmini
          </h3>
        </div>
        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          beta
        </span>
      </header>

      {!ready && (
        <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-xs text-muted-foreground">
          AI tahmin için önce <strong className="font-medium text-foreground">il, ilçe, alan (m²), imar</strong> ve{' '}
          <strong className="font-medium text-foreground">tapu</strong> bilgisini doldur.
          <br />
          <span className="mt-1 inline-block text-xs text-muted-foreground/80">
            Tahmin, benzer bölgedeki ilanların ortalamasına göre hesaplanır — kesin değer değildir.
          </span>
        </div>
      )}

      {ready && (
        <>
          <AiValuationCard listingId={listingId} />
          <p className="mt-3 text-xs text-muted-foreground">
            Bu tahmin yalnızca yön gösterici amaçlıdır. Final fiyatı sen belirlersin —
            ekibimiz değerlendirir, sonra yayına alırız.
          </p>
        </>
      )}
    </section>
  )
}
