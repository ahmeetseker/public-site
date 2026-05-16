/**
 * SupportTickets — /hesabim/destek React island (client:visible).
 *
 * Wave F7.D.
 *
 * Reads `arsam.support-tickets.v1` and renders newest-first with status
 * badges. Clicking a ticket opens a detail modal with full fields, the mock
 * reply (if present), and close/sil actions. A top-right CTA opens the
 * CreateTicketDialog modal.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  EVENT_SUPPORT_TICKETS_CHANGED,
  getTickets,
  markAsClosed,
  removeTicket,
  type SupportTicket,
  type TicketCategory,
  type TicketStatus,
} from '../../lib/support-tickets'
import CreateTicketDialog from './CreateTicketDialog'

type Locale = 'tr' | 'en'

const LABELS = {
  tr: {
    newCta: 'Yeni talep oluştur',
    empty: 'Henüz destek talebiniz yok',
    emptyBody: 'Bir sorun olduğunda destek ekibimize buradan ulaşabilirsin.',
    emptyCta: 'Yeni talep oluştur',
    listLabel: 'Destek talepleri listesi',
    status: {
      open: 'Açık',
      answered: 'Yanıtlandı',
      closed: 'Kapalı',
    } as Record<TicketStatus, string>,
    cat: {
      hesap: 'Hesap',
      ilan: 'İlan',
      odeme: 'Ödeme',
      diger: 'Diğer',
    } as Record<TicketCategory, string>,
    detail: {
      title: 'Talep detayı',
      idLabel: 'No',
      categoryLabel: 'Kategori',
      statusLabel: 'Durum',
      createdLabel: 'Oluşturma',
      messageLabel: 'Mesaj',
      screenshotLabel: 'Ekran görüntüsü',
      replyHeading: 'Destek ekibimizden:',
      close: 'Kapat',
      markClosed: 'Talebi kapat',
      remove: 'Sil',
      confirmRemove: 'Bu talebi silmek istediğine emin misin?',
    },
  },
  en: {
    newCta: 'New ticket',
    empty: 'No support tickets yet',
    emptyBody: 'When something goes wrong, you can reach our support team here.',
    emptyCta: 'Create a ticket',
    listLabel: 'Support tickets list',
    status: {
      open: 'Open',
      answered: 'Answered',
      closed: 'Closed',
    } as Record<TicketStatus, string>,
    cat: {
      hesap: 'Account',
      ilan: 'Listing',
      odeme: 'Payment',
      diger: 'Other',
    } as Record<TicketCategory, string>,
    detail: {
      title: 'Ticket detail',
      idLabel: 'No',
      categoryLabel: 'Category',
      statusLabel: 'Status',
      createdLabel: 'Created',
      messageLabel: 'Message',
      screenshotLabel: 'Screenshot',
      replyHeading: 'From our support team:',
      close: 'Close',
      markClosed: 'Mark as closed',
      remove: 'Delete',
      confirmRemove: 'Are you sure you want to delete this ticket?',
    },
  },
} as const

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

function statusBadgeClass(status: TicketStatus): string {
  if (status === 'open') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300'
  }
  if (status === 'answered') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300'
  }
  return 'border-border bg-foreground/5 text-muted-foreground'
}

function formatDate(ts: number, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toISOString()
  }
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<Locale>('tr')
  const [createOpen, setCreateOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setLocale(detectLocale())
    setMounted(true)
    const sync = () => setTickets(getTickets())
    sync()
    window.addEventListener(EVENT_SUPPORT_TICKETS_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    // Re-poll periodically to catch the async mockReply setTimeout. The interval
    // is cheap (just a localStorage read) and stops as soon as no tickets are
    // pending. We don't rely on this for correctness — the storage event also
    // fires from writeRaw — but it keeps the UI in sync when the timer fires
    // on the same tab.
    const interval = window.setInterval(sync, 2000)
    return () => {
      window.removeEventListener(EVENT_SUPPORT_TICKETS_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
      window.clearInterval(interval)
    }
  }, [])

  const active = useMemo(
    () => tickets.find((t) => t.id === activeId) ?? null,
    [activeId, tickets],
  )

  const L = LABELS[locale]

  function handleClose(id: string) {
    markAsClosed(id)
  }

  function handleRemove(id: string) {
    if (!window.confirm(L.detail.confirmRemove)) return
    removeTicket(id)
    setActiveId(null)
  }

  if (!mounted) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
        data-support-tickets-loading=""
      >
        ...
      </div>
    )
  }

  return (
    <div data-support-tickets="" data-count={tickets.length}>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          data-support-new-cta=""
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {L.newCta}
        </button>
      </div>

      {tickets.length === 0 ? (
        <div
          data-support-empty=""
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        >
          <span
            className="font-serif text-4xl font-normal text-muted-foreground"
            aria-hidden="true"
          >
            ?
          </span>
          <h2 className="font-serif text-xl tracking-tight">{L.empty}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{L.emptyBody}</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            data-support-empty-cta=""
            className="mt-2 inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            {L.emptyCta} →
          </button>
        </div>
      ) : (
        <ul
          aria-label={L.listLabel}
          data-support-tickets-list=""
          className="flex flex-col gap-3"
        >
          {tickets.map((t) => (
            <li
              key={t.id}
              data-support-ticket={t.id}
              data-status={t.status}
              className="rounded-2xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                data-support-ticket-open={t.id}
                className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-foreground/5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 pb-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusBadgeClass(
                        t.status,
                      )}`}
                      data-support-status-badge={t.status}
                    >
                      {L.status[t.status]}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {L.cat[t.category]}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {t.id}
                    </span>
                  </div>
                  <div className="truncate font-serif text-base tracking-tight">
                    {t.subject}
                  </div>
                </div>
                <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {formatDate(t.createdAt, locale)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <CreateTicketDialog
        open={createOpen}
        locale={locale}
        onClose={() => setCreateOpen(false)}
      />

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
          data-support-ticket-detail={active.id}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setActiveId(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusBadgeClass(
                  active.status,
                )}`}
              >
                {L.status[active.status]}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {active.id}
              </span>
            </div>
            <h3
              id="ticket-detail-title"
              className="font-serif text-xl tracking-tight"
            >
              {active.subject}
            </h3>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.detail.categoryLabel}
                </dt>
                <dd className="text-sm">{L.cat[active.category]}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.detail.createdLabel}
                </dt>
                <dd className="text-sm">{formatDate(active.createdAt, locale)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {L.detail.messageLabel}
              </div>
              <p className="mt-1 whitespace-pre-line rounded-xl border border-border bg-foreground/[0.02] p-3 text-sm">
                {active.message}
              </p>
            </div>

            {active.screenshotUrl && (
              <div className="mt-4">
                <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.detail.screenshotLabel}
                </div>
                <a
                  href={active.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-all text-xs text-foreground underline underline-offset-2 hover:opacity-80"
                  data-support-ticket-screenshot=""
                >
                  {active.screenshotUrl}
                </a>
              </div>
            )}

            {active.mockReply && (
              <div
                className="mt-4 rounded-xl border border-border bg-foreground/[0.04] p-3"
                data-support-ticket-reply=""
              >
                <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.detail.replyHeading}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm italic text-muted-foreground">
                  {active.mockReply.body}
                </p>
                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {formatDate(active.mockReply.repliedAt, locale)}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {active.status !== 'closed' && (
                <button
                  type="button"
                  onClick={() => handleClose(active.id)}
                  data-support-ticket-close=""
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
                >
                  {L.detail.markClosed}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(active.id)}
                data-support-ticket-remove=""
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-500/15 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-300"
              >
                {L.detail.remove}
              </button>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                data-support-ticket-dismiss=""
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {L.detail.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
