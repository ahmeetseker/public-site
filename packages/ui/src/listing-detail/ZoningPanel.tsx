/**
 * ZoningPanel — F bölümü (mockup line 2025-2064).
 *
 * Layout:
 *   - Sol: imar tablosu (KAKS/TAKS/Maks kat/Çekme/Çatı eğimi/Kullanım/Plan notu)
 *   - Sağ: 3D izometrik mock (basit SVG prizma, mockup paritesi)
 *   - Alt: AI panel — LLM üretimi sade Türkçe açıklama (border-l accent)
 *
 * Hooks: useImarPlan(listingId)
 */

import { useImarPlan } from '@landx/data'
import { cn } from '../lib/cn'

export interface ZoningPanelProps {
  listingId: string
  className?: string
}

const NUM_FORMATTER = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })
const M2_FORMATTER = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

function fmtM2(n: number): string {
  return `${M2_FORMATTER.format(n)} m²`
}

export function ZoningPanel({ listingId, className }: ZoningPanelProps) {
  const { data: plan, isPending } = useImarPlan(listingId)

  if (isPending || !plan) {
    return (
      <section
        aria-busy="true"
        className={cn('flex flex-col gap-5', className)}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="r-container h-72 animate-pulse border border-border/50 bg-card/40 p-6" />
          <div className="r-container h-72 animate-pulse border border-border/50 bg-card/40 p-6" />
        </div>
        <div className="r-container h-20 animate-pulse border border-border/40 bg-card/30" />
      </section>
    )
  }

  // Tablo satırları (mockup paritesi)
  const rows: Array<{ key: string; val: string }> = [
    {
      key: 'KAKS (emsal)',
      val: `${NUM_FORMATTER.format(plan.kaks)} → ${fmtM2(plan.insaatHakki)}`,
    },
    {
      key: 'TAKS',
      val: `${NUM_FORMATTER.format(plan.taks)} → ${fmtM2(
        Math.round((plan.insaatHakki / plan.kaks) * plan.taks),
      )}`,
    },
    { key: 'Maksimum kat', val: String(plan.maxKat) },
    {
      key: 'Çekme mesafeleri',
      val: `${plan.cekme.on} / ${plan.cekme.yan} / ${plan.cekme.arka} m`,
    },
    { key: 'Çatı eğimi', val: `Maks %${plan.catiEgimiMaxPct}` },
    { key: 'Kullanım', val: plan.kullanim },
    { key: 'Plan notu', val: plan.planNotu },
  ]

  return (
    <section
      aria-label="İmar planı — yapılaşma koşulları"
      className={cn('flex flex-col gap-5', className)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* ─── Sol: İmar tablosu ──────────────────────────────────────── */}
        <article className="r-container border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <h5 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Yapılaşma koşulları · 1/1000 plan
          </h5>
          <dl className="mt-4 divide-y divide-border/40">
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[auto_1fr] gap-3 py-2 text-sm sm:grid-cols-[10rem_1fr]"
              >
                <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {r.key}
                </dt>
                <dd className="text-right tabular-nums text-foreground sm:text-left">
                  {r.val}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        {/* ─── Sağ: 3D izometrik mock ─────────────────────────────────── */}
        <article className="r-container flex flex-col items-center justify-center border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <svg
            viewBox="0 0 240 180"
            width="100%"
            className="max-w-[260px]"
            role="img"
            aria-label={`${plan.maxKat} kat izometrik mock`}
          >
            {/* Zemin */}
            <polygon
              points="20,140 220,140 195,170 45,170"
              fill="#C8BC9F"
              opacity="0.55"
            />
            {/* Ön yüz */}
            <polygon
              points="75,70 165,70 165,140 75,140"
              fill="#7E8478"
              opacity="0.92"
            />
            {/* Üst */}
            <polygon
              points="75,70 95,50 185,50 165,70"
              fill="#4D5751"
              opacity="0.95"
            />
            {/* Sağ yüz */}
            <polygon
              points="165,70 185,50 185,120 165,140"
              fill="#2C5246"
              opacity="0.95"
            />
            {/* Kat çizgileri (3 kat = 2 ara çizgi) */}
            {plan.maxKat >= 2 && (
              <>
                <line
                  x1="75"
                  y1="93"
                  x2="165"
                  y2="93"
                  stroke="#F4ECD9"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
                <line
                  x1="165"
                  y1="93"
                  x2="185"
                  y2="73"
                  stroke="#F4ECD9"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              </>
            )}
            {plan.maxKat >= 3 && (
              <>
                <line
                  x1="75"
                  y1="116"
                  x2="165"
                  y2="116"
                  stroke="#F4ECD9"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
                <line
                  x1="165"
                  y1="116"
                  x2="185"
                  y2="96"
                  stroke="#F4ECD9"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              </>
            )}
          </svg>
          <div className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="text-foreground">{plan.maxKat} kat</span> ·{' '}
            <span className="tabular-nums text-foreground">
              {fmtM2(plan.insaatHakki)}
            </span>{' '}
            inşaat hakkı
          </div>
        </article>
      </div>

      {/* ─── Alt: AI panel ─────────────────────────────────────────────── */}
      <aside className="r-container border-l-2 border-l-primary/60 border-y border-r border-border/40 bg-card/30 px-5 py-4 backdrop-blur-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span aria-hidden="true">◇</span> AI · imar planı notunu sade Türkçe
          açıkla
        </div>
        <blockquote className="mt-2 font-serif italic text-[15px] leading-relaxed text-foreground/90">
          “{plan.llmAciklama}”
        </blockquote>
      </aside>
    </section>
  )
}
