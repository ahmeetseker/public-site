/**
 * FavoritesList — /hesabim/favori React island (client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Reads `arsam.favorites.v1` from localStorage and renders a grid of cards
 * for each favorited listing. Listing data is passed in as a serializable
 * dictionary from the Astro page (`listings` prop) so we don't bundle the
 * whole LISTINGS array into the client chunk.
 *
 * - "Favorilerden çıkar" removes the id (live update via storage event)
 * - Empty state CTA → /ara
 * - "Hepsini paylaş" copies a /ara?ids=... link to the clipboard
 *
 * Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (tokens only).
 */
import { useEffect, useState } from 'react'
import { SkeletonCard } from '@landx/ui/feedback'
import {
  EVENT_FAVORITES_CHANGED,
  getFavorites,
  removeFavorite,
} from '../../lib/account-store'

export interface FavoriteListingShape {
  id: string
  title: string
  city: string
  district: string
  type: string
  size: number
  price: number
}

interface Props {
  /** Map of listing id → minimal listing shape. Populated by SSR Astro page. */
  listings: Record<string, FavoriteListingShape>
}

function formatTLCompact(amount: number): string {
  const f = new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount)
  return `₺ ${f}`
}

function formatArea(m2: number): string {
  if (m2 >= 10000) {
    return `${(m2 / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} bin m²`
  }
  return `${m2.toLocaleString('tr-TR')} m²`
}

function slugify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function FavoritesList({ listings }: Props) {
  const [ids, setIds] = useState<string[]>([])
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const sync = () => setIds(getFavorites())
    sync()
    setMounted(true)
    window.addEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const resolved = ids
    .map((id) => listings[id])
    .filter((l): l is FavoriteListingShape => Boolean(l))

  async function copyShareLink() {
    if (typeof window === 'undefined' || ids.length === 0) return
    const url = `${window.location.origin}/ara?fav=${ids.join(',')}`
    try {
      await window.navigator.clipboard.writeText(url)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch {
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 2000)
    }
  }

  // SSR / first render — render skeleton cards so the layout doesn't shift
  // and the placeholder matches the eventual grid shape.
  if (!mounted) {
    return (
      <div
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        data-favorites-loading=""
        data-testid="favorites-skeleton"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Favoriler yükleniyor"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (resolved.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        data-favorites-empty=""
      >
        <span className="font-serif text-4xl font-normal text-muted-foreground" aria-hidden="true">
          ♡
        </span>
        <h2 className="font-serif text-xl tracking-tight">Henüz favori arsa yok.</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          /ara'dan arsalara göz at, beğendiklerini favorilere ekle; fiyat
          değişimi olduğunda haber alırsın.
        </p>
        <a
          href="/ara"
          className="mt-2 inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Arsa ara →
        </a>
      </div>
    )
  }

  return (
    <div data-favorites-list="" data-count={resolved.length}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {resolved.length} favori
        </p>
        <button
          type="button"
          onClick={copyShareLink}
          data-favorites-share=""
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-foreground/5"
        >
          {shareStatus === 'copied'
            ? 'Kopyalandı ✓'
            : shareStatus === 'error'
            ? 'Kopyalanamadı'
            : 'Hepsini paylaş'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {resolved.map((listing) => {
          const href = `/ilan/${slugify(listing.title)}-${listing.id}`
          return (
            <article
              key={listing.id}
              data-favorite-card={listing.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/20 hover:shadow-sm"
            >
              <a href={href} className="flex flex-col" aria-label={`${listing.title} ilanını aç`}>
                <div className="relative flex h-40 w-full items-center justify-center bg-foreground/5">
                  <span className="font-serif text-3xl font-normal tracking-tight text-foreground/30">
                    {listing.district.split('·').pop()?.trim() ?? listing.district}
                  </span>
                  <div className="absolute right-3 top-3 rounded-full bg-background/85 px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground backdrop-blur">
                    {listing.id}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 pb-3">
                  <h3 className="line-clamp-2 font-serif text-base leading-snug tracking-tight">
                    {listing.title}
                  </h3>
                  <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {listing.city} · {listing.district}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div className="font-serif text-lg font-medium tracking-tight">
                      {formatTLCompact(listing.price)}
                    </div>
                    <div className="font-mono text-xs tabular-nums text-muted-foreground">
                      {formatArea(listing.size)}
                    </div>
                  </div>
                </div>
              </a>
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden="true">♥</span>
                  <span>Favoride</span>
                </span>
                <button
                  type="button"
                  data-favorite-remove={listing.id}
                  onClick={() => removeFavorite(listing.id)}
                  className="rounded-full px-2 py-1 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                  aria-label={`${listing.title} ilanını favorilerden çıkar`}
                >
                  Favorilerden çıkar
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
