/**
 * TicketThread — /hesabim/destek/[id] island (Wave F32 W2A).
 *
 * Reads `useGetTicket(id)` and renders a chat-like message list with
 * destek/user bubbles. Reply textarea uses optimistic mutation via
 * `useReplyTicket`. Wraps a local QueryClientProvider since public-site
 * has no global one.
 */
import { useState, type FormEvent } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  queryClient,
  useGetTicket,
  useReplyTicket,
  type SupportTicket,
  type TicketMessage,
} from '@landx/data'

type Locale = 'tr' | 'en'

const LABELS = {
  tr: {
    backToList: '← Tüm taleplere dön',
    notFound: 'Bilet bulunamadı.',
    loading: 'Bilet yükleniyor…',
    closed: 'Bu bilet kapatıldı.',
    closeTicket: 'Bileti kapat',
    closing: 'Kapatılıyor…',
    placeholder: 'Yanıtını yaz…',
    send: 'Gönder',
    sending: 'Gönderiliyor…',
    statusBadge: { open: 'Açık', pending: 'Bekliyor', closed: 'Kapalı' } as Record<
      SupportTicket['status'],
      string
    >,
    priorityBadge: {
      low: 'Düşük',
      normal: 'Normal',
      high: 'Yüksek',
      urgent: 'Acil',
    } as Record<SupportTicket['priority'], string>,
    cats: {
      hesap: 'Hesap',
      odeme: 'Ödeme',
      ilan: 'İlan',
      guvenlik: 'Güvenlik',
      iletisim: 'İletişim',
      genel: 'Genel',
    } as Record<SupportTicket['category'], string>,
    systemTag: 'Sistem',
    supportTag: 'Destek',
    youTag: 'Sen',
  },
  en: {
    backToList: '← Back to all tickets',
    notFound: 'Ticket not found.',
    loading: 'Loading ticket…',
    closed: 'This ticket has been closed.',
    closeTicket: 'Close ticket',
    closing: 'Closing…',
    placeholder: 'Write your reply…',
    send: 'Send',
    sending: 'Sending…',
    statusBadge: { open: 'Open', pending: 'Pending', closed: 'Closed' } as Record<
      SupportTicket['status'],
      string
    >,
    priorityBadge: {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    } as Record<SupportTicket['priority'], string>,
    cats: {
      hesap: 'Account',
      odeme: 'Payment',
      ilan: 'Listing',
      guvenlik: 'Security',
      iletisim: 'Contact',
      genel: 'General',
    } as Record<SupportTicket['category'], string>,
    systemTag: 'System',
    supportTag: 'Support',
    youTag: 'You',
  },
} as const

const STATUS_TONES: Record<SupportTicket['status'], string> = {
  open: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  pending: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  closed: 'border-border bg-foreground/[0.06] text-muted-foreground',
}

const PRIORITY_TONES: Record<SupportTicket['priority'], string> = {
  low: 'border-border bg-card text-muted-foreground',
  normal: 'border-border bg-card text-muted-foreground',
  high: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  urgent: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

interface Props {
  ticketId: string
  backHref?: string
}

export default function TicketThread(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}

function Inner({ ticketId, backHref = '/hesabim/destek' }: Props) {
  const [locale] = useState<Locale>(() => detectLocale())
  const { data: ticket, isLoading } = useGetTicket(ticketId)
  const reply = useReplyTicket()
  const [text, setText] = useState('')
  const [closing, setClosing] = useState(false)

  const L = LABELS[locale]

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        {L.loading}
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm">
        <p className="font-serif text-lg">{L.notFound}</p>
        <a
          href={backHref}
          className="mt-3 inline-flex items-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {L.backToList}
        </a>
      </div>
    )
  }

  const isClosed = ticket.status === 'closed' || closing

  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  function send(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || isClosed) return
    reply.mutate(
      { ticketId, text: text.trim() },
      {
        onSuccess: () => setText(''),
      },
    )
  }

  function closeTicket() {
    if (isClosed) return
    setClosing(true)
    reply.mutate(
      {
        ticketId,
        text:
          locale === 'en'
            ? '[Ticket closed by user]'
            : '[Bilet kullanıcı tarafından kapatıldı]',
      },
      {
        onSettled: () => setClosing(false),
      },
    )
  }

  return (
    <div data-ticket-thread={ticket.id}>
      <a
        href={backHref}
        className="mb-3 inline-flex items-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {L.backToList}
      </a>

      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ' +
              STATUS_TONES[ticket.status]
            }
          >
            {L.statusBadge[ticket.status]}
          </span>
          <span
            className={
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ' +
              PRIORITY_TONES[ticket.priority]
            }
          >
            {L.priorityBadge[ticket.priority]}
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {L.cats[ticket.category]}
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {ticket.id}
          </span>
        </div>
        <h1 className="font-serif text-2xl tracking-tight md:text-3xl">
          {ticket.subject}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(ticket.createdAt)} · son güncelleme {formatDate(ticket.updatedAt)}
        </p>
      </header>

      <ul className="mt-5 flex flex-col gap-3" data-ticket-messages="">
        {ticket.messages.map((m) => (
          <MessageBubble key={m.id} message={m} locale={locale} formatDate={formatDate} />
        ))}
      </ul>

      <form
        onSubmit={send}
        className="mt-5 rounded-2xl border border-border bg-card p-4"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={isClosed}
          placeholder={isClosed ? L.closed : L.placeholder}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={closeTicket}
            disabled={isClosed}
            data-ticket-close=""
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {closing ? L.closing : L.closeTicket}
          </button>
          <button
            type="submit"
            disabled={!text.trim() || reply.isPending || isClosed}
            data-ticket-send=""
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {reply.isPending ? L.sending : L.send}
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
  locale,
  formatDate,
}: {
  message: TicketMessage
  locale: Locale
  formatDate: (iso: string) => string
}) {
  const L = LABELS[locale]
  const isUser = message.author === 'user'
  const isSystem = message.author === 'system'
  const tag = isSystem ? L.systemTag : isUser ? L.youTag : L.supportTag

  return (
    <li
      data-ticket-message={message.id}
      data-author={message.author}
      className={isUser ? 'flex justify-end' : 'flex justify-start'}
    >
      <div
        className={
          isUser
            ? 'max-w-[88%] rounded-2xl bg-foreground px-4 py-3 text-background'
            : isSystem
              ? 'max-w-[88%] rounded-2xl border border-border bg-foreground/[0.04] px-4 py-3 text-muted-foreground'
              : 'max-w-[88%] rounded-2xl border border-border bg-card px-4 py-3'
        }
      >
        <div
          className={
            isUser
              ? 'mb-1 flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70'
              : 'mb-1 flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground'
          }
        >
          <span>
            {tag} · {message.authorName}
          </span>
          <span>{formatDate(message.at)}</span>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{message.text}</p>
        {message.attachmentCount ? (
          <p
            className={
              isUser
                ? 'mt-1.5 font-mono text-xs uppercase tracking-[0.12em] opacity-80'
                : 'mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground'
            }
          >
            {message.attachmentCount} eklenti
          </p>
        ) : null}
      </div>
    </li>
  )
}
