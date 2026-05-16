/**
 * InvoiceView — /hesabim/odemeler/[id]/fatura React island (client:only="react").
 *
 * Resolves the payment id from URL (`?id=` would be tidier but we use the
 * dynamic segment via `paymentId` prop), looks up the matching `Payment`,
 * then loads its `Invoice` via `useGetInvoice(payment.invoiceId)`. Renders a
 * print-friendly invoice layout with line items, KDV row, total and a "Print"
 * action that calls `window.print()`. PDF download is a stub (alert) — real
 * PDF generation is out of scope for the SSG public-site.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useGetInvoice, useGetPayment, queryClient } from '@landx/data'
import { formatTL } from '@landx/ui/lib'

type Locale = 'tr' | 'en'

interface Dictionary {
  back: string
  invoiceNo: string
  issuedAt: string
  payment: string
  buyer: string
  taxId: string
  itemName: string
  itemQty: string
  itemUnit: string
  itemTotal: string
  subtotal: string
  vat: (rate: number) => string
  total: string
  printCta: string
  pdfCta: string
  pdfStub: string
  notFound: string
  noInvoice: string
  toAccount: string
  loading: string
}

const TR: Dictionary = {
  back: 'Ödemelere dön',
  invoiceNo: 'Fatura no',
  issuedAt: 'Düzenleme tarihi',
  payment: 'Ödeme',
  buyer: 'Alıcı',
  taxId: 'Vergi No',
  itemName: 'Açıklama',
  itemQty: 'Adet',
  itemUnit: 'Birim',
  itemTotal: 'Tutar',
  subtotal: 'Ara toplam',
  vat: (r) => `KDV (%${Math.round(r * 100)})`,
  total: 'Genel toplam',
  printCta: 'Yazdır',
  pdfCta: 'PDF indir',
  pdfStub: 'PDF indirme yakında aktif olacak.',
  notFound: 'Bu ödemeye ait fatura bulunamadı.',
  noInvoice: 'Bu ödeme için fatura henüz düzenlenmedi.',
  toAccount: 'Ödemelerime dön',
  loading: 'Yükleniyor…',
}

const EN: Dictionary = {
  back: 'Back to payments',
  invoiceNo: 'Invoice no',
  issuedAt: 'Issued at',
  payment: 'Payment',
  buyer: 'Buyer',
  taxId: 'Tax ID',
  itemName: 'Description',
  itemQty: 'Qty',
  itemUnit: 'Unit',
  itemTotal: 'Total',
  subtotal: 'Subtotal',
  vat: (r) => `VAT (${Math.round(r * 100)}%)`,
  total: 'Grand total',
  printCta: 'Print',
  pdfCta: 'Download PDF',
  pdfStub: 'PDF download will be available soon.',
  notFound: 'No invoice found for this payment.',
  noInvoice: 'No invoice has been issued for this payment yet.',
  toAccount: 'Back to my payments',
  loading: 'Loading…',
}

interface Props {
  locale: Locale
  paymentId: string
}

function Inner({ locale, paymentId }: Props) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''

  const { data: payment, isLoading: payLoading } = useGetPayment(paymentId)
  const invoiceId = payment?.invoiceId ?? ''
  const { data: invoice, isLoading: invLoading } = useGetInvoice(invoiceId)

  if (payLoading || (invoiceId && invLoading)) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {dict.loading}
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
          {dict.toAccount}
        </a>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-serif text-lg text-foreground">{dict.noInvoice}</p>
        <a
          href={`${prefix}/hesabim/odemeler`}
          className="mt-3 inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
        >
          {dict.toAccount}
        </a>
      </div>
    )
  }

  const intl = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'long',
  })

  return (
    <article
      data-invoice-view={invoice.id}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <a
          href={`${prefix}/hesabim/odemeler`}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
        >
          ← {dict.back}
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            {dict.printCta}
          </button>
          <button
            type="button"
            onClick={() => window.alert(dict.pdfStub)}
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            {dict.pdfCta}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              LandX
            </p>
            <h2 className="mt-1 font-serif text-2xl font-normal tracking-tight text-foreground">
              {dict.invoiceNo} {invoice.number}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {dict.issuedAt}: {intl.format(new Date(invoice.issuedAt))}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {dict.payment}: {payment.id}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {dict.buyer}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{invoice.buyerName}</p>
            {invoice.buyerTaxId && (
              <p className="font-mono text-xs text-muted-foreground">
                {dict.taxId}: {invoice.buyerTaxId}
              </p>
            )}
          </div>
        </header>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-mono font-normal">{dict.itemName}</th>
                <th className="py-2 px-3 text-right font-mono font-normal">{dict.itemQty}</th>
                <th className="py-2 px-3 text-right font-mono font-normal">{dict.itemUnit}</th>
                <th className="py-2 pl-3 text-right font-mono font-normal">{dict.itemTotal}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="py-3 pr-3 align-top text-foreground">{li.name}</td>
                  <td className="py-3 px-3 text-right align-top font-mono tabular-nums text-foreground">
                    {li.qty}
                  </td>
                  <td className="py-3 px-3 text-right align-top font-mono tabular-nums text-foreground">
                    {formatTL(li.unitPrice / 100)}
                  </td>
                  <td className="py-3 pl-3 text-right align-top font-mono tabular-nums text-foreground">
                    {formatTL((li.qty * li.unitPrice) / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 flex w-full max-w-xs flex-col gap-2 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{dict.subtotal}</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {formatTL(invoice.subtotal / 100)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{dict.vat(invoice.vatRate)}</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {formatTL(invoice.vatAmount / 100)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-2">
            <dt className="font-serif text-base text-foreground">{dict.total}</dt>
            <dd className="font-serif text-2xl font-normal tabular-nums text-foreground">
              {formatTL(invoice.total / 100)}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  )
}

export default function InvoiceView(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
