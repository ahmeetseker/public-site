/**
 * ListingDetailHero — F37 Faz 2 / Bölüm A.
 *
 * `/ilan/[slug]` üst başlık adası: title block (Satılık · Tarla · m²) +
 * verifikasyon rozet sırası (5-8 inline) + status pills (canlı dot, ilan no,
 * görüntülenme, favori) + action chips (Paylaş · Karşılaştır · Fiyat alarmı).
 *
 * Data:
 *   - `useVerificationBadges(listingId)` → 5-8 rozet (TKGM, Belediye, Drone,
 *     Tarım Bakanlığı, AFAD, MTA, DSİ, MGM)
 *   - `useAiValuation(listingId)` → fiyat altında "AI: ₺X – Y" range
 *   - `useTriggerPriceAlert()` → "Fiyat alarmı" chip mutation
 *
 * Mockup ref: remixed-1848500f.html L1606-1676 (status-pills + verif-row +
 * title-block). Liquid Glass tema'ya port — `bg-card`/`text-foreground`,
 * `font-serif italic` sadece title vurgu kelimesinde.
 *
 * NOT: Top barrel'a (`@landx/ui`) EKLENMEZ. Sadece sub-path import:
 * `@landx/ui/listing-detail` (Astro SSR güvenliği — F31 ADR).
 */

import { Bell, GitCompare, Heart, Share2 } from '@landx/icons'
import { useTransition, type ReactElement } from 'react'
import {
  useAiValuation,
  useTriggerPriceAlert,
  useVerificationBadges,
  type Listing,
  type VerificationBadge,
} from '@landx/data'
import { cn } from '../lib/cn'
import { formatTL } from '../lib/format'

export interface ListingDetailHeroProps {
  listing: Listing
}

const TIPI_LABEL: Record<string, string> = {
  İmarlı: 'Arsa',
  Tarla: 'Tarla',
  Zeytinlik: 'Zeytinlik',
  'Villa Arsası': 'Villa Arsası',
}

function badgeIcon(): ReactElement {
  // Tek check ikonu — tüm "ok" rozetler için (mockup paritesi).
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6.5l2.5 2.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VerificationPill({ badge }: { badge: VerificationBadge }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium',
        'text-emerald-700 dark:text-emerald-300',
      )}
      title={`${badge.label} · ${new Date(badge.verifiedAt).toLocaleDateString('tr-TR')}`}
    >
      {badgeIcon()}
      {badge.label}
    </span>
  )
}

function VerificationPillsLoading(): ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy="true" aria-label="Rozetler yükleniyor">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-6 w-28 animate-pulse rounded-full bg-foreground/5"
        />
      ))}
    </div>
  )
}

function PriceRange({ listingId }: { listingId: string }): ReactElement {
  const q = useAiValuation(listingId)
  if (q.isLoading || !q.data) {
    return (
      <span className="inline-block h-3 w-32 animate-pulse rounded bg-foreground/5" />
    )
  }
  const lo = formatTL(Math.round(q.data.range[0] / 100))
  const hi = formatTL(Math.round(q.data.range[1] / 100))
  const conf = Math.round(q.data.confidence * 100)
  return (
    <span className="text-[12px] text-muted-foreground">
      AI tahmin {lo} – {hi}{' '}
      <span className="text-muted-foreground/70">· güven %{conf}</span>
    </span>
  )
}

export function ListingDetailHero({ listing }: ListingDetailHeroProps): ReactElement {
  const badgesQ = useVerificationBadges(listing.id)
  const alertMut = useTriggerPriceAlert()
  const [isPending, startTransition] = useTransition()

  const pricePerM2 = listing.size > 0 ? Math.round(listing.price / listing.size) : 0
  const tipi = TIPI_LABEL[listing.type] ?? listing.type

  const onPriceAlert = (): void => {
    startTransition(() => {
      alertMut.mutate({ listingId: listing.id })
    })
  }

  const onShare = async (): Promise<void> => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return
    const url = window.location.href
    const nav = navigator as Navigator & {
      share?: (data: { title: string; text: string; url: string }) => Promise<void>
      clipboard?: { writeText: (s: string) => Promise<void> }
    }
    if (typeof nav.share === 'function') {
      try {
        await nav.share({
          title: listing.title,
          text: `${listing.title} — ${listing.district}, ${listing.city}`,
          url,
        })
      } catch {
        // Kullanıcı vazgeçti — sessiz geç.
      }
      return
    }
    if (nav.clipboard) {
      try {
        await nav.clipboard.writeText(url)
      } catch {
        /* yoksay */
      }
    }
  }

  const onCompare = (): void => {
    if (typeof window === 'undefined') return
    window.location.href = `/karsilastir?ekle=${listing.id}`
  }

  return (
    <header className="rounded-2xl bg-card p-4 ring-1 ring-border md:p-6">
      {/* Status pills — canlı dot + ilan no + görüntülenme + favori */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full',
            'bg-emerald-500/10 px-2.5 py-1 font-medium',
            'text-emerald-700 dark:text-emerald-300',
          )}
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Canlı ilan
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-muted-foreground">
          İlan no{' '}
          <span className="font-mono tabular-nums text-foreground">PRS-{listing.id}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-muted-foreground">
          <span aria-hidden>◎</span>
          <span className="tabular-nums">{listing.views.toLocaleString('tr-TR')}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-muted-foreground">
          <Heart className="h-3 w-3" aria-hidden="true" />
          <span className="tabular-nums">38</span>
        </span>
      </div>

      {/* Verifikasyon rozet sırası */}
      <div className="mb-4">
        {badgesQ.isLoading ? (
          <VerificationPillsLoading />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(badgesQ.data ?? []).slice(0, 8).map((b) => (
              <VerificationPill key={b.id} badge={b} />
            ))}
          </div>
        )}
      </div>

      {/* Title block — kicker + h1 + price col */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Satılık</span>
            <span className="h-1 w-1 rounded-full bg-foreground/30" aria-hidden />
            <span>{tipi}</span>
            <span className="h-1 w-1 rounded-full bg-foreground/30" aria-hidden />
            <span className="tabular-nums">
              {listing.size.toLocaleString('tr-TR')} m²
            </span>
          </div>
          <h1 className="text-balance text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {listing.title.split(' ').map((word, i, arr) => {
              // Mockup paritesi: tek bir vurgu kelimesi için font-serif italic.
              // Heuristik: cümlenin ortasındaki anlamlı kelime (city/district eşleşmesi varsa).
              const isHighlight =
                i === Math.floor(arr.length / 2) && word.length >= 4
              return isHighlight ? (
                <em
                  key={i}
                  className="font-serif font-light italic text-emerald-700 dark:text-emerald-300"
                >
                  {word}
                  {i < arr.length - 1 ? ' ' : ''}
                </em>
              ) : (
                <span key={i}>
                  {word}
                  {i < arr.length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {listing.district}, {listing.city}
            {listing.tags.length > 0 ? ` · ${listing.tags.slice(0, 3).join(' · ')}` : ''}
          </p>
        </div>

        <div className="md:text-right">
          <div className="text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
            {formatTL(listing.price)}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            <span className="tabular-nums">m² {formatTL(pricePerM2)}</span>
          </div>
          <div className="mt-1.5">
            <PriceRange listingId={listing.id} />
          </div>
        </div>
      </div>

      {/* Action chips — Paylaş · Karşılaştır · Fiyat alarmı */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={() => {
            void onShare()
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full',
            'bg-foreground/5 px-3 py-1.5 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          Paylaş
        </button>
        <button
          type="button"
          onClick={onCompare}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full',
            'bg-foreground/5 px-3 py-1.5 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
          Karşılaştır
        </button>
        <button
          type="button"
          onClick={onPriceAlert}
          disabled={isPending || alertMut.isPending}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full',
            'bg-foreground/5 px-3 py-1.5 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
            'disabled:opacity-50',
            alertMut.isSuccess &&
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          )}
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          {alertMut.isSuccess ? 'Alarm kuruldu' : 'Fiyat alarmı'}
        </button>
      </div>
    </header>
  )
}
