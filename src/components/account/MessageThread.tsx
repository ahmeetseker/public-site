/**
 * MessageThread — single-thread message list + typing indicator (Wave F9.B).
 *
 * Pure presentational: parent (MessagesView) feeds messages + typing flag +
 * read-receipt status; this just renders bubbles, attachment chips, and the
 * "İletildi / Okundu" badge for outbound messages.
 */
import { useEffect, useRef } from 'react'
import type { Message, Thread } from '../../lib/messages'

type Locale = 'tr' | 'en'

interface Labels {
  delivered: string
  read: string
  typingAria: string
  attachmentImage: string
  attachmentDoc: string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    delivered: '✓ İletildi',
    read: '✓✓ Okundu',
    typingAria: 'Yazıyor',
    attachmentImage: 'Görsel ek',
    attachmentDoc: 'Belge ek',
  },
  en: {
    delivered: '✓ Sent',
    read: '✓✓ Read',
    typingAria: 'Typing',
    attachmentImage: 'Image attachment',
    attachmentDoc: 'Document attachment',
  },
}

function formatTime(ms: number, locale: Locale): string {
  try {
    return new Date(ms).toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return new Date(ms).toISOString()
  }
}

interface MessageThreadProps {
  thread: Thread
  messages: Message[]
  locale?: Locale
}

export default function MessageThread({
  thread,
  messages,
  locale = 'tr',
}: MessageThreadProps) {
  const labels = LABELS[locale]
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, thread.isOfficeTyping])

  return (
    <section
      className="flex flex-1 flex-col rounded-2xl border border-border bg-card md:min-h-[480px]"
      data-testid="message-thread"
      data-thread-id={thread.id}
    >
      <header className="border-b border-border p-4">
        <h2 className="font-serif text-lg tracking-tight">{thread.officeName}</h2>
        {thread.listingTitle && (
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {thread.listingTitle}
          </p>
        )}
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 md:max-h-[480px]"
        data-testid="message-thread-scroll"
      >
        {messages.map((m) => {
          const mine = m.from === 'me'
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              data-testid="message-row"
              data-message-id={m.id}
              data-message-from={m.from}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/10 text-foreground'
                }`}
              >
                {m.body && <p className="whitespace-pre-wrap leading-snug">{m.body}</p>}
                {m.attachments && m.attachments.length > 0 && (
                  <ul
                    className="mt-2 space-y-1"
                    data-testid="message-attachments"
                  >
                    {m.attachments.map((a, i) => (
                      <li key={`${a.url}-${i}`}>
                        {a.type === 'image' ? (
                          // eslint-disable-next-line jsx-a11y/img-redundant-alt
                          <img
                            src={a.url}
                            alt={a.name || labels.attachmentImage}
                            data-testid="message-attachment-image"
                            className="max-h-40 rounded-xl border border-border object-contain"
                          />
                        ) : (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="message-attachment-doc"
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs underline ${
                              mine ? 'text-background/90' : 'text-foreground'
                            }`}
                          >
                            <span aria-hidden="true">📄</span>
                            <span className="max-w-[180px] truncate">
                              {a.name || labels.attachmentDoc}
                            </span>
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <time
                    dateTime={new Date(m.createdAt).toISOString()}
                    className={`font-mono text-xs ${
                      mine ? 'text-background/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(m.createdAt, locale)}
                  </time>
                  {mine && (
                    <span
                      className={`font-mono text-xs ${
                        mine ? 'text-background/70' : 'text-muted-foreground'
                      }`}
                      data-testid="message-receipt"
                      data-receipt={m.read ? 'read' : 'delivered'}
                    >
                      {m.read ? labels.read : labels.delivered}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {thread.isOfficeTyping && (
          <div
            className="flex justify-start"
            data-testid="thread-typing-indicator"
            aria-label={labels.typingAria}
            role="status"
          >
            <div className="flex items-center gap-1 rounded-2xl bg-foreground/10 px-3 py-2">
              <span className="dot-typing" />
              <span className="dot-typing dot-typing-delay-1" />
              <span className="dot-typing dot-typing-delay-2" />
              <span className="sr-only">{labels.typingAria}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dot-typing {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.4;
          animation: arsam-typing 1.2s infinite ease-in-out;
        }
        .dot-typing-delay-1 { animation-delay: 0.15s; }
        .dot-typing-delay-2 { animation-delay: 0.3s; }
        @keyframes arsam-typing {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40%           { opacity: 1;    transform: translateY(-2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dot-typing { animation: none; }
        }
      `}</style>
    </section>
  )
}
