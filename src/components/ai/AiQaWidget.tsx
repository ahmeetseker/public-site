/**
 * AiQaWidget — F33 Faz 2 widget (W2).
 *
 * Mount: `/ilan/[slug]` alt section.
 * Hooks: useAiQa(listingId) (liste) + useAskAiQa() (yeni soru).
 *
 * Akış:
 *   - Ön-cevap AI tarafından üretilir, satıcı onayı ile birlikte yayınlanır.
 *   - Onay durumu badge: pending / onaylı / reddedildi.
 *   - Önceki Q&A'lar accordion liste.
 */

import { useState } from 'react';
import { useAiQa, useAskAiQa, type AiQaThread } from '@landx/data';
import { QueryProvider } from './QueryProvider';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ApprovalBadge({ approved }: { approved: AiQaThread['sellerApproved'] }) {
  if (approved == null) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        Satıcı onayı bekleniyor
      </span>
    );
  }
  if (approved) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        Satıcı onayladı
      </span>
    );
  }
  return (
    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
      Satıcı reddetti
    </span>
  );
}

function WidgetInner({ listingId }: { listingId: string }) {
  const list = useAiQa(listingId);
  const ask = useAskAiQa();
  const [question, setQuestion] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    ask.mutate(
      { listingId, question: q, userId: 'demo-user' },
      {
        onSuccess: (created) => {
          setQuestion('');
          setOpenId(created.id);
        },
      },
    );
  }

  const threads = list.data ?? [];
  // Onaylı + kullanıcının kendi (pending) sorularını göster
  const visible = threads.filter((t) => t.sellerApproved !== false);

  return (
    <section className="space-y-4">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Soru &amp; Cevap
        </div>
        <h2 className="mt-1 font-serif text-lg font-medium tracking-tight">
          AI ile <em className="font-normal italic">sor</em>, satıcı onaylasın
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          AI, ilan açıklaması ve özelliklerinden ön cevap üretir. Yayınlanması için satıcı
          onayı gerekir.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-end"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="Örn: Tapuda ipotek var mı? Yola cephe ne kadar?"
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={ask.isPending || !question.trim()}
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {ask.isPending ? 'AI yazıyor…' : 'Sor'}
        </button>
      </form>

      {list.isLoading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
          Sorular yükleniyor…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
          Bu ilanda henüz soru yok. İlk soruyu sen sor.
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => {
            const open = openId === t.id;
            return (
              <li
                key={t.id}
                className="rounded-2xl border border-border bg-card"
                data-qa-id={t.id}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : t.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={open}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ApprovalBadge approved={t.sellerApproved} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-sm font-medium">{t.question}</div>
                  </div>
                  <span
                    className={`shrink-0 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                {open && (
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        AI ön cevabı
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{t.aiAnswer}</div>
                    </div>
                    {t.sellerNote && (
                      <div className="rounded-xl bg-foreground/5 p-2">
                        <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Satıcı notu
                        </div>
                        <div className="mt-1 text-sm">{t.sellerNote}</div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function AiQaWidget({ listingId }: { listingId: string }) {
  return (
    <QueryProvider>
      <WidgetInner listingId={listingId} />
    </QueryProvider>
  );
}
