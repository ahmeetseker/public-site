import { estimateValue, type ValuationInput, type ValuationResult } from '@landx/ai';
import { cn } from '../lib/cn';

export interface ValuationBarProps {
  input?: ValuationInput;
  result?: ValuationResult;
  marketPrice?: number;
  className?: string;
}

function formatTRY(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ₺`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K ₺`;
  return `${n} ₺`;
}

export function ValuationBar({ input, result, marketPrice, className }: ValuationBarProps) {
  const v = result ?? (input ? estimateValue(input) : undefined);
  if (!v) return null;

  const lo = v.low;
  const hi = v.high;
  const range = hi - lo;
  const markerPct = marketPrice
    ? Math.max(0, Math.min(100, ((marketPrice - lo) / range) * 100))
    : null;

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">AI Değerleme</div>
        <div className="text-xs text-muted-foreground">
          Güven: <span className="font-medium text-foreground">{Math.round(v.confidence * 100)}%</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div className="w-1/2 bg-gradient-to-r from-amber-300/60 to-emerald-400/80 dark:from-amber-500/40 dark:to-emerald-500/60" />
          <div className="w-1/2 bg-gradient-to-r from-emerald-400/80 to-amber-300/60 dark:from-emerald-500/60 dark:to-amber-500/40" />
        </div>

        {markerPct !== null && (
          <div
            className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 bg-foreground"
            style={{ left: `${markerPct}%` }}
            title={`Piyasa fiyatı: ${formatTRY(marketPrice!)}`}
          />
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Alt</div>
          <div className="font-medium tabular-nums">{formatTRY(v.low)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Önerilen</div>
          <div className="font-semibold tabular-nums">{formatTRY(v.mid)}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">Üst</div>
          <div className="font-medium tabular-nums">{formatTRY(v.high)}</div>
        </div>
      </div>

      {v.factors.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Etkenler ({v.factors.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {v.factors.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{f.name}</span>
                <span className="text-muted-foreground">{f.note}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
