import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { chat, type ChatResult, type ChatSuggestion } from '@landx/ai';
import { cn } from '../lib/cn';

export interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  role?: 'guest' | 'buyer' | 'seller' | 'admin';
  initialMessage?: string;
  onSuggestion?: (s: ChatSuggestion) => void;
  className?: string;
}

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: ChatSuggestion[];
  at: string;
}

const QUICK_PROMPTS = [
  'Onay kuyruğunu özetle',
  'İstanbul Beykoz 5000 m² imarlı 2,5M altı',
  'Risk skoru nasıl çalışır?',
  'Yeni ilan oluştur',
];

export function AssistantDrawer({
  open,
  onClose,
  role = 'guest',
  initialMessage,
  onSuggestion,
  className,
}: AssistantDrawerProps) {
  const [tab, setTab] = useState<'chat' | 'suggest' | 'automation'>('chat');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (turns.length === 0 && initialMessage) {
      setTurns([
        { id: '0', role: 'assistant', text: initialMessage, at: new Date().toISOString() },
      ]);
    }
  }, [open, initialMessage, turns.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns.length]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;
      const userTurn: Turn = {
        id: String(Date.now()),
        role: 'user',
        text,
        at: new Date().toISOString(),
      };
      setTurns((t) => [...t, userTurn]);
      setInput('');
      setBusy(true);
      try {
        const res: ChatResult = await chat({ user: text, context: { role } });
        setTurns((t) => [
          ...t,
          {
            id: String(Date.now() + 1),
            role: 'assistant',
            text: res.text,
            suggestions: res.suggestions,
            at: new Date().toISOString(),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, role],
  );

  const handleSuggestion = (s: ChatSuggestion) => {
    if (onSuggestion) {
      onSuggestion(s);
    } else if (s.href) {
      window.location.href = s.href;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className={cn(
              'fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl',
              className,
            )}
            role="dialog"
            aria-label="AI Asistan"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-semibold text-white">
                  AI
                </div>
                <div>
                  <div className="text-sm font-medium">AI Asistan</div>
                  <div className="text-[11px] text-muted-foreground">Cmd/Ctrl+J ile aç/kapa</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-foreground/5"
                aria-label="Kapat"
              >
                ✕
              </button>
            </header>

            <nav className="flex border-b border-border px-2 py-1">
              {(['chat', 'suggest', 'automation'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    tab === t
                      ? 'bg-foreground/5 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'chat' ? 'Sohbet' : t === 'suggest' ? 'Öneriler' : 'Otomasyon'}
                </button>
              ))}
            </nav>

            {tab === 'chat' && (
              <>
                <div
                  ref={listRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm"
                >
                  {turns.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-muted-foreground">
                      Niyetinizi yazın. Doğal dilden filtre oluşturabilir, formları doldurabilirim.
                    </div>
                  )}
                  {turns.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        'flex flex-col gap-2',
                        t.role === 'user' ? 'items-end' : 'items-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2',
                          t.role === 'user'
                            ? 'bg-foreground text-background'
                            : 'bg-foreground/[0.05]',
                        )}
                      >
                        {t.text}
                      </div>
                      {t.suggestions && t.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {t.suggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSuggestion(s)}
                              className="rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:bg-foreground/5"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {busy && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                      <span className="ml-2">düşünüyorum…</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border px-4 py-2">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Niyetinizi yazın…"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                      disabled={busy}
                    />
                    <button
                      type="submit"
                      disabled={busy || !input.trim()}
                      className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-40"
                    >
                      Gönder
                    </button>
                  </form>
                </div>
              </>
            )}

            {tab === 'suggest' && (
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <div className="font-medium">Aktiviteni özetle</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bu hafta 12 yeni ilan, 7 teklif aldın. Detaylı raporu açayım mı?
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSuggestion({ label: 'Raporu aç', href: '/reports' })}
                    className="mt-2 rounded-md bg-foreground/[0.06] px-2.5 py-1 text-xs hover:bg-foreground/[0.1]"
                  >
                    Raporu aç
                  </button>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="font-medium">Onay kuyruğu</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    3 yüksek riskli ilan inceleme bekliyor.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSuggestion({ label: 'Onaylara git', href: '/approvals' })}
                    className="mt-2 rounded-md bg-foreground/[0.06] px-2.5 py-1 text-xs hover:bg-foreground/[0.1]"
                  >
                    Onaylara git
                  </button>
                </div>
              </div>
            )}

            {tab === 'automation' && (
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <div className="font-medium">ECA Kuralları</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    24 hazır kuraldan 15'i etkin. Yeni kural eklemek için Kurallar sayfasına gidin.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSuggestion({ label: 'Kurallara git', href: '/rules' })}
                    className="mt-2 rounded-md bg-foreground/[0.06] px-2.5 py-1 text-xs hover:bg-foreground/[0.1]"
                  >
                    Kurallara git
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
