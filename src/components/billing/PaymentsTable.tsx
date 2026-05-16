/**
 * PaymentsTable — /hesabim/odemeler React island (client:only="react").
 *
 * Lists all individual payments via `useListPayments`, with status filter
 * (success / pending / failed / refunded). Mobile (<640px) renders a card list;
 * desktop renders a sortable table. Each row links to the matching invoice
 * route when `invoiceId` exists.
 *
 * Pagination is intentionally simple — 8 per page for consistency with the
 * other account tables.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  queryClient,
  useListPayments,
  type Payment,
  type PaymentStatus,
} from '@landx/data'
import { formatTL } from '@landx/ui/lib'

type Locale = 'tr' | 'en'

const PAGE_SIZE = 8

interface Dictionary {
  empty: string
  emptyBody: string
  filterAll: string
  status: Record<PaymentStatus, string>
  method: Record<Payment['method'], string>
  colDate: string
  colDescription: string
  colAmount: string
  colStatus: string
  colInvoice: string
  download: string
  noInvoice: string
  prev: string
  next: string
  pageOf: (current: number, total: number) => string
}

const TR: Dictionary = {
  empty: 'Henüz ödeme yok',
  emptyBody: 'Bir plana abone olduğunuzda veya ilan öne çıkardığınızda burada listelenir.',
  filterAll: 'Tümü',
  status: {
    success: 'Başarılı',
    pending: 'Bekliyor',
    failed: 'Başarısız',
    refunded: 'İade edildi',
  },
  method: { card: 'Kart', bank: 'Havale', wallet: 'Cüzdan' },
  colDate: 'Tarih',
  colDescription: 'Açıklama',
  colAmount: 'Tutar',
  colStatus: 'Durum',
  colInvoice: 'Fatura',
  download: 'Görüntüle',
  noInvoice: '—',
  prev: 'Önceki',
  next: 'Sonraki',
  pageOf: (c, t) => `Sayfa ${c} / ${t}`,
}

const EN: Dictionary = {
  empty: 'No payments yet',
  emptyBody: 'Once you subscribe or boost a listing, you will see entries here.',
  filterAll: 'All',
  status: {
    success: 'Success',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
  },
  method: { card: 'Card', bank: 'Wire', wallet: 'Wallet' },
  colDate: 'Date',
  colDescription: 'Description',
  colAmount: 'Amount',
  colStatus: 'Status',
  colInvoice: 'Invoice',
  download: 'View',
  noInvoice: '—',
  prev: 'Previous',
  next: 'Next',
  pageOf: (c, t) => `Page ${c} / ${t}`,
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  pending: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  failed: 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  refunded: 'bg-slate-500/10 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300',
}

interface Props {
  locale: Locale
}

function Inner({ locale }: Props) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useListPayments(
    statusFilter === 'all' ? {} : { status: statusFilter },
  )

  const list = data ?? []
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page],
  )

  const intl = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'medium',
  })

  const filters: Array<PaymentStatus | 'all'> = [
    'all',
    'success',
    'pending',
    'failed',
    'refunded',
  ]

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  return (
    <section
      data-payments-table=""
      data-count={list.length}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = statusFilter === f
          const label = f === 'all' ? dict.filterAll : dict.status[f]
          return (
            <button
              key={f}
              type="button"
              onClick={() => {
                setStatusFilter(f)
                setPage(1)
              }}
              data-filter={f}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-foreground/30 bg-foreground/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
          <p className="font-serif text-base text-foreground">{dict.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dict.emptyBody}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards (<640px) */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {pageRows.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{p.description}</span>
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatTL(p.amount / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">{intl.format(new Date(p.createdAt))}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status]}`}
                  >
                    {dict.status[p.status]}
                  </span>
                </div>
                {p.invoiceId && (
                  <a
                    href={`${prefix}/hesabim/odemeler/${encodeURIComponent(p.id)}/fatura`}
                    className="self-start rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-foreground/5"
                  >
                    {dict.download}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table (>=640px) */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-foreground/[0.02] text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colDate}</th>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colDescription}</th>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colAmount}</th>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colStatus}</th>
                  <th className="px-4 py-2.5 text-right font-mono font-normal">{dict.colInvoice}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr
                    key={p.id}
                    data-payment-row={p.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-mono text-xs tabular-nums text-foreground">
                        {intl.format(new Date(p.createdAt))}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {p.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-foreground">
                      {p.description}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {dict.method[p.method]}
                        {p.cardMasked && (
                          <span className="ml-1.5 font-mono">{p.cardMasked}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-mono tabular-nums text-foreground">
                      {formatTL(p.amount / 100)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status]}`}
                      >
                        {dict.status[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {p.invoiceId ? (
                        <a
                          href={`${prefix}/hesabim/odemeler/${encodeURIComponent(p.id)}/fatura`}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-foreground/5"
                        >
                          {dict.download}
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">{dict.noInvoice}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-foreground/5"
              >
                {dict.prev}
              </button>
              <span className="font-mono text-xs text-muted-foreground">
                {dict.pageOf(page, totalPages)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-foreground/5"
              >
                {dict.next}
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

export default function PaymentsTable(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
