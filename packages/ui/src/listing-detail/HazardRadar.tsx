/**
 * HazardRadar — `/ilan/[slug]` H bölümü (Wave F37 / Faz 2 / F37.2).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 2123-2175 ("Doğal afet & risk
 * skoru"). 6-axis SVG radar chart (Deprem, Fay, Yangın, Kuraklık, Sel,
 * Heyelan) + 7 risk satırı (Deprem PGA, Diri fay, Zemin, Sel, Heyelan,
 * Yangın, Kuraklık). Veri kaynağı: `useHazardScores(listingId)`.
 *
 * Liquid Glass tema portu. Skorlar 3-tier badge (low/mid/high =
 * emerald/amber/rose). Mockup'taki kırmızı transparan radar polygon korunur
 * (semantic risk rengi — tema-bağımsız).
 */
import { useHazardScores } from '@landx/data'
import type { ZeminSinifi } from '@landx/data'
import { cn } from '../lib/cn'

export interface HazardRadarProps {
  listingId: string
  className?: string
}

// ─── Risk skoru → renk tier ──────────────────────────────────────────────────

type Tier = 'low' | 'mid' | 'high'

function scoreTier(n: number): Tier {
  if (n >= 60) return 'high'
  if (n >= 35) return 'mid'
  return 'low'
}

const TIER_BADGE: Record<Tier, string> = {
  low: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
  mid: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
  high: 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300',
}

const TIER_LABEL: Record<Tier, string> = {
  low: 'düşük',
  mid: 'orta',
  high: 'yüksek',
}

// Zemin sınıfı tier (ZA en sağlam, ZE en zayıf)
function zeminTier(z: ZeminSinifi): Tier {
  if (z === 'ZA' || z === 'ZB') return 'low'
  if (z === 'ZC') return 'mid'
  return 'high'
}

const ZEMIN_DETAIL: Record<ZeminSinifi, string> = {
  ZA: 'çok sağlam kaya',
  ZB: 'sağlam',
  ZC: 'orta sıkı',
  ZD: 'gevşek',
  ZE: 'çok gevşek',
}

// ─── Radar chart geometry ────────────────────────────────────────────────────

/** 6 axis sırası — mockup'ta saat 12'den saat yönünde:
 * Deprem (top) → Fay (top-right) → Yangın (bottom-right) →
 * Kuraklık (bottom) → Sel (bottom-left) → Heyelan (top-left).
 */
const AXIS_LABELS = ['Deprem', 'Fay', 'Yangın', 'Kuraklık', 'Sel', 'Heyelan'] as const
type AxisIndex = 0 | 1 | 2 | 3 | 4 | 5

// SVG: 260×260, center 130,130, max radius 100
const CX = 130
const CY = 130
const R_MAX = 100

function axisPoint(idx: AxisIndex, value: number): { x: number; y: number } {
  // Saat 12'den başla, saat yönünde 60° aralıklarla
  const angle = -Math.PI / 2 + (idx * Math.PI) / 3
  const r = (Math.max(0, Math.min(100, value)) / 100) * R_MAX
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  }
}

function ringPolygon(scale: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const p = axisPoint(i as AxisIndex, scale * 100)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
}

// Axis label dış konumu (radius 116 — chart sınırının biraz dışında)
function labelPos(idx: AxisIndex): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const angle = -Math.PI / 2 + (idx * Math.PI) / 3
  const r = 118
  const x = CX + r * Math.cos(angle)
  const y = CY + r * Math.sin(angle) + 4 // küçük baseline kayma
  let anchor: 'start' | 'middle' | 'end' = 'middle'
  if (Math.cos(angle) > 0.3) anchor = 'start'
  else if (Math.cos(angle) < -0.3) anchor = 'end'
  return { x, y, anchor }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HazardRadar({ listingId, className }: HazardRadarProps) {
  const { data, isLoading } = useHazardScores(listingId)

  const s = data?.scores

  // 6 axis skorları (sıra: Deprem, Fay, Yangın, Kuraklık, Sel, Heyelan)
  // Fay ekseni: yakınsa risk yüksek → 50 km'de 0, 0 km'de 100
  const fayScore = s
    ? Math.max(0, Math.min(100, Math.round(100 - (s.fayMesafeKm / 50) * 100)))
    : 0
  const axisScores: number[] = s
    ? [
        s.deprem.skor,
        fayScore,
        s.yanginSkor,
        s.kuraklikSkor,
        s.selSkor,
        s.heyelanSkor,
      ]
    : [0, 0, 0, 0, 0, 0]

  const polyPoints = axisScores
    .map((v, i) => {
      const p = axisPoint(i as AxisIndex, v)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' ')

  return (
    <section
      className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}
      aria-labelledby="hazard-radar-heading"
    >
      <header className="border-b border-border/60 px-5 py-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          H — bölüm · risk
        </p>
        <h2 id="hazard-radar-heading" className="font-serif text-2xl leading-tight">
          Doğal afet & <em className="font-serif italic">risk skoru</em>
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          AFAD PGA, MTA diri fay mesafesi, DSİ taşkın, Orman GM yangın, MGM
          kuraklık. 0-100 ölçeğinde kompozit skor.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sol: SVG Radar */}
        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 260 260"
            className="h-full w-full max-w-[260px]"
            role="img"
            aria-label="6 eksen risk radar grafiği"
          >
            {/* Hexagon grid (3 ring) */}
            <g
              fill="none"
              className="stroke-foreground/30"
              strokeWidth="0.6"
            >
              <polygon points={ringPolygon(1)} />
              <polygon points={ringPolygon(0.66)} />
              <polygon points={ringPolygon(0.33)} />
            </g>
            {/* 3 axis çizgileri (saat 12, saat 4, saat 8 — 6 axis = 3 line) */}
            <g className="stroke-foreground/25" strokeWidth="0.5">
              <line
                x1={axisPoint(0, 100).x}
                y1={axisPoint(0, 100).y}
                x2={axisPoint(3, 100).x}
                y2={axisPoint(3, 100).y}
              />
              <line
                x1={axisPoint(1, 100).x}
                y1={axisPoint(1, 100).y}
                x2={axisPoint(4, 100).x}
                y2={axisPoint(4, 100).y}
              />
              <line
                x1={axisPoint(2, 100).x}
                y1={axisPoint(2, 100).y}
                x2={axisPoint(5, 100).x}
                y2={axisPoint(5, 100).y}
              />
            </g>

            {/* Score polygon — kırmızı dolgu (semantic risk rengi) */}
            <polygon
              points={polyPoints}
              className="fill-rose-500/20 stroke-rose-500"
              strokeWidth="2"
            />
            {/* Vertex circles */}
            {axisScores.map((v, i) => {
              const p = axisPoint(i as AxisIndex, v)
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className="fill-rose-500"
                />
              )
            })}

            {/* Axis labels */}
            <g
              fontSize="10"
              fontFamily="ui-sans-serif, system-ui"
              className="fill-muted-foreground"
            >
              {AXIS_LABELS.map((lbl, i) => {
                const pos = labelPos(i as AxisIndex)
                return (
                  <text
                    key={lbl}
                    x={pos.x}
                    y={pos.y}
                    textAnchor={pos.anchor}
                  >
                    {lbl}
                  </text>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Sağ: 7 risk satırı */}
        <div className="space-y-2">
          {isLoading || !s ? (
            <RiskSkeletonRows />
          ) : (
            <>
              <RiskRow
                name="Deprem (PGA)"
                tier={scoreTier(s.deprem.skor)}
                badge={String(s.deprem.skor)}
                detail={`${s.deprem.pga.toFixed(2)}g · ${s.deprem.donemYil} yıl`}
              />
              <RiskRow
                name="Diri fay mesafesi"
                tier={fayScore >= 60 ? 'high' : fayScore >= 35 ? 'mid' : 'low'}
                badge="—"
                detail={`${s.fayMesafeKm.toFixed(1)} km · ${s.fayBolge}`}
              />
              <RiskRow
                name="Zemin sınıfı"
                tier={zeminTier(s.zeminSinifi)}
                badge={s.zeminSinifi}
                detail={ZEMIN_DETAIL[s.zeminSinifi]}
              />
              <RiskRow
                name="Sel / taşkın"
                tier={scoreTier(s.selSkor)}
                badge={String(s.selSkor)}
                detail={TIER_LABEL[scoreTier(s.selSkor)]}
              />
              <RiskRow
                name="Heyelan"
                tier={scoreTier(s.heyelanSkor)}
                badge={String(s.heyelanSkor)}
                detail={TIER_LABEL[scoreTier(s.heyelanSkor)]}
              />
              <RiskRow
                name="Orman yangını"
                tier={scoreTier(s.yanginSkor)}
                badge={String(s.yanginSkor)}
                detail={TIER_LABEL[scoreTier(s.yanginSkor)]}
              />
              <RiskRow
                name="Kuraklık eğilimi"
                tier={scoreTier(s.kuraklikSkor)}
                badge={String(s.kuraklikSkor)}
                detail={TIER_LABEL[scoreTier(s.kuraklikSkor)]}
              />
            </>
          )}
        </div>
      </div>

      <footer className="border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
        Veri:{' '}
        {(data?.kaynaklar ?? ['AFAD', 'MTA', 'DSİ', 'MGM', 'Orman GM']).join(' · ')}
      </footer>
    </section>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface RiskRowProps {
  name: string
  tier: Tier
  badge: string
  detail: string
}

function RiskRow({ name, tier, badge, detail }: RiskRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2">
      <span className="flex-1 text-sm text-foreground">{name}</span>
      <span
        className={cn(
          'inline-flex min-w-[40px] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset tabular-nums',
          TIER_BADGE[tier],
        )}
      >
        {badge}
      </span>
      <span className="w-24 text-right text-xs text-muted-foreground sm:w-32">
        {detail}
      </span>
    </div>
  )
}

function RiskSkeletonRows() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2"
        >
          <div className="h-3 w-32 animate-pulse rounded bg-foreground/[0.08]" />
          <div className="h-5 w-10 animate-pulse rounded-full bg-foreground/[0.08]" />
          <div className="h-3 w-20 animate-pulse rounded bg-foreground/[0.08]" />
        </div>
      ))}
    </div>
  )
}
