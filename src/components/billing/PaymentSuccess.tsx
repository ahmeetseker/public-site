/**
 * PaymentSuccess — /odeme/basarili React island (client:only="react").
 *
 * Reads `?id=<paymentId>` from the URL, fetches via `useGetPayment`, renders a
 * success card with details + CTAs ("Hesabıma git", "Fatura indir" stub).
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { queryClient, useGetPayment } from '@landx/data'
import { formatTL } from '@landx/ui/lib'

type Locale = 'tr' | 'en'

interface Dictionary {
  eyebrow: string
  title: string
  emphasis: string
  description: string
  paymentNo: string
  method: string
  amount: string
  status: string
  invoice: string
  toAccount: string
  downloadInvoice: string
  noInvoice: string
  comingSoon: string
  noId: string
  notFound: string
  back: string
  methodLabels: { card: string; bank: string; wallet: string }
}

const TR: Dictionary = {
  eyebrow: 'ÖDEME · ALINDI',
  title: 'Teşekkürler,',
  emphasis: 'ödeme başarılı.',
  description: 'Üyeliğiniz aktif. Hesabınızdan plan detaylarını ve faturalarınızı görebilirsiniz.',
  paymentNo: 'Ödeme no',
  method: 'Yöntem',
  amount: 'Tutar',
  status: 'Durum',
  invoice: 'Fatura',
  toAccount: 'Hesabıma git',
  downloadInvoice: 'Fatura indir',
  noInvoice: 'Fatura hazırlanıyor',
  comingSoon: 'PDF indirme yakında aktif olacak.',
  noId: 'Ödeme kimliği bulunamadı.',
  notFound: 'Bu ödeme kaydı bulunamadı.',
  back: 'Hesabıma dön',
  methodLabels: { card: 'Kredi kartı', bank: 'Havale/EFT', wallet: 'LandX Cüzdan' },
}

const EN: Dictionary = {
  eyebrow: 'PAYMENT · RECEIVED',
  title: 'Thank you,',
  emphasis: 'payment successful.',
  description: 'Your membership is active. You can review plan details and invoices in your account.',
  paymentNo: 'Payment no',
  method: 'Method',
  amount: 'Amount',
  status: 'Status',
  invoice: 'Invoice',
  toAccount: 'Go to my account',
  downloadInvoice: 'Download invoice',
  noInvoice: 'Invoice is being prepared',
  comingSoon: 'PDF download will be available soon.',
  noId: 'Payment id is missing.',
  notFound: 'This payment could not be found.',
  back: 'Back to account',
  methodLabels: { card: 'Card', bank: 'Wire/EFT', wallet: 'LandX Wallet' },
}

interface Props {
  locale: Locale
}

function readId(): string | null {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  return sp.get('id')
}

function Inner({ locale }: Props) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''
  const [id, setId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setId(readId())
    setMounted(true)
  }, [])

  const { data: payment, isLoading } = useGetPayment(id ?? '')

  if (!mounted || isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  if (!id) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-serif text-lg text-foreground">{dict.noId}</p>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-serif text-lg text-foreground">{dict.notFound}</p>
        <a
          href={`${prefix}/hesabim/odemeler`}
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
    <div className="grid gap-5 md:grid-cols-[1fr_320px]" data-payment-success={payment.id}>
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          {dict.eyebrow}
        </div>
        <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground md:text-4xl">
          {dict.title}{' '}
          <em className="font-serif italic font-normal text-foreground/70">{dict.emphasis}</em>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{dict.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.paymentNo}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-foreground">{payment.id}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.method}
            </dt>
            <dd className="mt-1 text-foreground">
              {dict.methodLabels[payment.method]}
              {payment.cardMasked && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {payment.cardMasked}
                </span>
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.amount}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-foreground">
              {formatTL(payment.amount / 100)}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.status}
            </dt>
            <dd className="mt-1 text-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {payment.status}
              </span>
            </dd>
          </div>
        </dl>

        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {intl.format(new Date(payment.createdAt))}
        </p>
      </article>

      <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
        <a
          href={`${prefix}/hesabim`}
          className="inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          {dict.toAccount}
        </a>
        {payment.invoiceId ? (
          <a
            href={`${prefix}/hesabim/odemeler/${encodeURIComponent(payment.id)}/fatura`}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5"
          >
            {dict.downloadInvoice}
          </a>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-foreground/[0.02] p-3 text-xs text-muted-foreground">
            {dict.noInvoice}
          </p>
        )}
      </aside>
    </div>
  )
}

export default function PaymentSuccess(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
