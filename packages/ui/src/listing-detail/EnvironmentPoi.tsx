/**
 * EnvironmentPoi — `/ilan/[slug]` I bölümü (Wave F37 / Faz 2 / F37.2).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 2178-2212 ("Yakın çevre
 * analizi"). 3 score stat (Yürüme/Toplu taşıma/Bisiklet — 0-100) + POI
 * listesi (hastane, okul, market, eczane + opsiyonel future YHT/metro).
 * Veri kaynağı: `useEnvironmentPoi(listingId)`.
 *
 * Liquid Glass tema portu — sayı vurgusu serif font + tabular-nums.
 * Future POI satırları amber border vurgu + "açılış yıl" badge.
 */
import { useEnvironmentPoi } from '@landx/data'
import type { EnvironmentPoiItem } from '@landx/data'
import { cn } from '../lib/cn'

export interface EnvironmentPoiProps {
  listingId: string
  className?: string
}

// ─── Score helpers ───────────────────────────────────────────────────────────

/** Walk Score adresleri (TR çevirisi). 0-24, 25-49, 50-69, 70-89, 90-100. */
function walkLabel(n: number): string {
  if (n >= 90) return 'Yürüyüş cenneti'
  if (n >= 70) return 'Çok yürünebilir'
  if (n >= 50) return 'Kısmen yürünebilir'
  if (n >= 25) return 'Araç bağımlı'
  return 'Tamamen araç bağımlı'
}

function transitLabel(n: number): string {
  if (n >= 70) return 'Mükemmel ulaşım'
  if (n >= 50) return 'İyi ulaşım'
  if (n >= 25) return 'Sınırlı'
  return 'Çok sınırlı'
}

function bikeLabel(n: number): string {
  if (n >= 70) return 'Bisikletçi cenneti'
  if (n >= 50) return 'Çok bisikletçi dostu'
  if (n >= 25) return 'Kısıtlı altyapı'
  return 'Bisiklete uygun değil'
}

// ─── POI tip ikonları (lightweight glyph) ────────────────────────────────────

const POI_GLYPH: Record<string, string> = {
  hastane: '⊕',
  ilkokul: '⌂',
  market: '▷',
  eczane: '℞',
  jandarma: '◫',
  otoyol_cikis: '↻',
  yht: '⇄',
  metro: '⇆',
  otoyol: '⇅',
  havalimani: '✈',
}

const POI_TYPE_LABEL: Record<string, string> = {
  hastane: 'En yakın hastane',
  ilkokul: 'İlkokul',
  market: 'Market',
  eczane: 'Eczane',
  jandarma: 'Jandarma',
  otoyol_cikis: 'Otoyol çıkışı',
  yht: 'Planlanan YHT',
  metro: 'Planlanan metro',
  otoyol: 'Yapımı süren otoyol',
  havalimani: 'Bölge havalimanı',
}

function poiGlyph(type: string): string {
  return POI_GLYPH[type] ?? '◦'
}

function poiTypeLabel(type: string): string {
  return POI_TYPE_LABEL[type] ?? type
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EnvironmentPoi({ listingId, className }: EnvironmentPoiProps) {
  const { data, isLoading } = useEnvironmentPoi(listingId)

  return (
    <section
      className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}
      aria-labelledby="environment-poi-heading"
    >
      <header className="border-b border-border/60 px-5 py-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          I — bölüm · çevre
        </p>
        <h2 id="environment-poi-heading" className="font-serif text-2xl leading-tight">
          Yakın çevre <em className="font-serif italic">analizi</em>
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Walk Score modeli Türkiye verisine eğitilmiş. Sağlık, eğitim, ticaret
          tesisleri ve planlanan ulaşım yatırımları (TCDD, otoyol, metro).
        </p>
      </header>

      {/* 3 score stat */}
      <div className="grid grid-cols-1 gap-3 px-5 pt-5 sm:grid-cols-3">
        <ScoreStat
          heading="Yürüme skoru"
          value={data?.walkScore}
          desc={data ? walkLabel(data.walkScore) : '—'}
          loading={isLoading}
        />
        <ScoreStat
          heading="Toplu taşıma"
          value={data?.transitScore}
          desc={data ? transitLabel(data.transitScore) : '—'}
          loading={isLoading}
        />
        <ScoreStat
          heading="Bisiklet"
          value={data?.bikeScore}
          desc={data ? bikeLabel(data.bikeScore) : '—'}
          loading={isLoading}
        />
      </div>

      {/* POI listesi */}
      <div className="space-y-2 p-5">
        {isLoading || !data ? (
          <PoiSkeletonRows />
        ) : data.poi.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-foreground/[0.02] px-4 py-6 text-center text-sm text-muted-foreground">
            Bu konum için henüz POI verisi yok.
          </p>
        ) : (
          data.poi.map((p, i) => <PoiRow key={`${p.type}-${i}`} item={p} />)
        )}
      </div>
    </section>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ScoreStatProps {
  heading: string
  value?: number
  desc: string
  loading?: boolean
}

function ScoreStat({ heading, value, desc, loading }: ScoreStatProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-4">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {heading}
      </h3>
      {loading ? (
        <div className="mt-2 h-9 w-16 animate-pulse rounded bg-foreground/[0.08]" />
      ) : (
        <div className="mt-1 font-serif text-4xl tabular-nums leading-none">
          {value ?? '—'}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}

function PoiRow({ item }: { item: EnvironmentPoiItem }) {
  const isFuture = item.future === true
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
        isFuture
          ? 'border-2 border-amber-500/40 bg-amber-500/5'
          : 'border border-border/40 bg-foreground/[0.02]',
      )}
    >
      <span className="flex flex-1 items-center gap-2.5 text-foreground">
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-full text-base',
            isFuture
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : 'bg-foreground/[0.06] text-foreground/70',
          )}
          aria-hidden
        >
          {poiGlyph(item.type)}
        </span>
        <span className="truncate">
          <span className="font-medium">{poiTypeLabel(item.type)}</span>
          {item.label && (
            <span className="text-muted-foreground"> · {item.label}</span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-2 whitespace-nowrap text-xs">
        <span className="tabular-nums text-foreground">
          {fmtDistance(item.distance)}
        </span>
        {isFuture && item.futureDate && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {item.futureDate} açılış
          </span>
        )}
      </span>
    </div>
  )
}

function PoiSkeletonRows() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 animate-pulse rounded-full bg-foreground/[0.08]" />
            <div className="h-3 w-40 animate-pulse rounded bg-foreground/[0.08]" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-foreground/[0.08]" />
        </div>
      ))}
    </div>
  )
}
