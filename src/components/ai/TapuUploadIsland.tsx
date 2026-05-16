/**
 * TapuUploadIsland — F33 Faz 2 / `/ilan-ver/tapu-yukle`.
 *
 * Mock OCR akışı:
 *   1. File picker (gerçek upload yok)
 *   2. useUploadTapu mutation → 1.5sn sonra extract döner
 *   3. Sonuç: ada/parsel/m²/cins/imar table + risk badge'ler
 *   4. "Devam et" CTA
 *
 * Dosya adından deterministik olarak ada/parsel/alan üretilir.
 */

import { useState } from 'react';
import { useUploadTapu, type TapuExtract, type TapuRisk } from '@landx/data';
import { QueryProvider } from './QueryProvider';

const DEMO_LISTING_ID = '28.AY.0142';

function hashSeed(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003;
  return Math.abs(h);
}

function extractHints(fileName: string): {
  ada: string;
  parsel: string;
  alan: number;
  cins: string;
  imarDurumu: string;
} {
  const seed = hashSeed(fileName);
  const cinsList = ['arsa', 'tarla', 'bahçe', 'zeytinlik'];
  const imarList = ['Konut, E:1.20', 'Ticari + konut, E:1.50', 'Tarım, yapılaşma yok', 'Turizm, E:0.80'];
  return {
    ada: String(1000 + (seed % 9000)),
    parsel: String(1 + (seed % 250)),
    alan: 500 + (seed % 5000),
    cins: cinsList[seed % cinsList.length],
    imarDurumu: imarList[seed % imarList.length],
  };
}

const RISK_COLORS: Record<string, string> = {
  temiz: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  serh: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  ipotek: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  haciz: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const RISK_LABELS: Record<string, string> = {
  temiz: 'Temiz',
  serh: 'Şerh',
  ipotek: 'İpotek',
  haciz: 'Haciz',
};

function UploadInner() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TapuExtract | null>(null);
  const upload = useUploadTapu();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  }

  function onUpload() {
    if (!file) return;
    const hints = extractHints(file.name);
    upload.mutate(
      { listingId: DEMO_LISTING_ID, fileName: file.name, hints },
      {
        onSuccess: (data) => setResult(data),
      },
    );
  }

  function reset() {
    setFile(null);
    setResult(null);
  }

  return (
    <section className="space-y-6">
      {/* ── Step 1: file picker ── */}
      {!result && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Adım 1 · Tapu yükle
          </div>
          <h2 className="mt-1 font-serif text-xl tracking-tight">
            Tapu fotoğrafını <em className="font-normal italic">seç</em>
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG / PNG / PDF — sadece sen ve onay verdiğin alıcılar görür. OCR sonucunu istediğin
            an silebilirsin.
          </p>

          <label
            htmlFor="tapu-file"
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
              file
                ? 'border-foreground/40 bg-foreground/5'
                : 'border-border bg-background hover:border-foreground/30'
            }`}
          >
            <div className="text-2xl">{file ? '📄' : '⬆'}</div>
            <div className="text-sm">
              {file ? file.name : 'Dosya seç ya da sürükle bırak'}
            </div>
            <div className="text-xs text-muted-foreground">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : 'Maksimum 8 MB · JPG / PNG / PDF'}
            </div>
            <input
              id="tapu-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={onPick}
              className="hidden"
            />
          </label>

          <div className="mt-4 flex items-center justify-end gap-2">
            {file && (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
              >
                Vazgeç
              </button>
            )}
            <button
              type="button"
              onClick={onUpload}
              disabled={!file || upload.isPending}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {upload.isPending ? 'OCR çalışıyor…' : 'OCR ile çıkar'}
            </button>
          </div>

          {upload.isPending && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-foreground/5 px-3 py-2 text-xs">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground/60" />
              Tapu görüntüsü işleniyor — yaklaşık 1.5 saniye.
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: OCR result ── */}
      {result && <ResultPanel result={result} onRetry={reset} />}
    </section>
  );
}

function ResultPanel({ result, onRetry }: { result: TapuExtract; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Adım 2 · OCR sonucu
            </div>
            <h2 className="mt-1 font-serif text-xl tracking-tight">
              Tapu <em className="font-normal italic">çıkarıldı</em>
            </h2>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Güven %{Math.round(result.ocrConfidence * 100)}
          </span>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody className="divide-y divide-border">
            <Row label="Ada" value={result.ada} />
            <Row label="Parsel" value={result.parsel} />
            <Row label="Alan" value={`${result.alan.toLocaleString('tr-TR')} m²`} />
            <Row label="Cins" value={result.cins} />
            <Row label="İmar durumu" value={result.imarDurumu} />
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-base tracking-tight">
          Risk <em className="font-normal italic">durumu</em>
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {result.risks.map((r, i) => (
            <RiskBadge key={i} risk={r} />
          ))}
        </ul>
        {result.risks.every((r) => r.type === 'temiz') && (
          <p className="mt-3 text-xs text-muted-foreground">
            Tapu üzerinde takyidat yok — ilanı güvenle yayına hazırlayabilirsin.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-foreground/5"
        >
          ← Yeni dosya yükle
        </button>
        <div className="flex items-center gap-2">
          <a
            href="/hesabim"
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-foreground/5"
          >
            Sonra devam et
          </a>
          <a
            href="/ilan-ver/1"
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Sonraki adım →
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-1/3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </td>
      <td className="py-2 font-medium">{value}</td>
    </tr>
  );
}

function RiskBadge({ risk }: { risk: TapuRisk }) {
  const cls = RISK_COLORS[risk.type] ?? RISK_COLORS.temiz;
  return (
    <li
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${cls}`}
      data-risk-type={risk.type}
    >
      <span className="font-semibold">{RISK_LABELS[risk.type] ?? risk.type}</span>
      <span className="opacity-90">— {risk.note}</span>
    </li>
  );
}

export default function TapuUploadIsland() {
  return (
    <QueryProvider>
      <UploadInner />
    </QueryProvider>
  );
}
