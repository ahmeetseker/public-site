/**
 * TransactionsList — /hesabim/islemler React island (client:only="react").
 *
 * Lists wallet transactions via `useListTransactions`, with a credit/debit
 * filter. Latest balance (from the most recent record) is rendered in a hero
 * card. Each row links to /hesabim/islemler/[id].
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  queryClient,
  useListTransactions,
  type WalletTransaction,
  type WalletTransactionReason,
  type WalletTransactionType,
} from '@landx/data'

type Locale = 'tr' | 'en'

interface Dictionary {
  balanceLabel: string
  balanceUnit: string
  filterAll: string
  filterCredit: string
  filterDebit: string
  empty: string
  emptyBody: string
  reason: Record<WalletTransactionReason, string>
  type: Record<WalletTransactionType, string>
  colDate: string
  colDescription: string
  colAmount: string
  colBalance: string
  view: string
}

const TR: Dictionary = {
  balanceLabel: 'Mevcut bakiye',
  balanceUnit: 'kredi',
  filterAll: 'Tümü',
  filterCredit: 'Yükleme/iade',
  filterDebit: 'Harcama',
  empty: 'Henüz kredi hareketi yok',
  emptyBody: 'Kredi yükleyince veya kullanınca bu sayfada görünür.',
  reason: {
    listing_publish: 'İlan yayınlama',
    listing_boost: 'Öne çıkarma',
    subscription: 'Abonelik',
    refund: 'İade',
    topup: 'Yükleme',
  },
  type: { credit: 'Yükleme', debit: 'Harcama' },
  colDate: 'Tarih',
  colDescription: 'Açıklama',
  colAmount: 'Tutar',
  colBalance: 'Bakiye',
  view: 'Detay',
}

const EN: Dictionary = {
  balanceLabel: 'Current balance',
  balanceUnit: 'credits',
  filterAll: 'All',
  filterCredit: 'Top-up/refund',
  filterDebit: 'Spend',
  empty: 'No wallet activity yet',
  emptyBody: 'Once you top up or spend credits, entries will appear here.',
  reason: {
    listing_publish: 'Listing publish',
    listing_boost: 'Boost',
    subscription: 'Subscription',
    refund: 'Refund',
    topup: 'Top-up',
  },
  type: { credit: 'Top-up', debit: 'Spend' },
  colDate: 'Date',
  colDescription: 'Description',
  colAmount: 'Amount',
  colBalance: 'Balance',
  view: 'Detail',
}

interface Props {
  locale: Locale
}

function Inner({ locale }: Props) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''
  const [filter, setFilter] = useState<'all' | WalletTransactionType>('all')

  const { data, isLoading } = useListTransactions()
  const list: WalletTransaction[] = data ?? []

  const filtered = useMemo(
    () => (filter === 'all' ? list : list.filter((t) => t.type === filter)),
    [list, filter],
  )

  const balance = list[0]?.balanceAfter ?? 0

  const intl = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'medium',
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  return (
    <section
      data-transactions-list=""
      data-count={filtered.length}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {dict.balanceLabel}
        </span>
        <span className="font-serif text-4xl font-normal tabular-nums text-foreground">
          {balance.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}{' '}
          <span className="font-mono text-sm text-muted-foreground">{dict.balanceUnit}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'credit', 'debit'] as const).map((f) => {
          const active = filter === f
          const label =
            f === 'all' ? dict.filterAll : f === 'credit' ? dict.filterCredit : dict.filterDebit
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
          <p className="font-serif text-base text-foreground">{dict.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dict.emptyBody}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {filtered.map((t) => (
              <li key={t.id} className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={`${prefix}/hesabim/islemler/${encodeURIComponent(t.id)}`}
                    className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {t.description ?? dict.reason[t.reason]}
                  </a>
                  <span
                    className={`font-mono tabular-nums text-sm ${
                      t.type === 'credit'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-foreground'
                    }`}
                  >
                    {t.type === 'credit' ? '+' : '−'}
                    {t.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">{intl.format(new Date(t.createdAt))}</span>
                  <span>{dict.reason[t.reason]}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-foreground/[0.02] text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colDate}</th>
                  <th className="px-4 py-2.5 font-mono font-normal">{dict.colDescription}</th>
                  <th className="px-4 py-2.5 text-right font-mono font-normal">{dict.colAmount}</th>
                  <th className="px-4 py-2.5 text-right font-mono font-normal">{dict.colBalance}</th>
                  <th className="px-4 py-2.5 text-right font-mono font-normal">{dict.view}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    data-tx-row={t.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-mono text-xs tabular-nums text-foreground">
                        {intl.format(new Date(t.createdAt))}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">{t.id}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-foreground">
                      {t.description ?? dict.reason[t.reason]}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {dict.reason[t.reason]}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right align-top font-mono tabular-nums text-sm ${
                        t.type === 'credit'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-foreground'
                      }`}
                    >
                      {t.type === 'credit' ? '+' : '−'}
                      {t.amount}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-mono tabular-nums text-foreground">
                      {t.balanceAfter}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <a
                        href={`${prefix}/hesabim/islemler/${encodeURIComponent(t.id)}`}
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-foreground/5"
                      >
                        {dict.view}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default function TransactionsList(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
