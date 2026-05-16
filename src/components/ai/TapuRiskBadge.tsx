/**
 * TapuRiskBadge — F33 Faz 2 widget (W4).
 *
 * Mount: `/ilan/[slug]` header'a yakın yerleşim.
 * Hook: useTapuRisk(listingId).
 *
 * Compact badge — risk seviyesine göre renk:
 *   yeşil "Tapu Temiz" / sarı "Şerh Var" / kırmızı "İpotek/Haciz"
 * Tıklanınca / hover ile popover detay listesi.
 */

import { useState } from 'react';
import { useTapuRisk, type TapuExtract, type TapuRisk } from '@landx/data';
import { QueryProvider } from './QueryProvider';

const SEVERITY_RANK: Record<TapuRisk['type'], number> = {
  ipotek: 3,
  haciz: 3,
  serh: 2,
  temiz: 1,
};

function topSeverity(risks: TapuRisk[]): { label: string; tone: string; type: TapuRisk['type'] } {
  if (!risks.length) {
    return {
      label: 'Tapu Bilinmiyor',
      tone: 'bg-foreground/5 text-muted-foreground border-border',
      type: 'temiz',
    };
  }
  const sorted = [...risks].sort((a, b) => SEVERITY_RANK[b.type] - SEVERITY_RANK[a.type]);
  const worst = sorted[0];
  switch (worst.type) {
    case 'ipotek':
      return {
        label: 'İpotek var',
        tone:
          'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        type: 'ipotek',
      };
    case 'haciz':
      return {
        label: 'Haciz var',
        tone:
          'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        type: 'haciz',
      };
    case 'serh':
      return {
        label: 'Şerh var',
        tone:
          'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        type: 'serh',
      };
    default:
      return {
        label: 'Tapu Temiz',
        tone:
          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        type: 'temiz',
      };
  }
}

function BadgeInner({ listingId }: { listingId: string }) {
  const q = useTapuRisk(listingId);
  const [open, setOpen] = useState(false);

  if (q.isLoading) {
    return (
      <span className="inline-flex h-6 w-28 animate-pulse rounded-full bg-foreground/10" />
    );
  }

  const data: TapuExtract | null = q.data ?? null;
  const risks = data?.risks ?? [];
  const severity = topSeverity(risks);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${severity.tone}`}
        data-tapu-risk={severity.type}
      >
        <span aria-hidden>●</span>
        <span>{severity.label}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-border bg-card p-3 text-xs shadow-lg">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Tapu kayıtları
          </div>
          {data ? (
            <>
              {risks.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {risks.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        aria-hidden
                        className={
                          r.type === 'temiz'
                            ? 'text-emerald-500'
                            : r.type === 'serh'
                              ? 'text-amber-500'
                              : 'text-rose-500'
                        }
                      >
                        ●
                      </span>
                      <span className="leading-snug">{r.note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  Tapuda kayıtlı takyidat yok — tüm satırlar temiz.
                </p>
              )}
              <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                OCR güveni %{Math.round(data.ocrConfidence * 100)} ·{' '}
                {new Date(data.uploadedAt).toLocaleDateString('tr-TR')}
              </div>
            </>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Bu ilan için tapu kontrolü yapılmamış.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TapuRiskBadge({ listingId }: { listingId: string }) {
  return (
    <QueryProvider>
      <BadgeInner listingId={listingId} />
    </QueryProvider>
  );
}
