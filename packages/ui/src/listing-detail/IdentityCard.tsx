/**
 * IdentityCard — F37 Faz 2 / Bölüm B.
 *
 * Mockup'taki "TKGM yapılandırılmış kimlik kartı" — 2 sütun (md+):
 *   - Sol: TKGM key-value tablosu (Konum, Vasfı, Yüzölçümü tapu/aplikasyon
 *     + sapma %, Ada/Parsel, Pafta, Mülkiyet (hisseli badge), İfraz,
 *     Hissedar sayısı)
 *   - Sağ: Fiyat panel (büyük ₺ + m² başı + AI tahmin range + güven badge)
 *     + 3 CTA (Ara · WhatsApp · Görüşme iste)
 *
 * Mobile (< md): tek kolon stack — sol önce, sağ alta.
 *
 * Data:
 *   - `useListingExtended(listingId)` → TKGM yapılandırılmış data
 *   - `useAiValuation(listingId)` → AI tahmin range
 *
 * Mockup ref: remixed-1848500f.html L1796-1837 (id-card section).
 *
 * NOT: Top barrel'a EKLENMEZ (Astro SSR güvenliği).
 */

import { MessageCircle, Phone, Sparkles } from '@landx/icons'
import { type ReactElement, type ReactNode } from 'react'
import {
  LISTINGS,
  useAiValuation,
  useListingExtended,
  type ListingExtended,
  type ListingVasfi,
  type MulkiyetTipi,
} from '@landx/data'
import { cn } from '../lib/cn'
import { formatTL } from '../lib/format'

/** Fiyat lookup — `IdentityCard` sadece listingId alıyor (spec), fiyat
 *  LISTINGS mock'unda. `@landx/data` listings sabitleri pure data (leaflet
 *  pull etmez), SSR güvenli. */
function lookupPrice(listingId: string): number {
  return LISTINGS.find((l) => l.id === listingId)?.price ?? 0
}

export interface IdentityCardProps {
  listingId: string
}

const VASFI_LABEL: Record<ListingVasfi, string> = {
  arsa: 'ARSA',
  tarla: 'TARLA',
  bag: 'BAĞ',
  bahce: 'BAHÇE',
  zeytinlik: 'ZEYTİNLİK',
}

function MulkiyetBadge({
  tip,
  hisseOrani,
  hissedarSayisi,
}: {
  tip: MulkiyetTipi
  hisseOrani?: number
  hissedarSayisi?: number
}): ReactElement {
  if (tip === 'mustakil') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full',
          'bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium',
          'text-emerald-700 dark:text-emerald-300',
        )}
      >
        Müstakil
      </span>
    )
  }
  const pay = hisseOrani ? Math.round(hisseOrani * 100) : null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium',
        'text-amber-700 dark:text-amber-300',
      )}
      title={hissedarSayisi ? `${hissedarSayisi} hissedar` : undefined}
    >
      Hisseli{pay !== null ? ` · %${pay}` : ''}
    </span>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: ReactNode
}): ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-2.5 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-right text-[13px] text-foreground">
        {children}
      </span>
    </div>
  )
}

function IdentityRows({ ext }: { ext: ListingExtended }): ReactElement {
  const sapmaSign = ext.yuzolcumu.sapmaPct > 0 ? '+' : ''
  return (
    <div className="space-y-0">
      <Row label="Vasfı">
        <span className="font-medium tabular-nums">{VASFI_LABEL[ext.vasfi]}</span>
        {ext.toprakSinifi ? (
          <span className="text-muted-foreground">
            {' '}
            · {ext.toprakSinifi.replace('_', ' ')}
          </span>
        ) : null}
        {ext.egim > 0 ? (
          <span className="text-muted-foreground"> · eğim %{ext.egim}</span>
        ) : null}
      </Row>
      <Row label="Yüzölçümü">
        <span>
          <span className="tabular-nums font-medium">
            {ext.yuzolcumu.tapu.toLocaleString('tr-TR')} m²
          </span>{' '}
          <small className="text-muted-foreground">tapu</small>
          <span className="text-muted-foreground"> · </span>
          <span className="tabular-nums">
            {ext.yuzolcumu.aplikasyon.toLocaleString('tr-TR')} m²
          </span>{' '}
          <small className="text-muted-foreground">aplikasyon</small>
        </span>
      </Row>
      <Row label="Sapma">
        <span
          className={cn(
            'tabular-nums font-medium',
            Math.abs(ext.yuzolcumu.sapmaPct) <= 1
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-700 dark:text-amber-300',
          )}
        >
          {sapmaSign}
          {ext.yuzolcumu.sapmaPct.toFixed(1)}%
        </span>
      </Row>
      <Row label="Ada / Parsel">
        <span className="font-mono tabular-nums">
          {ext.ada} / {ext.parsel}
        </span>
      </Row>
      <Row label="Pafta">
        <span className="font-mono tabular-nums">{ext.pafta}</span>
      </Row>
      <Row label="Mülkiyet">
        <MulkiyetBadge
          tip={ext.mulkiyetTipi}
          hisseOrani={ext.hisseOrani}
          hissedarSayisi={ext.hissedarSayisi}
        />
      </Row>
      <Row label="İfraz">
        <span
          className={cn(
            'font-medium',
            ext.ifrazMumkun
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-muted-foreground',
          )}
        >
          {ext.ifrazMumkun ? 'Mümkün' : 'Mümkün değil'}
          {ext.cephe ? (
            <span className="ml-1 text-muted-foreground">
              · {ext.cephe.uzunluk} m {ext.cephe.yol} cephe
            </span>
          ) : null}
        </span>
      </Row>
      {ext.mulkiyetTipi === 'hisseli' && ext.hissedarSayisi ? (
        <Row label="Hissedar sayısı">
          <span className="tabular-nums font-medium">
            {ext.hissedarSayisi} kişi
          </span>
        </Row>
      ) : null}
    </div>
  )
}

function IdentityRowsSkeleton(): ReactElement {
  return (
    <div className="space-y-0" aria-busy="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="flex items-baseline justify-between gap-3 border-b border-border/50 py-2.5"
        >
          <span className="h-3 w-20 animate-pulse rounded bg-foreground/5" />
          <span className="h-3 w-32 animate-pulse rounded bg-foreground/5" />
        </div>
      ))}
    </div>
  )
}

function PricePanel({
  listingId,
  totalPrice,
  size,
  hisseOrani,
}: {
  listingId: string
  totalPrice: number
  size: number
  hisseOrani?: number
}): ReactElement {
  const aiQ = useAiValuation(listingId)
  const pricePerM2 = size > 0 ? Math.round(totalPrice / size) : 0
  const hissePct = hisseOrani ? Math.round(hisseOrani * 100) : null

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl bg-foreground/5 p-4',
        'ring-1 ring-border/60',
      )}
    >
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Fiyat
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
          {formatTL(totalPrice)}
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          m² başı{' '}
          <span className="tabular-nums text-foreground">
            {formatTL(pricePerM2)}
          </span>
          {hissePct !== null ? (
            <span> · %{hissePct} hisse için</span>
          ) : null}
        </div>
      </div>

      {/* AI tahmin range + güven */}
      <div className="rounded-lg bg-card p-3 ring-1 ring-border/40">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          AI değer tahmini
        </div>
        {aiQ.isLoading || !aiQ.data ? (
          <div className="mt-1 h-6 w-32 animate-pulse rounded bg-foreground/5" />
        ) : (
          <>
            <div className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatTL(Math.round(aiQ.data.range[0] / 100))} –{' '}
              {formatTL(Math.round(aiQ.data.range[1] / 100))}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
                  aiQ.data.confidence >= 0.8
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : aiQ.data.confidence >= 0.6
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                )}
              >
                Güven %{Math.round(aiQ.data.confidence * 100)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3 CTA */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <a
          href="tel:+908505320900"
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-foreground/5 px-3 py-2 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          Ara
        </a>
        <a
          href={`https://wa.me/908505320900?text=${encodeURIComponent(`Merhaba, PRS-${listingId} ilanı için bilgi alabilir miyim?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-foreground/5 px-3 py-2 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={`/iletisim?ilan=${listingId}`}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-emerald-600 px-3 py-2 text-[12px] font-medium text-white',
            'hover:bg-emerald-700 transition-colors',
            'dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950',
          )}
        >
          Görüşme iste
        </a>
      </div>
    </div>
  )
}

export function IdentityCard({ listingId }: IdentityCardProps): ReactElement {
  const extQ = useListingExtended(listingId)

  return (
    <section
      className="rounded-2xl bg-card p-4 ring-1 ring-border md:p-6"
      aria-labelledby={`identity-${listingId}`}
    >
      <header className="mb-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          B. bölüm — kimlik
        </div>
        <h2
          id={`identity-${listingId}`}
          className="mt-1 text-xl font-semibold text-foreground md:text-2xl"
        >
          Parselin{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            kimlik kartı
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          TKGM, belediye ve tarım bakanlığı kaynaklarından doğrulanmış parsel
          verisi — yapılandırılmış olarak.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="rounded-xl bg-foreground/[0.02] p-4 ring-1 ring-border/40">
          {extQ.isLoading || !extQ.data ? (
            <IdentityRowsSkeleton />
          ) : (
            <IdentityRows ext={extQ.data} />
          )}
        </div>
        <PricePanel
          listingId={listingId}
          totalPrice={extQ.data ? lookupPrice(extQ.data.listingId) : 0}
          size={extQ.data?.yuzolcumu.tapu ?? 0}
          hisseOrani={extQ.data?.hisseOrani}
        />
      </div>
    </section>
  )
}

