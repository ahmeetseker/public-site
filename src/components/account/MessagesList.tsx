/**
 * MessagesList — /hesabim/mesajlar React island (client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Renders the BUYER_MOCK_CONVERSATIONS sidebar (left) + thread view (right)
 * with inline conversation switching — no page reload, no backend.
 *
 * Layout: `grid-cols-1 md:grid-cols-[280px,1fr]`.
 * "Yeni mesaj başlat" → /iletisim.
 */
import { useState } from 'react'
import { BUYER_MOCK_CONVERSATIONS, type MockConversation } from '../../lib/buyer-mock'

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function MessagesList() {
  const [activeId, setActiveId] = useState<string>(BUYER_MOCK_CONVERSATIONS[0]?.id ?? '')

  if (BUYER_MOCK_CONVERSATIONS.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        data-messages-empty=""
      >
        <span className="font-serif text-4xl font-normal text-muted-foreground" aria-hidden="true">
          ✉
        </span>
        <h2 className="font-serif text-xl tracking-tight">Henüz mesajın yok.</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bir ilan sayfasındaki iletişim formunu doldurduğunda mesajlaşma
          burada başlar.
        </p>
        <a
          href="/iletisim"
          className="mt-2 inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Yeni mesaj başlat →
        </a>
      </div>
    )
  }

  const active: MockConversation | undefined =
    BUYER_MOCK_CONVERSATIONS.find((c) => c.id === activeId) ?? BUYER_MOCK_CONVERSATIONS[0]

  return (
    <div
      className="grid gap-6 md:grid-cols-[280px,1fr]"
      data-messages-island=""
    >
      <div className="flex flex-col gap-2">
        <ul
          className="flex flex-col gap-2 md:max-h-[640px] md:overflow-y-auto"
          data-messages-sidebar=""
        >
          {BUYER_MOCK_CONVERSATIONS.map((c) => {
            const isActive = c.id === active?.id
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  data-message-row={c.id}
                  data-active={isActive ? 'true' : 'false'}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? 'border-foreground bg-card'
                      : 'border-border bg-card hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-serif text-sm tracking-tight">
                      {c.office}
                    </span>
                    {c.unread > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 font-mono text-xs tabular-nums text-background">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.lastMessage}
                  </p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {fmtTime(c.lastMessageAt)}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
        <a
          href="/iletisim"
          data-messages-new=""
          className="mt-2 inline-flex items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
        >
          + Yeni mesaj başlat
        </a>
      </div>

      <section
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:min-h-[480px]"
        data-message-thread={active?.id}
      >
        {active && (
          <>
            <header className="border-b border-border pb-3">
              <h2 className="font-serif text-lg tracking-tight">{active.office}</h2>
              <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {active.listingTitle}
              </p>
            </header>
            <ol className="flex flex-col gap-3">
              {active.messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === 'me'
                        ? 'bg-foreground text-background'
                        : 'bg-foreground/10 text-foreground'
                    }`}
                  >
                    <p className="leading-snug">{m.text}</p>
                    <time
                      dateTime={m.at}
                      className={`mt-1 block font-mono text-xs ${
                        m.from === 'me' ? 'text-background/70' : 'text-muted-foreground'
                      }`}
                    >
                      {fmtTime(m.at)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  )
}
