/**
 * AiNotificationPrefForm — F33 Faz 2 / `/hesabim/ai-tercihleri`.
 *
 * Akıllı bildirim tercihleri:
 *   - smartTimingEnabled toggle
 *   - quietHours from-to picker
 *   - 8 event tipi × { aiPriority + channels[] } matrisi
 *
 * Hooks: useAiNotificationPrefs / useUpdateAiNotificationPrefs
 */

import { useEffect, useState } from 'react';
import {
  useAiNotificationPrefs,
  useUpdateAiNotificationPrefs,
  type AiNotificationChannel,
  type AiNotificationEventPref,
  type AiNotificationPref,
  type AiNotificationPriority,
} from '@landx/data';
import { QueryProvider } from './QueryProvider';

const EVENT_LABELS: Record<string, { tr: string; desc: string }> = {
  listing_new_match: { tr: 'Yeni eşleşen ilan', desc: 'Kayıtlı arama kriterlerine yeni ilan' },
  listing_price_drop: { tr: 'Fiyat düştü', desc: 'Favori ilanın fiyatı düştü' },
  valuation_change: { tr: 'Değerleme değişti', desc: 'AI değerleme yeniden hesaplandı' },
  qa_seller_replied: { tr: 'Satıcı cevapladı', desc: 'Sorduğun bir Q&A satıcı tarafından onaylandı' },
  market_report_ready: { tr: 'Pazar raporu hazır', desc: 'Takip ettiğin bölge için yeni rapor' },
  tapu_risk_detected: { tr: 'Tapu riski', desc: 'OCR sonrası ipotek/haciz/şerh saptandı' },
  payment_status_change: { tr: 'Ödeme durumu', desc: 'Abonelik / fatura durumu değişti' },
  weekly_digest: { tr: 'Haftalık özet', desc: 'Pazartesi sabahı tek e-posta' },
};

const PRIORITY_ORDER: AiNotificationPriority[] = ['critical', 'normal', 'low'];
const PRIORITY_LABEL: Record<AiNotificationPriority, string> = {
  critical: 'Kritik',
  normal: 'Normal',
  low: 'Düşük',
};
const CHANNELS: AiNotificationChannel[] = ['email', 'push', 'sms'];
const CHANNEL_LABEL: Record<AiNotificationChannel, string> = {
  email: 'E-posta',
  push: 'Push',
  sms: 'SMS',
};

const USER_ID = 'demo-user';

function FormInner() {
  const prefsQ = useAiNotificationPrefs(USER_ID);
  const update = useUpdateAiNotificationPrefs();
  const [draft, setDraft] = useState<AiNotificationPref | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (prefsQ.data && draft == null) setDraft(prefsQ.data);
  }, [prefsQ.data, draft]);

  if (prefsQ.isLoading || !draft) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Tercihler yükleniyor…
      </div>
    );
  }

  function setSmartTiming(v: boolean) {
    setDraft((d) => (d ? { ...d, smartTimingEnabled: v } : d));
  }
  function setQuiet(field: 'from' | 'to', v: string) {
    setDraft((d) => (d ? { ...d, quietHours: { ...d.quietHours, [field]: v } } : d));
  }
  function setEvent(eventKey: string, patch: Partial<AiNotificationEventPref>) {
    setDraft((d) => {
      if (!d) return d;
      const current = d.perEvent[eventKey] ?? { aiPriority: 'normal' as const, channels: [] };
      return {
        ...d,
        perEvent: {
          ...d.perEvent,
          [eventKey]: { ...current, ...patch },
        },
      };
    });
  }
  function toggleChannel(eventKey: string, ch: AiNotificationChannel) {
    if (!draft) return;
    const current = draft.perEvent[eventKey] ?? { aiPriority: 'normal' as const, channels: [] };
    const has = current.channels.includes(ch);
    const next = has ? current.channels.filter((c) => c !== ch) : [...current.channels, ch];
    setEvent(eventKey, { channels: next });
  }

  function save() {
    if (!draft) return;
    update.mutate(
      {
        userId: USER_ID,
        patch: {
          smartTimingEnabled: draft.smartTimingEnabled,
          quietHours: draft.quietHours,
          perEvent: draft.perEvent,
        },
      },
      {
        onSuccess: () => {
          setSavedAt(new Date().toLocaleTimeString('tr-TR'));
        },
      },
    );
  }

  const eventKeys = Object.keys(draft.perEvent);

  return (
    <section className="space-y-5">
      {/* ── Smart timing + quiet hours ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-lg tracking-tight">
          Akıllı <em className="font-normal italic">zamanlama</em>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          AI, bildirimi senin uyanık olduğun ve etkileşim oranının yüksek olduğu saatte gönderir.
        </p>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={draft.smartTimingEnabled}
            onChange={(e) => setSmartTiming(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">
            AI hangi saatte gönderileceğine karar versin
          </span>
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Sessiz saatler — başlangıç
            </span>
            <input
              type="time"
              value={draft.quietHours.from}
              onChange={(e) => setQuiet('from', e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Sessiz saatler — bitiş
            </span>
            <input
              type="time"
              value={draft.quietHours.to}
              onChange={(e) => setQuiet('to', e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            />
          </label>
        </div>
      </div>

      {/* ── Event matrix ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-lg tracking-tight">
          Bildirim <em className="font-normal italic">matrisi</em>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Her olay için AI önceliği ve hangi kanallardan gönderileceğini seç.
        </p>

        <ul className="mt-4 space-y-3">
          {eventKeys.map((key) => {
            const pref = draft.perEvent[key];
            const meta = EVENT_LABELS[key] ?? { tr: key, desc: '' };
            return (
              <li
                key={key}
                className="rounded-xl border border-border bg-background p-3"
                data-event={key}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{meta.tr}</div>
                    {meta.desc && (
                      <div className="text-xs text-muted-foreground">{meta.desc}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Öncelik
                      </span>
                      <select
                        value={pref.aiPriority}
                        onChange={(e) =>
                          setEvent(key, { aiPriority: e.target.value as AiNotificationPriority })
                        }
                        className="rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:border-foreground/40"
                      >
                        {PRIORITY_ORDER.map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center gap-1">
                      {CHANNELS.map((ch) => {
                        const on = pref.channels.includes(ch);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChannel(key, ch)}
                            aria-pressed={on}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                              on
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-card text-muted-foreground hover:border-foreground/30'
                            }`}
                          >
                            {CHANNEL_LABEL[ch]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Save bar ── */}
      <div className="sticky bottom-3 flex items-center justify-end gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        {savedAt && (
          <span className="text-xs text-muted-foreground">Kaydedildi · {savedAt}</span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={update.isPending}
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {update.isPending ? 'Kaydediliyor…' : 'Tercihleri kaydet'}
        </button>
      </div>
    </section>
  );
}

export default function AiNotificationPrefForm() {
  return (
    <QueryProvider>
      <FormInner />
    </QueryProvider>
  );
}
