/**
 * IlanOnizleme — preview island for /ilan-ver/onizleme.
 *
 * Wave F4 / Agent-F4A.
 *
 * Reads the draft from `arsam.ilan-draft.v1` and renders a full summary card.
 * "İlanı yayınla" is disabled until every step is complete (incl. KVKK).
 * Submit → generates a mock ref, clearDraft(), navigates to tesekkurler.
 */
import { useEffect, useState } from 'react'
import {
  EMPTY_DRAFT,
  EVENT_NAME,
  IMAR_LABEL,
  TAPU_LABEL,
  TIP_LABEL,
  canEnterStep,
  clearDraft,
  generateRef,
  getDraft,
  isStepComplete,
  resumeStep,
  type IlanDraft,
  type ImarDurumu,
  type TapuTipi,
  type IlanTip,
} from '../../lib/ilan-draft'
import { addIlan } from '../../lib/ilanlarim'

const LABELS = {
  tr: {
    eyebrow: 'Önizleme · son adım',
    headingPre: 'İlanın ',
    headingAccent: 'böyle',
    headingPost: ' görünecek',
    intro: 'Eksik veya yanlış bilgi varsa ilgili adıma dön ve düzelt.',
    areaNotSet: 'Alan belirtilmedi',
    edit: 'Düzenle',
    priceLabel: 'Fiyat',
    featuresLabel: 'Özellikler',
    typeKey: 'Tip',
    zoningKey: 'İmar',
    titleKey: 'Tapu',
    coordsKey: 'Koord.',
    descriptionLabel: 'Açıklama',
    descriptionEmpty: 'Açıklama henüz girilmedi.',
    contactLabel: 'İletişim',
    listedBy: 'İlan veren',
    phoneKey: 'Telefon',
    emailKey: 'E-posta',
    kvkkKey: 'KVKK',
    kvkkOk: 'Onaylandı',
    kvkkMissing: 'Onay eksik',
    photoEmpty: 'boş',
    photoFallback: (n: number) => `Foto ${n}`,
    incompleteStrong: 'Onay eksik.',
    incompleteHint: ' Yayına gönderebilmek için tüm adımları tamamlaman gerekir. ',
    incompleteCta: 'Eksik adıma dön',
    backToEdit: 'Düzenle',
    publish: 'İlanı yayınla',
    publishing: 'Yayınlanıyor…',
    tipLabels: TIP_LABEL,
    imarLabels: IMAR_LABEL,
    tapuLabels: TAPU_LABEL,
  },
  en: {
    eyebrow: 'Preview · final step',
    headingPre: 'Your listing will ',
    headingAccent: 'look',
    headingPost: ' like this',
    intro: 'If anything is missing or wrong, jump back to that step and fix it.',
    areaNotSet: 'Area not set',
    edit: 'Edit',
    priceLabel: 'Price',
    featuresLabel: 'Features',
    typeKey: 'Type',
    zoningKey: 'Zoning',
    titleKey: 'Title',
    coordsKey: 'Coords',
    descriptionLabel: 'Description',
    descriptionEmpty: 'No description yet.',
    contactLabel: 'Contact',
    listedBy: 'Listed by',
    phoneKey: 'Phone',
    emailKey: 'Email',
    kvkkKey: 'KVKK',
    kvkkOk: 'Approved',
    kvkkMissing: 'Not approved',
    photoEmpty: 'empty',
    photoFallback: (n: number) => `Photo ${n}`,
    incompleteStrong: 'Approval missing.',
    incompleteHint: ' You need to complete every step before publishing. ',
    incompleteCta: 'Jump to the missing step',
    backToEdit: 'Edit',
    publish: 'Publish listing',
    publishing: 'Publishing…',
    tipLabels: {
      imarli: 'Buildable',
      tarla: 'Field',
      zeytinlik: 'Olive grove',
      'villa-arsasi': 'Villa plot',
    } as Record<IlanTip, string>,
    imarLabels: {
      konut: 'Residential',
      ticari: 'Commercial',
      karma: 'Mixed',
      tarim: 'Agricultural',
      yok: 'Unzoned',
    } as Record<ImarDurumu, string>,
    tapuLabels: {
      mustakil: 'Sole title',
      hisseli: 'Shared title',
    } as Record<TapuTipi, string>,
  },
} as const

export interface IlanOnizlemeProps {
  locale?: 'tr' | 'en'
}

export default function IlanOnizleme({ locale = 'tr' }: IlanOnizlemeProps = {}) {
  const L = LABELS[locale]
  const numLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const basePath = locale === 'en' ? '/en/ilan-ver' : '/ilan-ver'
  const [draft, setDraftState] = useState<IlanDraft>(EMPTY_DRAFT)
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const d = getDraft()
    setDraftState(d)
    setMounted(true)
    // Redirect back to the highest unfinished step if user lands here too early.
    const target = resumeStep(d)
    if (target <= 4) {
      // Soft warning only — user can still see the page; the publish CTA is
      // disabled. We do NOT auto-redirect because hard-replacing breaks the
      // back-button UX.
    }
    const sync = () => setDraftState(getDraft())
    window.addEventListener(EVENT_NAME, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const allComplete =
    isStepComplete(1, draft) &&
    isStepComplete(2, draft) &&
    isStepComplete(3, draft) &&
    isStepComplete(4, draft)

  const fiyatNum = Number((draft.fiyat || '').replace(/[^\d]/g, '')) || 0
  const alanNum = Number(draft.alan) || 0
  const fiyatFmt =
    fiyatNum > 0 ? `₺${new Intl.NumberFormat(numLocale).format(fiyatNum)}` : '—'
  const perM2 =
    fiyatNum > 0 && alanNum > 0
      ? `₺${new Intl.NumberFormat(numLocale).format(Math.round(fiyatNum / alanNum))}/m²`
      : '—'

  const locationStr = [draft.ilce, draft.il].filter(Boolean).join(' · ') || '—'
  const tipStr = draft.tip ? L.tipLabels[draft.tip] : '—'
  const imarStr = draft.imar ? L.imarLabels[draft.imar] : '—'
  const tapuStr = draft.tapu ? L.tapuLabels[draft.tapu] : '—'

  function submit() {
    if (!allComplete || submitting) return
    setSubmitting(true)
    const ref = generateRef()
    // Persist published entry before the draft is cleared. Field mapping:
    //   ilan-draft.il   → city
    //   ilan-draft.ilce → district
    //   ilan-draft.tip  → contributes to title (no native title field in draft)
    //   ilan-draft.imar → zoning (mapped via IMAR_LABEL)
    //   photos are slot meta only (no blob) → thumbnail stays undefined.
    const fiyat = Number((draft.fiyat || '').replace(/[^\d]/g, '')) || 0
    const alan = Number(draft.alan) || 0
    const tipLabel = draft.tip ? TIP_LABEL[draft.tip] : ''
    const locParts = [draft.ilce, draft.il].filter(Boolean)
    const derivedTitle = [tipLabel, locParts.join(' · ')]
      .filter(Boolean)
      .join(' — ') || `İlan ${ref}`
    try {
      addIlan({
        ref,
        title: derivedTitle,
        district: draft.ilce || '',
        city: draft.il || '',
        price: fiyat,
        area: alan,
        zoning: draft.imar ? IMAR_LABEL[draft.imar] : undefined,
      })
    } catch {
      /* localStorage unavailable — swallow; tesekkurler still shows ref */
    }
    clearDraft()
    // Small timeout for perceived stability — keeps URL update predictable.
    setTimeout(() => {
      window.location.href = `${basePath}/tesekkurler?id=${encodeURIComponent(ref)}`
    }, 80)
  }

  function editStep(n: 1 | 2 | 3 | 4) {
    // Allow edit even if previous step is incomplete — user is jumping back.
    if (!canEnterStep(n, draft) && n !== 1) {
      window.location.href = `${basePath}/1`
      return
    }
    window.location.href = `${basePath}/${n}`
  }

  return (
    <div
      data-ilan-onizleme=""
      data-mounted={mounted ? 'true' : 'false'}
      data-can-submit={allComplete ? 'true' : 'false'}
      className="mx-auto max-w-2xl"
    >
      <header className="mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {L.eyebrow}
        </div>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-4xl">
          {L.headingPre}<em className="font-serif italic font-normal">{L.headingAccent}</em>{L.headingPost}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {L.intro}
        </p>
      </header>

      <article className="rounded-2xl border border-border bg-card p-6" data-ilan-card="">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {tipStr} · {locationStr}
            </div>
            <h2 className="mt-2 font-serif text-2xl font-normal tracking-tight md:text-3xl">
              {alanNum > 0
                ? `${new Intl.NumberFormat(numLocale).format(alanNum)} m²`
                : L.areaNotSet}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => editStep(1)}
            className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
            data-edit-step="1"
          >
            {L.edit}
          </button>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {L.priceLabel}
              </div>
              <button
                type="button"
                onClick={() => editStep(3)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                data-edit-step="3"
              >
                {L.edit}
              </button>
            </div>
            <div className="mt-1 font-serif text-3xl font-normal tracking-tight tabular-nums">
              {fiyatFmt}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">{perM2}</div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {L.featuresLabel}
              </div>
              <button
                type="button"
                onClick={() => editStep(2)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                data-edit-step="2"
              >
                {L.edit}
              </button>
            </div>
            <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">{L.typeKey}</dt>
              <dd className="text-foreground">{tipStr}</dd>
              <dt className="text-muted-foreground">{L.zoningKey}</dt>
              <dd className="text-foreground">{imarStr}</dd>
              <dt className="text-muted-foreground">{L.titleKey}</dt>
              <dd className="text-foreground">{tapuStr}</dd>
              {(draft.lat || draft.lng) && (
                <>
                  <dt className="text-muted-foreground">{L.coordsKey}</dt>
                  <dd className="text-foreground tabular-nums">
                    {draft.lat || '—'}, {draft.lng || '—'}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {L.descriptionLabel}
            </div>
            <button
              type="button"
              onClick={() => editStep(3)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              data-edit-step="3"
            >
              {L.edit}
            </button>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-foreground">
            {draft.aciklama || (
              <span className="italic text-muted-foreground">{L.descriptionEmpty}</span>
            )}
          </p>
          {draft.etiketler.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {draft.etiketler.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground"
                  data-preview-tag={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/*
            F6.A — prefer the real uploaded photo metadata when present.
            ObjectURLs can't survive a wizard → preview navigation because the
            FotoUpload island unmounted on the way here. We render a metadata
            caption ("photo-1.jpg · 2.3 MB") so the user still sees the photos
            were captured. Real thumbnails are visible inside Step 3 itself.
          */}
          {draft.photos.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4" data-preview-photos="">
              {draft.photos.map((p, idx) => (
                <div
                  key={p.id}
                  data-preview-photo={p.id}
                  data-filled="true"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-foreground/40 bg-foreground/5 p-2 text-center text-xs text-muted-foreground"
                >
                  <span className="font-mono tabular-nums text-foreground">#{idx + 1}</span>
                  <span className="line-clamp-2 break-all">{p.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground/70">
                    {(p.size / (1024 * 1024)).toFixed(p.size >= 1024 * 1024 ? 1 : 2)} MB
                  </span>
                </div>
              ))}
            </div>
          ) : (
            draft.fotograflar.some((p) => p.filled) && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {draft.fotograflar.map((p) => (
                  <div
                    key={p.id}
                    data-preview-photo={p.id}
                    data-filled={p.filled ? 'true' : 'false'}
                    className={`aspect-square rounded-lg border ${
                      p.filled
                        ? 'border-foreground/40 bg-foreground/5'
                        : 'border-dashed border-border bg-card/40'
                    } flex items-center justify-center text-xs text-muted-foreground`}
                  >
                    {p.filled ? p.label || L.photoFallback(p.id) : L.photoEmpty}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {L.contactLabel}
            </div>
            <button
              type="button"
              onClick={() => editStep(4)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              data-edit-step="4"
            >
              {L.edit}
            </button>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-muted-foreground">{L.listedBy}</dt>
            <dd className="text-foreground">{draft.ad || '—'}</dd>
            <dt className="text-muted-foreground">{L.phoneKey}</dt>
            <dd className="text-foreground tabular-nums">{draft.telefon || '—'}</dd>
            {draft.email && (
              <>
                <dt className="text-muted-foreground">{L.emailKey}</dt>
                <dd className="text-foreground">{draft.email}</dd>
              </>
            )}
            <dt className="text-muted-foreground">{L.kvkkKey}</dt>
            <dd className="text-foreground">{draft.kvkk ? L.kvkkOk : L.kvkkMissing}</dd>
          </dl>
        </div>
      </article>

      {!allComplete && mounted && (
        <div
          className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100"
          data-ilan-incomplete=""
        >
          <strong className="font-medium">{L.incompleteStrong}</strong>{L.incompleteHint}
          <button
            type="button"
            onClick={() => editStep(resumeStep(draft) <= 4 ? (resumeStep(draft) as 1 | 2 | 3 | 4) : 1)}
            className="underline"
          >
            {L.incompleteCta}
          </button>
          .
        </div>
      )}

      <nav className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => editStep(1)}
          data-ilan-edit-from-start=""
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <span aria-hidden="true">←</span> {L.backToEdit}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!allComplete || submitting}
          data-ilan-publish=""
          data-can-submit={allComplete ? 'true' : 'false'}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
            allComplete && !submitting
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-foreground/40 text-background cursor-not-allowed'
          }`}
        >
          {submitting ? L.publishing : L.publish}
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  )
}
