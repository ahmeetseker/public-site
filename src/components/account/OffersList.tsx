import { useEffect, useMemo, useState } from 'react';

type Status = 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

interface Offer {
  id: string;
  listingTitle: string;
  listingId: string;
  city: string;
  district: string;
  listingPrice: number;
  amount: number;
  message: string;
  status: Status;
  createdAt: string;
  validUntil: string;
}

const SEED: Offer[] = [
  {
    id: 'O-3001',
    listingId: 'L-2401',
    listingTitle: 'Beykoz Acarkent · 1.250 m² konut arsa',
    city: 'İstanbul',
    district: 'Beykoz',
    listingPrice: 8_400_000,
    amount: 7_500_000,
    message: 'Hızlı kapanış için nakit teklif.',
    status: 'pending',
    createdAt: '2026-05-13T14:30:00Z',
    validUntil: '2026-05-20T23:59:59Z',
  },
  {
    id: 'O-3002',
    listingId: 'L-2403',
    listingTitle: 'Bodrum Yalıkavak · 850 m² ticari arsa',
    city: 'Muğla',
    district: 'Bodrum',
    listingPrice: 15_500_000,
    amount: 14_000_000,
    message: 'Yarısı peşin, kalan 6 ay vade.',
    status: 'countered',
    createdAt: '2026-05-10T09:15:00Z',
    validUntil: '2026-05-17T23:59:59Z',
  },
  {
    id: 'O-3003',
    listingId: 'L-2406',
    listingTitle: 'Kuşadası Davutlar · 2.100 m² konut',
    city: 'Aydın',
    district: 'Kuşadası',
    listingPrice: 6_500_000,
    amount: 6_500_000,
    message: 'Liste fiyatını kabul ediyorum.',
    status: 'accepted',
    createdAt: '2026-05-08T11:00:00Z',
    validUntil: '2026-05-15T23:59:59Z',
  },
];

const STATUS_TONE: Record<Status, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  countered: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  expired: 'bg-foreground/10 text-muted-foreground',
  withdrawn: 'bg-foreground/10 text-muted-foreground',
};

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Bekliyor',
  countered: 'Karşı teklif',
  accepted: 'Kabul',
  rejected: 'Red',
  expired: 'Süresi doldu',
  withdrawn: 'Geri çekildi',
};

const STORAGE_KEY = 'arsam:offers:v1';

export default function OffersList() {
  const [items, setItems] = useState<Offer[]>(() => {
    if (typeof window === 'undefined') return SEED;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Offer[]) : SEED;
    } catch {
      return SEED;
    }
  });
  const [filter, setFilter] = useState<Status | 'all'>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota */
    }
  }, [items]);

  const withdraw = (id: string) => {
    if (!window.confirm('Teklifi geri çekmek istediğinden emin misin?')) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'withdrawn' as Status } : it)),
    );
  };

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.status === filter)),
    [items, filter],
  );

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc[it.status] = (acc[it.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<Status, number>,
      ),
    [items],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'pending', 'countered', 'accepted', 'rejected'] as const).map((k) => {
          const active = filter === k;
          const count = k === 'all' ? items.length : counts[k] ?? 0;
          const label = k === 'all' ? 'Hepsi' : STATUS_LABEL[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              data-testid={`offers-filter-${k}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              <span className="font-mono text-xs tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          Bu filtrede teklif yok.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((o) => {
            const diff = o.amount - o.listingPrice;
            const pct = ((o.amount / o.listingPrice - 1) * 100).toFixed(1);
            return (
              <li
                key={o.id}
                data-testid="offer-row"
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                      <a
                        href={`/ilan/${o.listingId}`}
                        className="font-medium hover:underline"
                      >
                        {o.listingTitle}
                      </a>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${STATUS_TONE[o.status]}`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{o.message}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span>
                        Teklif: <strong>₺{o.amount.toLocaleString('tr-TR')}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Liste: ₺{o.listingPrice.toLocaleString('tr-TR')}
                      </span>
                      <span
                        className={
                          diff < 0
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                        }
                      >
                        ({pct}%)
                      </span>
                      <span className="text-muted-foreground">
                        Geçerlilik: {new Date(o.validUntil).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  {o.status === 'pending' || o.status === 'countered' ? (
                    <button
                      type="button"
                      onClick={() => withdraw(o.id)}
                      data-testid={`offer-withdraw-${o.id}`}
                      className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-foreground/5"
                    >
                      Geri çek
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
