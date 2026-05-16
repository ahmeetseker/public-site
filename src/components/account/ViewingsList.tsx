import { useEffect, useState } from 'react';

type Status = 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';

interface Viewing {
  id: string;
  listingId: string;
  listingTitle: string;
  scheduledAt: string;
  status: Status;
  note?: string;
  sellerName: string;
}

const SEED: Viewing[] = [
  {
    id: 'V-101',
    listingId: 'L-2401',
    listingTitle: 'Beykoz Acarkent · 1.250 m² konut arsa',
    scheduledAt: '2026-05-17T14:00:00Z',
    status: 'confirmed',
    note: 'Sahibi parselde olacak, GPS koordinatı paylaşılacak.',
    sellerName: 'Mehmet Yılmaz',
  },
  {
    id: 'V-102',
    listingId: 'L-2403',
    listingTitle: 'Bodrum Yalıkavak · 850 m² ticari arsa',
    scheduledAt: '2026-05-19T10:30:00Z',
    status: 'requested',
    sellerName: 'Can Aksoy',
  },
  {
    id: 'V-103',
    listingId: 'L-2406',
    listingTitle: 'Kuşadası Davutlar · 2.100 m² konut',
    scheduledAt: '2026-05-12T13:00:00Z',
    status: 'completed',
    note: 'Görme tamamlandı, alıcı geri dönecek.',
    sellerName: 'Elif Gül',
  },
];

const TONE: Record<Status, string> = {
  requested: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rescheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  completed: 'bg-foreground/10 text-muted-foreground',
};

const LABEL: Record<Status, string> = {
  requested: 'Talep edildi',
  confirmed: 'Onaylandı',
  rescheduled: 'Ertelendi',
  cancelled: 'İptal',
  completed: 'Tamamlandı',
};

const STORAGE_KEY = 'arsam:viewings:v1';

export default function ViewingsList() {
  const [items, setItems] = useState<Viewing[]>(() => {
    if (typeof window === 'undefined') return SEED;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Viewing[]) : SEED;
    } catch {
      return SEED;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota */
    }
  }, [items]);

  const cancel = (id: string) => {
    if (!window.confirm('Randevuyu iptal et?')) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'cancelled' as Status } : it)));
  };

  const reschedule = (id: string) => {
    const at = window.prompt('Yeni tarih (YYYY-MM-DD HH:mm)', '');
    if (!at) return;
    const iso = new Date(at.replace(' ', 'T')).toISOString();
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: 'rescheduled' as Status, scheduledAt: iso } : it,
      ),
    );
  };

  const upcoming = items.filter((it) => it.status !== 'completed' && it.status !== 'cancelled');
  const past = items.filter((it) => it.status === 'completed' || it.status === 'cancelled');

  return (
    <section className="space-y-6">
      <div>
        <h2 className="mb-3 font-serif text-lg font-medium">Yaklaşan ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
            Planlanmış randevu yok.
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((v) => (
              <ViewingRow key={v.id} v={v} onCancel={() => cancel(v.id)} onReschedule={() => reschedule(v.id)} />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-medium text-muted-foreground">
            Geçmiş ({past.length})
          </h2>
          <ul className="space-y-2">
            {past.map((v) => (
              <ViewingRow key={v.id} v={v} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ViewingRow({
  v,
  onCancel,
  onReschedule,
}: {
  v: Viewing;
  onCancel?: () => void;
  onReschedule?: () => void;
}) {
  const dt = new Date(v.scheduledAt);
  const dateStr = dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <li data-testid="viewing-row" className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{v.id}</span>
            <a href={`/ilan/${v.listingId}`} className="font-medium hover:underline">
              {v.listingTitle}
            </a>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${TONE[v.status]}`}>
              {LABEL[v.status]}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <span className="font-medium">{dateStr}</span>
            <span className="text-muted-foreground">{timeStr}</span>
            <span className="text-muted-foreground">· Satıcı: {v.sellerName}</span>
          </div>
          {v.note && <div className="mt-1.5 text-xs text-muted-foreground">{v.note}</div>}
        </div>
        {onReschedule && (
          <button
            type="button"
            onClick={onReschedule}
            data-testid={`viewing-reschedule-${v.id}`}
            className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            Ertele
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-testid={`viewing-cancel-${v.id}`}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
          >
            İptal
          </button>
        )}
      </div>
    </li>
  );
}
