import { useEffect, useState } from 'react';
import { parseQuery } from '@landx/ai';

interface Entry {
  id: string;
  query: string;
  parsedSummary: string;
  resultLink: string;
  createdAt: string;
}

const SEED: Entry[] = [
  {
    id: 'AI-001',
    query: 'İstanbul Beykoz 5000 m² imarlı 2.5M altı',
    parsedSummary: 'İstanbul · Beykoz · konut · max 2.5M ₺',
    resultLink: '/ara?q=istanbul+beykoz+konut+2.5M',
    createdAt: '2026-05-14T18:32:00Z',
  },
  {
    id: 'AI-002',
    query: 'Bodrum deniz manzaralı zeytinlik',
    parsedSummary: 'Muğla · Bodrum · zeytinlik · özellikler: Deniz manzaralı',
    resultLink: '/ara?q=bodrum+zeytinlik+deniz',
    createdAt: '2026-05-13T11:05:00Z',
  },
  {
    id: 'AI-003',
    query: 'Çeşme Alaçatı yatırımlık ticari arsa 10 milyon üzeri',
    parsedSummary: 'İzmir · Çeşme · ticari · min 10M ₺',
    resultLink: '/ara?q=cesme+alacati+ticari',
    createdAt: '2026-05-12T09:47:00Z',
  },
];

const STORAGE_KEY = 'arsam:ai-history:v1';

export default function AiHistoryList() {
  const [items, setItems] = useState<Entry[]>(() => {
    if (typeof window === 'undefined') return SEED;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Entry[]) : SEED;
    } catch {
      return SEED;
    }
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota */
    }
  }, [items]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const parsed = parseQuery(input);
    const parts: string[] = [];
    if (parsed.city) parts.push(parsed.city);
    if (parsed.district) parts.push(parsed.district);
    if (parsed.imarType) parts.push(parsed.imarType);
    if (parsed.maxPrice) parts.push(`max ${(parsed.maxPrice / 1_000_000).toFixed(1)}M ₺`);
    if (parsed.minPrice) parts.push(`min ${(parsed.minPrice / 1_000_000).toFixed(1)}M ₺`);
    if (parsed.tkgmStatus) parts.push(`TKGM: ${parsed.tkgmStatus}`);
    if (parsed.features && parsed.features.length) parts.push(`özellikler: ${parsed.features.join(', ')}`);
    const summary = parts.length > 0 ? parts.join(' · ') : 'Eşleşen filtre bulunamadı';

    const entry: Entry = {
      id: `AI-${Date.now().toString(36)}`,
      query: input,
      parsedSummary: summary,
      resultLink: `/ara?q=${encodeURIComponent(input)}`,
      createdAt: new Date().toISOString(),
    };
    setItems([entry, ...items]);
    setInput('');
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clear = () => {
    if (!window.confirm('Tüm AI geçmişini sil?')) return;
    setItems([]);
  };

  return (
    <section className="space-y-4">
      <form onSubmit={add} className="rounded-2xl border border-border bg-card p-3">
        <label htmlFor="ai-q" className="mb-1.5 block font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Yeni AI sorgusu
        </label>
        <div className="flex gap-2">
          <input
            id="ai-q"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="örn: Antalya Kaş turizm imarlı 5000 m² deniz manzaralı"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            data-testid="ai-history-add"
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            Parse et
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{items.length} sorgu kayıtlı</span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            data-testid="ai-history-clear"
            className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            Tümünü sil
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          AI geçmişin boş — yukarıdaki forma bir niyet yazıp parse edebilirsin.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              data-testid="ai-history-row"
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{it.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(it.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="mt-1 font-medium">{it.query}</div>
                  <div className="mt-1 text-xs text-muted-foreground">→ {it.parsedSummary}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={it.resultLink}
                    className="rounded-xl bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
                  >
                    Aramaya git
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    data-testid={`ai-history-remove-${it.id}`}
                    className="rounded-xl border border-border bg-card px-2 py-1.5 text-xs hover:bg-foreground/5"
                    aria-label="Sil"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
