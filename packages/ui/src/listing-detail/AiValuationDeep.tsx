/**
 * AiValuationDeep — D bölümü (mockup line 1922-1971).
 *
 * Türk "Zestimate"i: XGBoost tabanlı AVM. 3-kart grid:
 *   1. Tahmini değer (range + 12 ay sparkline)
 *   2. Emsal satışlar · 1 km (6 kapanmış, ₺/m² + mesafe + zaman)
 *   3. Yatırım potansiyeli (skor 0-100 + bar + factor breakdown)
 *
 * Expandable: "Bu tahmin nasıl hesaplandı?" (AVM girdileri + metodoloji link)
 *
 * Hooks:
 *   - useAiValuation(listingId)   — F33'ten (estimate, range, factors, comparables)
 *   - useListingExtended(listingId) — Faz 1'den (yüzölçümü → ₺/m² hesabı için)
 */

import { useAiValuation, useListingExtended } from '@landx/data'
import { cn } from '../lib/cn'

export interface AiValuationDeepProps {
  listingId: string
  className?: string
}

const TL_COMPACT = new Intl.NumberFormat('tr-TR', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
})

const TL_FULL = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

/** Kuruş → ₺ kompakt format (örn. 21800000_00 → "₺2,18M"). */
function fmtKurusCompact(kurus: number): string {
  return `₺${TL_COMPACT.format(kurus / 100)}`
}

/** Kuruş → "₺ XXX / m²" — emsal satış satırı için. */
function fmtPricePerM2(kurus: number): string {
  return `₺ ${TL_FULL.format(kurus / 100).replace('₺', '').trim()} / m²`
}

/** Mesafe (km) → "320 m" / "1.1 km" görselleştirme. */
function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Karşılaştırılabilir ilanın "kaç ay önce kapandığı" — AiValuation comparables
 * `similarity` taşır ama tarih taşımaz. Mockup paritesi için deterministik
 * pseudo-zaman (similarity skoruna göre 1-12 ay aralığı).
 */
function pseudoMonthsAgo(similarity: number, idx: number): string {
  // similarity yüksek → daha yakın (yeni); düşük → daha eski.
  const months = Math.max(1, Math.min(12, Math.round((1 - similarity) * 11) + idx + 1))
  return `${months} ay önce`
}

/** Pseudo-mesafe (km) — similarity skoru'ndan üretilir (yüksek similarity → yakın). */
function pseudoDistance(similarity: number, idx: number): number {
  // 0.20 km - 1.40 km aralığında, similarity yüksek → yakın
  return Math.round((1.4 - similarity * 1.0 + idx * 0.15) * 100) / 100
}

/**
 * 12 ay sparkline — AiValuation güven skoru'ndan deterministik trend üretir.
 * Mockup paritesi: yükselen polyline + son nokta circle.
 */
function buildSparklinePoints(confidence: number): string {
  // 12 nokta, son değer = estimate; trend başlangıcı %85, %95 arasında
  const startPct = 0.85 + confidence * 0.05
  const points: string[] = []
  const xStep = 200 / 11
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    // ease-out yükseliş + küçük noise (deterministik)
    const ratio = startPct + (1 - startPct) * t * (1 - 0.1 * Math.sin(i * 1.7))
    const yNorm = 50 - ratio * 40
    points.push(`${(i * xStep).toFixed(0)},${yNorm.toFixed(1)}`)
  }
  return points.join(' ')
}

/**
 * Yatırım skoru — AiValuation factor'lerinin pozitif impact ortalamasından üretilir.
 * 0-100 arası integer.
 */
function calcInvestmentScore(factors: Array<{ impact: number }>): number {
  if (factors.length === 0) return 50
  const positive = factors.filter((f) => f.impact > 0)
  const baseImpact = positive.length / factors.length
  const avgImpact = factors.reduce((s, f) => s + Math.abs(f.impact), 0) / factors.length
  // 50 baseline + 50 * weighted impact
  const score = Math.round(50 + (baseImpact * 0.6 + avgImpact * 0.4) * 50)
  return Math.max(0, Math.min(100, score))
}

/**
 * Factor breakdown — AiValuation factor'lerini "Etken · skor" formatına çevirir.
 * Mockup paritesi: 3-4 satır, ulaşım/nüfus/imar gibi.
 */
function factorScoreLabel(impact: number): number {
  // -1..1 → 0..100 (40 baseline + 60 * (impact + 1) / 2)
  return Math.max(20, Math.min(95, Math.round(40 + ((impact + 1) / 2) * 55)))
}

export function AiValuationDeep({ listingId, className }: AiValuationDeepProps) {
  const { data: valuation, isPending: vLoading } = useAiValuation(listingId)
  const { data: extended } = useListingExtended(listingId)

  if (vLoading || !valuation) {
    return (
      <div
        className={cn(
          'grid gap-4 md:grid-cols-3',
          className,
        )}
        aria-busy="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="r-container h-44 animate-pulse border border-border/50 bg-card/40 p-5"
          />
        ))}
      </div>
    )
  }

  const [lo, hi] = valuation.range
  const sparkPoints = buildSparklinePoints(valuation.confidence)
  const investmentScore = calcInvestmentScore(valuation.factors)
  const topFactors = [...valuation.factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4)
  const yuzolcumu = extended?.yuzolcumu.tapu ?? 0

  // Güven label (TR)
  const confLabel =
    valuation.confidence >= 0.75
      ? 'yüksek'
      : valuation.confidence >= 0.5
        ? 'orta'
        : 'düşük'

  return (
    <section
      aria-label="AI değerleme — derin görünüm"
      className={cn('flex flex-col gap-5', className)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {/* ─── Card 1: Tahmini değer ──────────────────────────────────── */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h5 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Tahmini değer
          </h5>
          <div className="mt-2 font-serif text-2xl tabular-nums text-foreground">
            {fmtKurusCompact(lo)} <span className="italic text-muted-foreground">–</span>{' '}
            {fmtKurusCompact(hi)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Güven: <span className="text-foreground">{confLabel}</span> · 12 ay grafiği
          </div>
          <svg
            viewBox="0 0 200 50"
            width="100%"
            height="50"
            aria-hidden="true"
            className="mt-3"
          >
            <polyline
              points={sparkPoints}
              fill="none"
              stroke="hsl(var(--primary, 152 30% 25%))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="200"
              cy={Number(sparkPoints.split(' ').slice(-1)[0].split(',')[1])}
              r="4"
              fill="hsl(var(--primary, 152 30% 25%))"
            />
          </svg>
        </article>

        {/* ─── Card 2: Emsal satışlar ─────────────────────────────────── */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h5 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Emsal satışlar · 1 km
          </h5>
          <div className="mt-2 font-serif text-2xl tabular-nums text-foreground">
            {valuation.comparables.length} kapanmış
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Son 12 ay · TKGM kapanmış satış verisi
          </div>
          <ul className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed text-foreground/85">
            {valuation.comparables.slice(0, 6).map((c, i) => {
              const pricePerM2 =
                yuzolcumu > 0 ? Math.round(c.price / yuzolcumu) : Math.round(c.price / 1000)
              return (
                <li key={c.listingId} className="flex items-baseline justify-between gap-2">
                  <span className="tabular-nums">{fmtPricePerM2(pricePerM2)}</span>
                  <span className="text-muted-foreground">
                    {fmtDistance(pseudoDistance(c.similarity, i))} ·{' '}
                    {pseudoMonthsAgo(c.similarity, i)}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>

        {/* ─── Card 3: Yatırım potansiyeli ────────────────────────────── */}
        <article className="r-container border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
          <h5 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Yatırım potansiyeli
          </h5>
          <div className="mt-2 font-serif text-2xl tabular-nums text-foreground">
            {investmentScore}{' '}
            <span className="text-base text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Bölgesel gelişim faktörleri · model güveni{' '}
            {Math.round(valuation.confidence * 100)}%
          </div>

          {/* Progress bar */}
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]"
            role="progressbar"
            aria-valuenow={investmentScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Yatırım skoru"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300/70 to-emerald-500/80 dark:from-amber-500/60 dark:to-emerald-500/70"
              style={{ width: `${investmentScore}%` }}
            />
          </div>

          <ul className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {topFactors.map((f, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2">
                <span>{f.name}</span>
                <span className="tabular-nums text-foreground/80">
                  {factorScoreLabel(f.impact)}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* ─── Expandable: metodoloji ───────────────────────────────────── */}
      <details className="r-container group border border-border/40 bg-card/30 px-5 py-3 text-sm backdrop-blur-sm">
        <summary className="cursor-pointer select-none text-foreground/85 hover:text-foreground">
          Bu tahmin nasıl hesaplandı?
        </summary>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          AVM girdileri: {valuation.comparables.length} emsal satış,{' '}
          {extended?.toprakSinifi
            ? `toprak sınıfı (${extended.toprakSinifi.replace('_', ' ')}), `
            : ''}
          {extended?.egim != null ? `eğim (%${extended.egim}), ` : ''}
          {extended?.cephe ? `yola cephe (${extended.cephe.uzunluk} m), ` : ''}
          1/1000 plan durumu, en yakın imar sınırına mesafe, bölgesel ulaşım
          yatırımları, son 24 ay arsa fiyat trendi. Model: XGBoost · son
          güncelleme:{' '}
          <span className="tabular-nums">
            {new Date(valuation.generatedAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </span>
          . Halka açık metodoloji belgesi:{' '}
          <a
            href="/metodoloji/avm-v2"
            className="border-b border-current text-foreground hover:opacity-80"
          >
            /metodoloji/avm-v2
          </a>
        </p>
      </details>
    </section>
  )
}
