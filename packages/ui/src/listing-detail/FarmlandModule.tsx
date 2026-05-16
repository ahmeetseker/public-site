/**
 * FarmlandModule — G bölümü (mockup line 2067-2120).
 *
 * AcreValue Türkiye uyarlaması. SADECE tarım vasıflı listing'lerde render
 * edilir (vasfi ∈ {tarla, bag, bahce, zeytinlik}).
 *
 * Layout:
 *   - 4 stat kartı (2x2 mobil, 4x1 desktop):
 *       Toprak sınıfı + verim · Sulama · İklim 30y · Bağ evi izni
 *   - Ekim geçmişi: Sentinel-2 son 5 yıl bar (renkli chip per yıl)
 *   - Yatırım hesaplayıcı: ürün × yıllık net gelir aralığı
 *
 * Hooks: useFarmlandData(listingId), useListingExtended(listingId)
 */

import { useFarmlandData, useListingExtended } from '@landx/data'
import type {
  FarmlandToprak,
  ListingVasfi,
  SulamaTipi,
} from '@landx/data'
import { cn } from '../lib/cn'

export interface FarmlandModuleProps {
  listingId: string
  className?: string
}

const TARIM_VASFI: ReadonlyArray<ListingVasfi> = ['tarla', 'bag', 'bahce', 'zeytinlik']

const TOPRAK_LABEL: Record<FarmlandToprak, string> = {
  marjinal_kuru: 'Marjinal kuru',
  verimli: 'Verimli',
  cok_verimli: 'Çok verimli',
}

const SULAMA_LABEL: Record<SulamaTipi, string> = {
  dsi: 'DSİ sulama',
  kuyu: 'Kuyu sulama',
  dsi_disi: 'DSİ dışı',
}

/** Ürün adı → renk class (Tailwind). Mockup: buğday altın, nadas gri, vb. */
function cropColorClasses(urun: string): string {
  const u = urun.toLocaleLowerCase('tr-TR')
  if (u.includes('buğday')) return 'bg-amber-200/70 text-amber-950 dark:bg-amber-500/30 dark:text-amber-100'
  if (u.includes('arpa')) return 'bg-yellow-200/70 text-yellow-950 dark:bg-yellow-500/30 dark:text-yellow-100'
  if (u.includes('ayçiçeği') || u.includes('aycicek')) return 'bg-orange-200/70 text-orange-950 dark:bg-orange-500/30 dark:text-orange-100'
  if (u.includes('nadas')) return 'bg-stone-200/70 text-stone-700 dark:bg-stone-500/30 dark:text-stone-200'
  if (u.includes('mısır') || u.includes('misir')) return 'bg-lime-200/70 text-lime-950 dark:bg-lime-500/30 dark:text-lime-100'
  if (u.includes('yonca') || u.includes('üçgül')) return 'bg-emerald-200/70 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-100'
  return 'bg-muted text-foreground/80'
}

/** Kuruş aralığı → "₺18-24K" formatı (mockup paritesi). */
function fmtIncomeRange(minKurus: number, maxKurus: number): string {
  const minK = Math.round(minKurus / 100 / 1000)
  const maxK = Math.round(maxKurus / 100 / 1000)
  return `₺${minK}-${maxK}K`
}

/** Mesafe (m) → "480 m" / "1.2 km". */
function fmtDistanceM(m: number): string {
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function FarmlandModule({ listingId, className }: FarmlandModuleProps) {
  const { data: extended } = useListingExtended(listingId)
  const { data: farmland, isPending } = useFarmlandData(listingId)

  // Conditional render — sadece tarım vasıflı listing'ler
  if (!extended || !TARIM_VASFI.includes(extended.vasfi)) return null

  if (isPending || !farmland) {
    return (
      <section
        aria-busy="true"
        className={cn('flex flex-col gap-5', className)}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="r-container h-32 animate-pulse border border-border/50 bg-card/40 p-5"
            />
          ))}
        </div>
        <div className="r-container h-28 animate-pulse border border-border/40 bg-card/30" />
        <div className="r-container h-24 animate-pulse border border-border/40 bg-card/30" />
      </section>
    )
  }

  return (
    <section
      aria-label="Tarla modülü — toprak, sulama, iklim, ekim geçmişi"
      className={cn('flex flex-col gap-5', className)}
    >
      {/* ─── 4 stat kartı ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Toprak sınıfı */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h6 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Toprak sınıfı
          </h6>
          <div className="mt-2 font-serif text-lg text-foreground">
            {TOPRAK_LABEL[farmland.toprakSinifi]}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            TRGM ·{' '}
            <span className="tabular-nums text-foreground/80">
              verim {farmland.verimSkoru}/100
            </span>
          </div>
        </article>

        {/* Sulama */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h6 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Sulama
          </h6>
          <div className="mt-2 font-serif text-lg text-foreground">
            {SULAMA_LABEL[farmland.sulama]}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            {farmland.kuyuMesafe != null && (
              <span className="tabular-nums">
                Kuyu {fmtDistanceM(farmland.kuyuMesafe)}
              </span>
            )}
            {farmland.kuyuMesafe != null && farmland.dereMesafe != null && ' · '}
            {farmland.dereMesafe != null && (
              <span className="tabular-nums">
                dere {fmtDistanceM(farmland.dereMesafe)}
              </span>
            )}
          </div>
        </article>

        {/* İklim 30 yıl */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h6 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            İklim · 30 yıl
          </h6>
          <div className="mt-2 font-serif text-lg tabular-nums text-foreground">
            {farmland.iklim.yagis} mm yağış
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            <span className="tabular-nums">{farmland.iklim.donGun} don gün</span>{' '}
            ·{' '}
            <span className="tabular-nums">
              GDD {farmland.iklim.gdd.toLocaleString('tr-TR')}
            </span>
          </div>
        </article>

        {/* Bağ evi izni — yeşil accent (mümkünse) */}
        <article
          className={cn(
            'r-container border p-5 backdrop-blur-sm',
            farmland.bagEviIzin
              ? 'border-emerald-500/40 bg-emerald-50/60 dark:border-emerald-400/30 dark:bg-emerald-500/10'
              : 'border-border/60 bg-card/60',
          )}
        >
          <h6 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Bağ evi izni
          </h6>
          <div className="mt-2 font-serif text-lg text-foreground">
            {farmland.bagEviIzin ? (
              <>
                <span aria-hidden="true">✓</span> Mümkün
                {farmland.bagEviIzinPct != null && (
                  <span className="text-muted-foreground">
                    {' '}
                    · %{farmland.bagEviIzinPct} izinle
                  </span>
                )}
              </>
            ) : (
              <>
                <span aria-hidden="true">✗</span> Yok
              </>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            {TOPRAK_LABEL[farmland.toprakSinifi].toLocaleLowerCase('tr-TR')} tarım
            sınıfı
          </div>
        </article>
      </div>

      {/* ─── Ekim geçmişi: Sentinel-2 son 5 yıl ───────────────────────── */}
      <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          EKİM GEÇMİŞİ · Sentinel-2 · son {farmland.ekimGecmisi.length} yıl
        </div>
        <div
          className={cn(
            'mt-3 grid gap-2',
            farmland.ekimGecmisi.length === 5
              ? 'grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-5',
          )}
        >
          {farmland.ekimGecmisi.map((e) => (
            <div
              key={e.yil}
              className={cn(
                'r-control flex flex-col items-center justify-center px-2 py-3 text-center',
                cropColorClasses(e.urun),
              )}
            >
              <div className="font-mono text-[10px] tabular-nums opacity-75">
                {e.yil}
              </div>
              <div className="mt-0.5 text-xs font-medium">{e.urun}</div>
            </div>
          ))}
        </div>
      </article>

      {/* ─── Yatırım hesaplayıcı ───────────────────────────────────────── */}
      <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
        <h6 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Yatırım hesaplayıcı · tahmini yıllık net gelir
        </h6>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm">
          {farmland.yatirimHesap.map((y) => (
            <li
              key={y.urun}
              className="flex items-baseline gap-1.5 text-muted-foreground"
            >
              <span>{y.urun}</span>
              <b className="font-semibold tabular-nums text-foreground">
                {fmtIncomeRange(y.minGelir, y.maxGelir)}
              </b>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
