/**
 * AiValuationCard — F33 Faz 2 widget (W1).
 *
 * Mount: `/ilan/[slug]` sağ kolon (sticky desktop).
 * Hook: useAiValuation(listingId).
 *
 * Skeleton 800ms → estimate (büyük TL), range bar, confidence, top 5 factor.
 * "Neden bu fiyat?" expandable → tüm factor + comparable.
 */

import { useState } from 'react';
import { useAiValuation, type AiValuationFactor } from '@landx/data';
import { QueryProvider } from './QueryProvider';

function formatTL(kurus: number): string {
  const tl = kurus / 100;
  if (tl >= 1_000_000) return `${(tl / 1_000_000).toFixed(2)} M ₺`;
  if (tl >= 1_000) return `${(tl / 1_000).toFixed(0)}K ₺`;
  return `${tl.toLocaleString('tr-TR')} ₺`;
}

function formatTLFull(kurus: number): string {
  return `${Math.round(kurus / 100).toLocaleString('tr-TR')} ₺`;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 80
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : pct >= 60
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      Güven %{pct}
    </span>
  );
}

function FactorRow({ f }: { f: AiValuationFactor }) {
  const pct = Math.round(f.impact * 100);
  const positive = pct >= 0;
  const width = Math.min(Math.abs(pct), 100);
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium">{f.name}</div>
        <div className="line-clamp-1 text-xs text-muted-foreground">{f.description}</div>
      </div>
      <div className="flex w-28 items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
          <div
            className={`absolute top-0 h-1.5 ${positive ? 'left-1/2 bg-emerald-500' : 'right-1/2 bg-rose-500'}`}
            style={{ width: `${width / 2}%` }}
          />
        </div>
        <span
          className={`w-10 text-right font-mono text-xs tabular-nums ${
            positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}
        >
          {positive ? '+' : ''}
          {pct}%
        </span>
      </div>
    </li>
  );
}

function CardInner({ listingId }: { listingId: string }) {
  const q = useAiValuation(listingId);
  const [expanded, setExpanded] = useState(false);

  if (q.isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
        <div className="h-8 w-40 animate-pulse rounded bg-foreground/10" />
        <div className="h-2 w-full animate-pulse rounded bg-foreground/10" />
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-foreground/10" />
          ))}
        </div>
      </div>
    );
  }
  if (!q.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        AI değerleme henüz oluşturulmadı.
      </div>
    );
  }

  const v = q.data;
  const [lo, hi] = v.range;
  const factors = expanded ? v.factors : v.factors.slice(0, 5);

  // Estimate'in range içindeki konumu (0..1)
  const pos = hi > lo ? Math.min(1, Math.max(0, (v.estimate - lo) / (hi - lo))) : 0.5;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            AI Değerleme
          </div>
          <div className="mt-1 font-serif text-2xl tracking-tight">{formatTL(v.estimate)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{formatTLFull(v.estimate)}</div>
        </div>
        <ConfidenceBadge value={v.confidence} />
      </header>

      {/* Range bar */}
      <div>
        <div className="relative h-2 overflow-hidden rounded-full bg-foreground/5">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-foreground/10 via-foreground/30 to-foreground/10" />
          <div
            className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-foreground"
            style={{ left: `${pos * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{formatTL(lo)}</span>
          <span>{formatTL(hi)}</span>
        </div>
      </div>

      {/* Factor breakdown */}
      <div>
        <div className="mb-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {expanded ? `Tüm faktörler (${v.factors.length})` : 'Top faktörler'}
        </div>
        <ul className="divide-y divide-border">
          {factors.map((f, i) => (
            <FactorRow key={i} f={f} />
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-xs underline-offset-2 hover:underline text-muted-foreground"
      >
        {expanded ? '− az göster' : 'Neden bu fiyat? +'}
      </button>

      {/* Comparables */}
      {expanded && v.comparables.length > 0 && (
        <div>
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Karşılaştırılabilir ilanlar
          </div>
          <ul className="space-y-1">
            {v.comparables.map((c, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-foreground/5 px-2 py-1 text-xs"
              >
                <span className="font-mono">{c.listingId}</span>
                <span className="text-muted-foreground">
                  benzerlik %{Math.round(c.similarity * 100)}
                </span>
                <span className="font-medium">{formatTL(c.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AiValuationCard({ listingId }: { listingId: string }) {
  return (
    <QueryProvider>
      <CardInner listingId={listingId} />
    </QueryProvider>
  );
}
