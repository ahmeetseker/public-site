/**
 * MarketReportCard — F33 Faz 2 widget (W3).
 *
 * Mount: `/bolge/[slug]` yan island.
 * Hook: useMarketReport(regionSlug).
 *
 * Görsel:
 *   - 30 günlük trend mini chart (inline SVG — recharts'sız, hafif)
 *   - Demand heat 0-100 progress bar
 *   - AI özet (3-5 cümle)
 *   - TopRisks + TopOpportunities iki sütun
 */

import { useMemo } from 'react';
import { useMarketReport, type MarketTrendPoint } from '@landx/data';
import { QueryProvider } from './QueryProvider';

function TrendChart({ points }: { points: MarketTrendPoint[] }) {
  const W = 320;
  const H = 80;
  const PAD = 4;

  const data = useMemo(() => {
    if (points.length === 0) return null;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    const stepX = (W - PAD * 2) / Math.max(1, points.length - 1);
    const path = points
      .map((p, i) => {
        const x = PAD + stepX * i;
        const y = PAD + (H - PAD * 2) * (1 - (p.price - min) / span);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    const fill =
      `${path} L${(PAD + stepX * (points.length - 1)).toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`;

    const start = prices[0];
    const end = prices[prices.length - 1];
    const change = ((end - start) / start) * 100;
    return { path, fill, change, min, max };
  }, [points]);

  if (!data) return null;

  const positive = data.change >= 0;
  const stroke = positive ? '#10b981' : '#ef4444';
  const fillCol = positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-20 w-full"
        role="img"
        aria-label="30 günlük fiyat trendi"
      >
        <path d={data.fill} fill={fillCol} />
        <path d={data.path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">son 30 gün</span>
        <span
          className={`font-mono tabular-nums font-semibold ${positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
        >
          {positive ? '+' : ''}
          {data.change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function DemandBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone =
    pct >= 70
      ? 'bg-rose-500'
      : pct >= 40
        ? 'bg-amber-500'
        : 'bg-emerald-500';
  const label = pct >= 70 ? 'Yüksek' : pct >= 40 ? 'Orta' : 'Düşük';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Talep ısısı</span>
        <span className="font-mono tabular-nums font-medium">
          {pct} · {label}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/5">
        <div className={`h-2 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CardInner({ regionSlug }: { regionSlug: string }) {
  const q = useMarketReport(regionSlug);

  if (q.isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="h-3 w-32 animate-pulse rounded bg-foreground/10" />
        <div className="h-20 w-full animate-pulse rounded bg-foreground/10" />
        <div className="h-2 w-full animate-pulse rounded bg-foreground/10" />
        <div className="space-y-1.5">
          <div className="h-3 animate-pulse rounded bg-foreground/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
    );
  }
  if (!q.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Bu bölge için AI raporu henüz hazırlanmadı.
      </div>
    );
  }

  const r = q.data;
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          AI Pazar Raporu
        </div>
        <h3 className="mt-1 font-serif text-lg tracking-tight">
          Bölge <em className="font-normal italic">analizi</em>
        </h3>
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(r.generatedAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · 30 günlük seri
        </div>
      </header>

      <TrendChart points={r.trend} />
      <DemandBar value={r.demandHeat} />

      <div>
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          AI özet
        </div>
        <p className="mt-1 text-sm leading-relaxed">{r.aiSummary}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
            Riskler
          </div>
          <ul className="mt-1 space-y-1 text-xs">
            {r.topRisks.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-rose-500">▾</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            Fırsatlar
          </div>
          <ul className="mt-1 space-y-1 text-xs">
            {r.topOpportunities.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-500">▴</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MarketReportCard({ regionSlug }: { regionSlug: string }) {
  return (
    <QueryProvider>
      <CardInner regionSlug={regionSlug} />
    </QueryProvider>
  );
}
