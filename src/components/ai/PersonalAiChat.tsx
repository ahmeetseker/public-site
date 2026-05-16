/**
 * PersonalAiChat — F33 Faz 2 / `/hesabim/ai`.
 *
 * Two-pane chat:
 *   - Sol (280px): konuşma listesi (`useListAiConversations`)
 *   - Sağ: aktif konuşma mesajları (`useGetAiConversation`) + composer
 *
 * Boş hâl: 3 prompt önerisi kullanıcıyı ilk konuşmaya yönlendirir.
 * Mobile (375px): liste/aktif tek kolona iner — geri tuşuyla listeye dön.
 */

import { useEffect, useRef, useState } from 'react';
import {
  useAppendAiMessage,
  useCreateAiConversation,
  useDeleteAiConversation,
  useGetAiConversation,
  useListAiConversations,
} from '@landx/data';
import { QueryProvider } from './QueryProvider';

const PROMPT_SUGGESTIONS = [
  'Çeşme\'de 2 dönüm arsa fiyatları',
  'Bu ilanın değerini analiz et',
  'Bölge raporu istiyorum',
];

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMin = Math.round((now - d.getTime()) / 60_000);
  if (diffMin < 1) return 'şimdi';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 24 * 60) return `${Math.round(diffMin / 60)} sa önce`;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function ChatInner() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showListMobile, setShowListMobile] = useState(true);

  const list = useListAiConversations();
  const conv = useGetAiConversation(activeId ?? '');
  const create = useCreateAiConversation();
  const append = useAppendAiMessage();
  const remove = useDeleteAiConversation();

  // Auto-select ilk konuşma
  useEffect(() => {
    if (activeId == null && list.data && list.data.length > 0) {
      setActiveId(list.data[0].id);
    }
  }, [list.data, activeId]);

  const messages = conv.data?.messages ?? [];
  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0;

  // Otomatik scroll-to-bottom
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, conv.data?.id]);

  function startNew(prompt?: string) {
    const firstMessage = prompt ?? draft.trim();
    if (!firstMessage) return;
    const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + '…' : firstMessage;
    create.mutate(
      { title, firstMessage },
      {
        onSuccess: (created) => {
          setActiveId(created.id);
          setDraft('');
          setShowListMobile(false);
        },
      },
    );
  }

  function send() {
    const content = draft.trim();
    if (!content) return;
    if (!activeId) {
      startNew();
      return;
    }
    append.mutate({ conversationId: activeId, content });
    setDraft('');
  }

  function onDelete(id: string) {
    if (!window.confirm('Bu konuşmayı silmek istiyor musun?')) return;
    remove.mutate(id, {
      onSuccess: () => {
        if (activeId === id) setActiveId(null);
      },
    });
  }

  const sending = create.isPending || append.isPending;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid min-h-[560px] md:grid-cols-[280px_1fr]">
        {/* ─── Sol pane: konuşma listesi ─── */}
        <aside
          className={`border-border md:border-r ${showListMobile ? 'block' : 'hidden md:block'}`}
        >
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Konuşmalar
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveId(null);
                setDraft('');
                setShowListMobile(false);
              }}
              className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90"
            >
              + Yeni
            </button>
          </div>
          <ul className="max-h-[520px] overflow-y-auto">
            {list.isLoading && (
              <li className="p-4 text-xs text-muted-foreground">Yükleniyor…</li>
            )}
            {(list.data ?? []).map((c) => {
              const isActive = c.id === activeId;
              const last = c.messages[c.messages.length - 1]?.content ?? '';
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(c.id);
                      setShowListMobile(false);
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group flex w-full flex-col gap-1 border-b border-border/60 px-3 py-3 text-left transition ${
                      isActive ? 'bg-foreground/5' : 'hover:bg-foreground/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">{c.title}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c.id);
                        }}
                        className="hidden shrink-0 rounded-lg px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground group-hover:inline-block"
                        aria-label="Konuşmayı sil"
                        role="button"
                      >
                        ✕
                      </span>
                    </div>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {last}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground/80">
                      {formatRelative(c.updatedAt)}
                    </span>
                  </button>
                </li>
              );
            })}
            {isEmpty && (
              <li className="p-4 text-xs text-muted-foreground">
                Henüz konuşman yok. Sağdaki kutudan başla.
              </li>
            )}
          </ul>
        </aside>

        {/* ─── Sağ pane: aktif konuşma + composer ─── */}
        <main
          className={`flex min-h-[560px] flex-col ${showListMobile ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Mobile: geri butonu */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setShowListMobile(true)}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/5"
            >
              ← Konuşmalar
            </button>
            {conv.data && (
              <span className="line-clamp-1 max-w-[60%] text-xs font-medium">
                {conv.data.title}
              </span>
            )}
          </div>

          {/* Mesaj listesi VEYA empty state */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {!activeId ? (
              <EmptyState onSuggest={(p) => startNew(p)} />
            ) : conv.isLoading ? (
              <div className="text-sm text-muted-foreground">Konuşma yükleniyor…</div>
            ) : !conv.data ? (
              <div className="text-sm text-muted-foreground">Konuşma bulunamadı.</div>
            ) : (
              <MessageList messages={messages} />
            )}
            {sending && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground/60" />
                AI yazıyor…
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t border-border bg-background p-3"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Bir şey sor… (Enter = gönder, Shift+Enter = satır)"
              className="flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/40"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              Gönder
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (p: string) => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5 font-serif text-2xl">
        ✦
      </div>
      <div>
        <h2 className="font-serif text-xl tracking-tight">
          Bir şey <em className="font-normal italic text-muted-foreground">sor</em>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Arsa fiyatları, bölge raporları, tapu kontrolü — sohbetle yardım alabilirsin.
        </p>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {PROMPT_SUGGESTIONS.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onSuggest(p)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition hover:border-foreground/30 hover:bg-foreground/5"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageList({ messages }: { messages: { role: string; content: string; createdAt: string; toolCalls?: { name: string; args: Record<string, unknown>; result?: unknown }[] }[] }) {
  return (
    <ul className="space-y-3">
      {messages.map((m, i) => {
        const isUser = m.role === 'user';
        return (
          <li key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                isUser
                  ? 'bg-foreground text-background'
                  : 'border border-border bg-card text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                  {m.toolCalls.map((tc, j) => (
                    <div
                      key={j}
                      className="rounded-lg bg-foreground/5 px-2 py-1 font-mono text-xs"
                    >
                      <span className="font-semibold">{tc.name}</span>(
                      {Object.keys(tc.args).join(', ')})
                    </div>
                  ))}
                </div>
              )}
              <div
                className={`mt-1 text-xs ${
                  isUser ? 'text-background/70' : 'text-muted-foreground'
                }`}
              >
                {formatRelative(m.createdAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function PersonalAiChat() {
  return (
    <QueryProvider>
      <ChatInner />
    </QueryProvider>
  );
}
