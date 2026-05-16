/**
 * TransactionDetail — /hesabim/islemler/[id] React island (client:only="react").
 *
 * `useListTransactions` already returns the full set; we filter by id rather
 * than introducing a new hook. Renders a single-record summary with reason,
 * type, amount, balance after, related listing link (if any) and timestamp.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useListTransactions, type WalletTransactionReason } from '@landx/data'

type Locale = 'tr' | 'en'

interface Dictionary {
  back: string
  notFound: string
  reason: Record<WalletTransactionReason, string>
  type: { credit: string; debit: string }
  detailHeading: string
  fieldId: string
  fieldType: string
  fieldReason: string
  fieldAmount: string
  fieldBalance: string
  fieldRelated: string
  fieldDate: string
  loading: string
}

const TR: Dictionary = {
  back: 'Tüm işlemlere dön',
  notFound: 'Bu işlem bulunamadı.',
  reason: {
    listing_publish: 'İlan yayınlama',
    listing_boost: 'Öne çıkarma',
    subscription: 'Abonelik',
    refund: 'İade',
    topup: 'Yükleme',
  },
  type: { credit: 'Yükleme/İade', debit: 'Harcama' },
  detailHeading: 'İşlem detayı',
  fieldId: 'İşlem no',
  fieldType: 'Tip',
  fieldReason: 'Sebep',
  fieldAmount: 'Tutar',
  fieldBalance: 'Sonraki bakiye',
  fieldRelated: 'İlgili ilan',
  fieldDate: 'Tarih',
  loading: 'Yükleniyor…',
}

const EN: Dictionary = {
  back: 'Back to all activity',
  notFound: 'Transaction not found.',
  reason: {
    listing_publish: 'Listing publish',
    listing_boost: 'Boost',
    subscription: 'Subscription',
    refund: 'Refund',
    topup: 'Top-up',
  },
  type: { credit: 'Top-up/Refund', debit: 'Spend' },
  detailHeading: 'Transaction detail',
  fieldId: 'Transaction id',
  fieldType: 'Type',
  fieldReason: 'Reason',
  fieldAmount: 'Amount',
  fieldBalance: 'Balance after',
  fieldRelated: 'Related listing',
  fieldDate: 'Date',
  loading: 'Loading…',
}

interface Props {
  locale: Locale
  txId: string
}

function Inner({ locale, txId }: Props) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''

  const { data, isLoading } = useListTransactions()
  const tx = (data ?? []).find((t) => t.id === txId)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {dict.loading}
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-serif text-lg text-foreground">{dict.notFound}</p>
        <a
          href={`${prefix}/hesabim/islemler`}
          className="mt-3 inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
        >
          {dict.back}
        </a>
      </div>
    )
  }

  const intl = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <div className="flex flex-col gap-4" data-transaction-detail={tx.id}>
      <div className="flex items-center justify-between print:hidden">
        <a
          href={`${prefix}/hesabim/islemler`}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
        >
          ← {dict.back}
        </a>
      </div>

      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-foreground">
            {dict.detailHeading}
          </h2>
          <span
            className={`font-mono tabular-nums text-2xl ${
              tx.type === 'credit'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-foreground'
            }`}
          >
            {tx.type === 'credit' ? '+' : '−'}
            {tx.amount}
          </span>
        </div>
        {tx.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{tx.description}</p>
        )}

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldId}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-foreground">{tx.id}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldType}
            </dt>
            <dd className="mt-1 text-foreground">{dict.type[tx.type]}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldReason}
            </dt>
            <dd className="mt-1 text-foreground">{dict.reason[tx.reason]}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldAmount}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-foreground">{tx.amount}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldBalance}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-foreground">{tx.balanceAfter}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.fieldDate}
            </dt>
            <dd className="mt-1 font-mono text-foreground">{intl.format(new Date(tx.createdAt))}</dd>
          </div>
          {tx.relatedListingId && (
            <div className="rounded-xl border border-border bg-background p-3 sm:col-span-2">
              <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {dict.fieldRelated}
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-foreground">
                {tx.relatedListingId}
              </dd>
            </div>
          )}
        </dl>
      </article>
    </div>
  )
}

export default function TransactionDetail(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
