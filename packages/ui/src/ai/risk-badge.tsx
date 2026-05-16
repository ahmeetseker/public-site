import { useState } from 'react';
import { scoreRisk, type RiskInput, type RiskResult } from '@landx/ai';
import { cn } from '../lib/cn';

export interface RiskBadgeProps {
  input?: RiskInput;
  result?: RiskResult;
  size?: 'sm' | 'md' | 'lg';
  showReasons?: boolean;
  className?: string;
}

const TONE = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
} as const;

const LABEL = { low: 'Düşük risk', medium: 'Orta risk', high: 'Yüksek risk' } as const;

const SIZE = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
} as const;

export function RiskBadge({ input, result, size = 'md', showReasons = false, className }: RiskBadgeProps) {
  const [open, setOpen] = useState(false);
  const r = result ?? (input ? scoreRisk(input) : undefined);
  if (!r) return null;

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => showReasons && setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
          TONE[r.level],
          SIZE[size],
          showReasons && 'cursor-pointer hover:opacity-80',
        )}
        aria-expanded={showReasons ? open : undefined}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
        <span>{LABEL[r.level]}</span>
        <span className="opacity-60">·</span>
        <span className="tabular-nums">{r.score}</span>
      </button>

      {showReasons && open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
          <div className="mb-2 font-medium">Risk gerekçeleri</div>
          <ul className="space-y-1.5">
            {r.reasons.map((reason, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="mt-0.5 text-muted-foreground">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
