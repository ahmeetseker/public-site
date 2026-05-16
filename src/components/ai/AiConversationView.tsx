/**
 * AiConversationView — F33 Faz 2 / `/hesabim/ai/[id]`.
 *
 * Tek konuşma replay + JSON/Markdown export.
 * Tool calls expandable. Mesajlar kronolojik.
 */

import { useMemo, useState } from 'react';
import { useGetAiConversation } from '@landx/data';
import { QueryProvider } from './QueryProvider';

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

interface Msg {
  role: string;
  content: string;
  createdAt: string;
  toolCalls?: ToolCall[];
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function toMarkdown(title: string, messages: Msg[]): string {
  const lines: string[] = [`# ${title}`, ''];
  for (const m of messages) {
    const ts = new Date(m.createdAt).toLocaleString('tr-TR');
    const role = m.role === 'user' ? 'Kullanıcı' : m.role === 'assistant' ? 'Asistan' : m.role;
    lines.push(`## ${role} — ${ts}`);
    lines.push('');
    lines.push(m.content);
    if (m.toolCalls?.length) {
      lines.push('');
      lines.push('**Araç çağrıları:**');
      for (const tc of m.toolCalls) {
        lines.push(`- \`${tc.name}\` — args: \`${JSON.stringify(tc.args)}\``);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function ViewInner({ conversationId }: { conversationId: string }) {
  const conv = useGetAiConversation(conversationId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fileBase = useMemo(() => {
    const safe = (conv.data?.title ?? conversationId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `ai-konusma-${safe || conversationId}`;
  }, [conv.data?.title, conversationId]);

  if (conv.isLoading) {
    return <div className="text-sm text-muted-foreground">Konuşma yükleniyor…</div>;
  }
  if (!conv.data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
        Konuşma bulunamadı. <a href="/hesabim/ai" className="underline">Listeye dön</a>
      </div>
    );
  }

  const c = conv.data;

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exportJson() {
    downloadBlob(`${fileBase}.json`, JSON.stringify(c, null, 2), 'application/json');
  }
  function exportMd() {
    downloadBlob(`${fileBase}.md`, toMarkdown(c.title, c.messages as Msg[]), 'text/markdown');
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Konuşma · {c.id}
          </div>
          <h2 className="mt-1 font-serif text-xl tracking-tight">{c.title}</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            {c.messages.length} mesaj · son güncelleme{' '}
            {new Date(c.updatedAt).toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/hesabim/ai"
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
          >
            ← Tüm konuşmalar
          </a>
          <button
            type="button"
            onClick={exportJson}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
          >
            JSON indir
          </button>
          <button
            type="button"
            onClick={exportMd}
            className="rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90"
          >
            Markdown indir
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {(c.messages as Msg[]).map((m, i) => {
          const isUser = m.role === 'user';
          const key = `${i}`;
          const isExpanded = expanded.has(key);
          return (
            <li key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  isUser
                    ? 'bg-foreground text-background'
                    : 'border border-border bg-card text-foreground'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`font-mono text-xs uppercase tracking-wide ${
                      isUser ? 'text-background/70' : 'text-muted-foreground'
                    }`}
                  >
                    {m.role === 'user' ? 'sen' : m.role === 'assistant' ? 'asistan' : m.role}
                  </span>
                  <span
                    className={`text-xs ${
                      isUser ? 'text-background/60' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-2 border-t border-border/30 pt-2">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`text-xs underline ${
                        isUser ? 'text-background/80' : 'text-muted-foreground'
                      }`}
                    >
                      {isExpanded ? '− gizle' : `+ ${m.toolCalls.length} araç çağrısı`}
                    </button>
                    {isExpanded && (
                      <ul className="mt-2 space-y-1">
                        {m.toolCalls.map((tc, j) => (
                          <li
                            key={j}
                            className="rounded-lg bg-foreground/5 p-2 font-mono text-xs"
                          >
                            <div className="font-semibold">{tc.name}</div>
                            <div className="mt-1 text-muted-foreground">
                              args: {JSON.stringify(tc.args)}
                            </div>
                            {tc.result !== undefined && (
                              <div className="text-muted-foreground">
                                result: {JSON.stringify(tc.result)}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function AiConversationView({ conversationId }: { conversationId: string }) {
  return (
    <QueryProvider>
      <ViewInner conversationId={conversationId} />
    </QueryProvider>
  );
}
