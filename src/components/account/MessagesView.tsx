/**
 * MessagesView — /hesabim/mesajlar real-time mock island (Wave F9.B).
 *
 * Orchestrates:
 *   - thread list (left rail) — click switches activeThreadId
 *   - MessageThread (right pane) — renders messages + typing
 *   - MessageComposer — sends user messages
 *   - 5s polling loop — per-thread 15% deterministic chance to inject an
 *     office reply (seeded by threadId + tick bucket so reload-stable)
 *   - typing-indicator + read-receipts:
 *       · after user send → 2-5s random delay → office typing 2s → reply
 *       · open thread + 3s → markThreadAsRead
 *
 * locale via `<html lang>` (RootLayout sets en-US / tr-TR).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  EVENT_MESSAGES_CHANGED,
  type Message,
  type MessageAttachment,
  type Thread,
  addMockReply,
  getMessages,
  getThreads,
  hashString,
  markThreadAsRead,
  seedIfEmpty,
  sendMessage,
  setOfficeTyping,
  shouldInjectReply,
} from '../../lib/messages'
import MessageComposer from './MessageComposer'
import MessageThread from './MessageThread'

type Locale = 'tr' | 'en'

interface Labels {
  threadsTitle: string
  unreadBadge: (n: number) => string
  empty: string
  pickPrompt: string
  newMessageCta: string
  totalUnread: (n: number) => string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    threadsTitle: 'Konuşmalar',
    unreadBadge: (n) => `${n} okunmamış`,
    empty: 'Henüz mesajın yok.',
    pickPrompt: 'Bir konuşma seç.',
    newMessageCta: 'Yeni mesaj başlat',
    totalUnread: (n) =>
      n === 0 ? 'Tüm mesajların okundu.' : `${n} okunmamış mesajın var.`,
  },
  en: {
    threadsTitle: 'Conversations',
    unreadBadge: (n) => `${n} unread`,
    empty: 'No messages yet.',
    pickPrompt: 'Pick a conversation.',
    newMessageCta: 'Start a new message',
    totalUnread: (n) =>
      n === 0 ? 'All messages read.' : `${n} unread messages.`,
  },
}

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

const POLL_INTERVAL_MS = 5_000
const READ_RECEIPT_DELAY_MS = 3_000

interface MessagesViewProps {
  /**
   * Override polling interval / receipt delays for testing. Production
   * leaves them at the defaults above.
   */
  pollIntervalMs?: number
  readReceiptDelayMs?: number
  /** Disable the polling loop entirely (used in E2E for determinism). */
  disablePolling?: boolean
}

export default function MessagesView({
  pollIntervalMs = POLL_INTERVAL_MS,
  readReceiptDelayMs = READ_RECEIPT_DELAY_MS,
  disablePolling = false,
}: MessagesViewProps = {}) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const locale = useMemo<Locale>(() => detectLocale(), [])
  const labels = LABELS[locale]
  const replyTimerRef = useRef<number | null>(null)
  const typingTimerRef = useRef<number | null>(null)
  const receiptTimerRef = useRef<number | null>(null)
  const lastSeenTickRef = useRef<number>(0)

  // ── Initial seed + load ──
  useEffect(() => {
    seedIfEmpty()
    const initial = getThreads()
    setThreads(initial)
    if (initial.length > 0) {
      setActiveId(initial[0].id)
    }
  }, [])

  // ── Active-thread messages refresh ──
  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    setMessages(getMessages(activeId))
  }, [activeId])

  const refresh = useCallback(() => {
    setThreads(getThreads())
    if (activeId) setMessages(getMessages(activeId))
  }, [activeId])

  // ── Listen for cross-component storage changes ──
  useEffect(() => {
    function onChange() {
      refresh()
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'arsam.messages.v1') refresh()
    }
    window.addEventListener(EVENT_MESSAGES_CHANGED, onChange as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(
        EVENT_MESSAGES_CHANGED,
        onChange as EventListener,
      )
      window.removeEventListener('storage', onStorage)
    }
  }, [refresh])

  // ── Read-receipt: open thread + Nsn → markThreadAsRead ──
  useEffect(() => {
    if (!activeId) return
    if (receiptTimerRef.current !== null) {
      window.clearTimeout(receiptTimerRef.current)
    }
    receiptTimerRef.current = window.setTimeout(() => {
      markThreadAsRead(activeId)
      refresh()
    }, readReceiptDelayMs)
    return () => {
      if (receiptTimerRef.current !== null) {
        window.clearTimeout(receiptTimerRef.current)
        receiptTimerRef.current = null
      }
    }
  }, [activeId, readReceiptDelayMs, refresh])

  // ── 5sn polling loop with deterministic 15% per-thread reply injection ──
  useEffect(() => {
    if (disablePolling) return
    const id = window.setInterval(() => {
      const now = Date.now()
      const tickBucket = Math.floor(now / pollIntervalMs)
      // Guard against re-entrancy on the same tick bucket.
      if (tickBucket === lastSeenTickRef.current) return
      lastSeenTickRef.current = tickBucket
      const currentThreads = getThreads()
      let dirty = false
      for (const t of currentThreads) {
        if (shouldInjectReply(t.id, now)) {
          addMockReply(t.id, now)
          dirty = true
        }
      }
      if (dirty) refresh()
    }, pollIntervalMs)
    return () => window.clearInterval(id)
  }, [pollIntervalMs, disablePolling, refresh])

  // ── Send handler — schedules typing + scripted reply ──
  function handleSend(body: string, attachments: MessageAttachment[]) {
    if (!activeId) return
    sendMessage(activeId, body, attachments)
    refresh()

    // Schedule the office typing indicator + scripted reply. Deterministic-ish:
    // delay 2-5s seeded by threadId + body length so tests can stub the timer.
    const delayMs = 2_000 + (hashString(`${activeId}:${body.length}`) % 3_001) // 2000-5000
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
    }
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current)
    }
    typingTimerRef.current = window.setTimeout(() => {
      setOfficeTyping(activeId, true)
      refresh()
    }, delayMs)
    replyTimerRef.current = window.setTimeout(() => {
      addMockReply(activeId, Date.now())
      refresh()
    }, delayMs + 2_000)
  }

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current)
      if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current)
    }
  }, [])

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId],
  )
  const totalUnread = useMemo(
    () => threads.reduce((s, t) => s + t.unreadCount, 0),
    [threads],
  )

  if (threads.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        data-testid="messages-empty"
      >
        <span
          className="font-serif text-4xl font-normal text-muted-foreground"
          aria-hidden="true"
        >
          ✉
        </span>
        <h2 className="font-serif text-xl tracking-tight">{labels.empty}</h2>
        <a
          href="/iletisim"
          className="mt-2 inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {labels.newMessageCta} →
        </a>
      </div>
    )
  }

  return (
    <div
      className="grid gap-6 md:grid-cols-[280px,1fr]"
      data-testid="messages-view"
      data-total-unread={totalUnread}
    >
      <aside className="flex flex-col gap-2" data-testid="messages-sidebar">
        <header className="flex items-center justify-between px-1">
          <h2 className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {labels.threadsTitle}
          </h2>
          {totalUnread > 0 && (
            <span
              data-testid="messages-total-unread"
              className="rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-xs text-red-600 dark:text-red-300"
            >
              {labels.unreadBadge(totalUnread)}
            </span>
          )}
        </header>
        <ul
          className="flex flex-col gap-2 md:max-h-[640px] md:overflow-y-auto"
          data-testid="messages-thread-list"
        >
          {threads.map((t) => {
            const isActive = t.id === activeId
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  data-testid="messages-thread-row"
                  data-thread-id={t.id}
                  data-active={isActive ? 'true' : 'false'}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? 'border-foreground bg-card'
                      : 'border-border bg-card hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-serif text-sm tracking-tight">
                      {t.officeName}
                    </span>
                    {t.unreadCount > 0 && (
                      <span
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 font-mono text-xs tabular-nums text-background"
                        data-testid="messages-thread-unread-badge"
                      >
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  {t.listingTitle && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {t.listingTitle}
                    </p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <a
          href="/iletisim"
          className="mt-2 inline-flex items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
        >
          + {labels.newMessageCta}
        </a>
      </aside>

      <div className="flex flex-col gap-2">
        {activeThread ? (
          <>
            <MessageThread thread={activeThread} messages={messages} locale={locale} />
            <MessageComposer onSend={handleSend} locale={locale} />
          </>
        ) : (
          <div
            className="flex h-full min-h-[480px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground"
            data-testid="messages-pick-prompt"
          >
            {labels.pickPrompt}
          </div>
        )}
      </div>
    </div>
  )
}
