/**
 * LegalEncumbrancePanel (E) — Wave F37 / Faz 2 (F37.4).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 1974-2022.
 * TKGM TAKBİS şerh/beyan/irtifak kayıtları üç renk kodu altında
 * (temiz / dikkat / kritik) + PDF rapor CTA.
 *
 * Veri kaynağı: `useEncumbrances(listingId)` — F37 Faz 1 hook.
 * Kayıt yoksa "kritik" kartı opacity-50 ile gösterilir (mockup paritesi).
 */

import { useMemo } from 'react'
import { useEncumbrances } from '@landx/data'
import type { Encumbrance, EncumbranceCategory } from '@landx/data'
import { cn } from '../lib/cn'
import { ListingDetailQueryProvider } from './_provider'

export interface LegalEncumbrancePanelProps {
  listingId: string
  className?: string
}

interface CategoryMeta {
  marker: string
  title: string
  /** Header label shown when this category is empty (mockup paritesi). */
  emptyLabel: string
  /** Default placeholder bullets when group is empty. */
  defaultBullets: string[]
  card: string
  marker_class: string
  title_class: string
  meta_class: string
  bullet_class: string
}

const META: Record<EncumbranceCategory, CategoryMeta> = {
  temiz: {
    marker: '●',
    title: 'Temiz',
    emptyLabel: 'Tarama tamamlandı',
    defaultBullets: [
      'Kamu haczi şerhi tespit edilmedi',
      'İntifa / sükna hakkı yok',
      'Kamulaştırma şerhi yok',
      '18. madde (şuyulandırma) uygulaması yok',
    ],
    card: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30',
    marker_class: 'text-emerald-600 dark:text-emerald-400',
    title_class: 'text-emerald-900 dark:text-emerald-100',
    meta_class: 'text-emerald-700/80 dark:text-emerald-300/80',
    bullet_class: 'text-emerald-900/90 dark:text-emerald-100/90',
  },
  dikkat: {
    marker: '▲',
    title: 'Dikkat',
    emptyLabel: 'Bağlayıcı değil — gözden geçirin',
    defaultBullets: [
      'Bilgilendirici şerh tespit edilmedi',
    ],
    card: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30',
    marker_class: 'text-amber-600 dark:text-amber-400',
    title_class: 'text-amber-900 dark:text-amber-100',
    meta_class: 'text-amber-700/80 dark:text-amber-300/80',
    bullet_class: 'text-amber-900/90 dark:text-amber-100/90',
  },
  kritik: {
    marker: '■',
    title: 'Kritik',
    emptyLabel: 'Bu parselde yok — örnek',
    defaultBullets: [
      '18. madde uygulaması · kamulaştırma şerhi · arkeolojik SİT — tespit edilirse burada kırmızı uyarı çıkar.',
    ],
    card: 'border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/30',
    marker_class: 'text-rose-600 dark:text-rose-400',
    title_class: 'text-rose-900 dark:text-rose-100',
    meta_class: 'text-rose-700/80 dark:text-rose-300/80',
    bullet_class: 'text-rose-900/90 dark:text-rose-100/90',
  },
}

const ORDER: EncumbranceCategory[] = ['temiz', 'dikkat', 'kritik']

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function GroupCard({
  category,
  items,
}: {
  category: EncumbranceCategory
  items: Encumbrance[]
}) {
  const meta = META[category]
  const isEmpty = items.length === 0
  const bullets = isEmpty
    ? meta.defaultBullets
    : items.map((e) => {
        const ref = e.legalReference ? ` (${e.legalReference})` : ''
        return `${e.description}${ref}`
      })

  // En son doğrulama tarihi (varsa).
  const latestVerifiedAt = items
    .map((e) => e.verifiedAt)
    .sort()
    .pop()

  const headerMeta = isEmpty
    ? meta.emptyLabel
    : latestVerifiedAt
      ? `TKGM doğrulaması · ${formatDate(latestVerifiedAt)}`
      : 'TKGM kaydı'

  const countLabel = isEmpty
    ? `0 alan`
    : `${items.length} alan${items.length > 1 ? '' : ''}`

  return (
    <article
      className={cn(
        'rounded-xl border p-4 transition-opacity',
        meta.card,
        isEmpty && 'opacity-55',
      )}
      aria-label={`${meta.title} şerh kategorisi`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <h4 className={cn('flex items-center gap-2 text-sm font-medium', meta.title_class)}>
          <span aria-hidden className={cn('text-base leading-none', meta.marker_class)}>
            {meta.marker}
          </span>
          <span>
            {meta.title} · {countLabel}
          </span>
        </h4>
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', meta.meta_class)}>
          {headerMeta}
        </span>
      </header>
      <ul className="space-y-1.5 text-sm">
        {bullets.map((bullet, i) => (
          <li
            key={i}
            className={cn('flex gap-2 leading-relaxed', meta.bullet_class)}
          >
            <span aria-hidden className="mt-1 shrink-0 text-xs opacity-60">
              ›
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-border bg-card/60"
        />
      ))}
    </div>
  )
}

function LegalEncumbrancePanelInner({ listingId, className }: LegalEncumbrancePanelProps) {
  const { data, isPending, isError } = useEncumbrances(listingId)

  const grouped = useMemo<Record<EncumbranceCategory, Encumbrance[]>>(() => {
    const init: Record<EncumbranceCategory, Encumbrance[]> = {
      temiz: [],
      dikkat: [],
      kritik: [],
    }
    if (!data) return init
    for (const e of data) {
      init[e.category].push(e)
    }
    return init
  }, [data])

  return (
    <section
      aria-labelledby="serh-heading"
      className={cn('rounded-2xl border border-border bg-card p-5 md:p-6', className)}
    >
      <header className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          E. bölüm — şerh
        </div>
        <h2
          id="serh-heading"
          className="mt-1 font-serif text-2xl font-light tracking-tight md:text-3xl"
        >
          Hukuki şerh & <em className="font-serif italic font-light">beyan paneli</em>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          TKGM TAKBİS şerh / beyan / irtifak kayıtları üç renk kodu altında: temiz, dikkat,
          kritik. Her şerh için sade Türkçe açıklama.
        </p>
      </header>

      {isPending ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
          Şerh kayıtları yüklenemedi. Sayfayı yenilemeyi deneyin.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-3">
          {ORDER.map((cat) => (
            <GroupCard key={cat} category={cat} items={grouped[cat]} />
          ))}
        </div>
      )}

      <button
        type="button"
        className={cn(
          'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-medium backdrop-blur transition',
          'hover:bg-background hover:shadow-sm',
        )}
      >
        <span aria-hidden>⚖</span>
        <span>Bir avukatla görüşmeyi öneririz · şerh raporunu PDF olarak indir</span>
      </button>
    </section>
  )
}

export function LegalEncumbrancePanel(props: LegalEncumbrancePanelProps) {
  return (
    <ListingDetailQueryProvider>
      <LegalEncumbrancePanelInner {...props} />
    </ListingDetailQueryProvider>
  )
}
