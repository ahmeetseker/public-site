/**
 * InlineCompare (K) — Wave F37 / Faz 2 (F37.4).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 2254-2318.
 * 3-sütun karşılaştırma: bu parsel + 2 emsal × 6 metrik (yüzölçümü,
 * ₺/m², mülkiyet, imar, risk skoru, AI değer farkı) + favorile / ortak
 * liste CTA'ları.
 *
 * Veri kaynağı: `useCompareSnapshot(listingId)` — F37 Faz 1 hook.
 * "Bu parsel" sütunu accent (border + bg tint). Cell tone'ları
 * good/warn/risk renk kodlu. Mobilde stacked cards.
 */

import { useCompareSnapshot } from '@landx/data'
import type { CompareRow, CompareTone } from '@landx/data'
import { cn } from '../lib/cn'
import { ListingDetailQueryProvider } from './_provider'

export interface InlineCompareProps {
  listingId: string
  className?: string
}

const TONE: Record<CompareTone, string> = {
  good: 'text-emerald-700 dark:text-emerald-300',
  warn: 'text-amber-700 dark:text-amber-300',
  risk: 'text-rose-700 dark:text-rose-300',
}

const TONE_BG: Record<CompareTone, string> = {
  good: 'bg-emerald-50/40 dark:bg-emerald-950/20',
  warn: 'bg-amber-50/40 dark:bg-amber-950/20',
  risk: 'bg-rose-50/40 dark:bg-rose-950/20',
}

function CellTone({
  value,
  tone,
  className,
}: {
  value: string
  tone?: CompareTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block tabular-nums font-medium',
        tone ? TONE[tone] : 'text-foreground',
        className,
      )}
    >
      {value}
    </span>
  )
}

function DesktopTable({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th
              scope="col"
              className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Metrik
            </th>
            <th
              scope="col"
              className={cn(
                'rounded-t-xl border border-foreground/20 px-3 py-3 text-sm font-medium',
                'bg-foreground/5',
              )}
            >
              Bu parsel
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-sm font-medium text-muted-foreground"
            >
              Karşıl. #1
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-sm font-medium text-muted-foreground"
            >
              Karşıl. #2
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.metric}
              className={cn(
                i < rows.length - 1 ? 'border-b border-border/60' : '',
              )}
            >
              <th
                scope="row"
                className="px-3 py-3 text-left text-sm font-normal text-muted-foreground"
              >
                {row.metric}
              </th>
              <td
                className={cn(
                  'border-x border-foreground/20 px-3 py-3',
                  'bg-foreground/[0.04]',
                  i === rows.length - 1 && 'rounded-b-xl border-b border-foreground/20',
                )}
              >
                <CellTone value={row.thisValue} tone={row.thisTone} />
              </td>
              <td className="px-3 py-3">
                <CellTone value={row.comp1Value} tone={row.comp1Tone} />
              </td>
              <td className="px-3 py-3">
                <CellTone value={row.comp2Value} tone={row.comp2Tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileStack({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => (
        <div
          key={row.metric}
          className="rounded-xl border border-border bg-background/40 p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {row.metric}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div
              className={cn(
                'rounded-lg border border-foreground/20 bg-foreground/[0.04] p-2',
                row.thisTone && TONE_BG[row.thisTone],
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Bu parsel
              </div>
              <div className="mt-1">
                <CellTone value={row.thisValue} tone={row.thisTone} className="text-sm" />
              </div>
            </div>
            <div
              className={cn(
                'rounded-lg border border-border p-2',
                row.comp1Tone && TONE_BG[row.comp1Tone],
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Karşıl. #1
              </div>
              <div className="mt-1">
                <CellTone value={row.comp1Value} tone={row.comp1Tone} className="text-sm" />
              </div>
            </div>
            <div
              className={cn(
                'rounded-lg border border-border p-2',
                row.comp2Tone && TONE_BG[row.comp2Tone],
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Karşıl. #2
              </div>
              <div className="mt-1">
                <CellTone value={row.comp2Value} tone={row.comp2Tone} className="text-sm" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-card/60" />
      ))}
    </div>
  )
}

function InlineCompareInner({ listingId, className }: InlineCompareProps) {
  const { data, isPending, isError } = useCompareSnapshot(listingId)

  return (
    <section
      aria-labelledby="karsi-heading"
      className={cn('rounded-2xl border border-border bg-card p-5 md:p-6', className)}
    >
      <header className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          K. bölüm — karşılaştır
        </div>
        <h2
          id="karsi-heading"
          className="mt-1 font-serif text-2xl font-light tracking-tight md:text-3xl"
        >
          Karşılaştırma & <em className="font-serif italic font-light">favoriler</em>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Bu parseli son baktığın iki emsalle yan yana koy. Eş, ortak veya aileyle paylaşılan
          ortak liste oluştur.
        </p>
      </header>

      {isPending ? (
        <LoadingSkeleton />
      ) : isError || !data ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
          Karşılaştırma verisi yüklenemedi.
        </div>
      ) : (
        <>
          <DesktopTable rows={data.rows} />
          <MobileStack rows={data.rows} />
        </>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-medium backdrop-blur transition',
            'hover:bg-background hover:shadow-sm',
          )}
        >
          <span aria-hidden>♡</span>
          <span>Favorile</span>
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-medium backdrop-blur transition',
            'hover:bg-background hover:shadow-sm',
          )}
        >
          <span aria-hidden>⌘</span>
          <span>Ortak liste · eş, ortak, aile</span>
        </button>
      </div>
    </section>
  )
}

export function InlineCompare(props: InlineCompareProps) {
  return (
    <ListingDetailQueryProvider>
      <InlineCompareInner {...props} />
    </ListingDetailQueryProvider>
  )
}
