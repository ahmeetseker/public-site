/**
 * InvoiceHistory — /hesabim/aboneliklerim React island (client:visible).
 *
 * Wave F7.B.
 *
 * Renders the latest 12 mock invoices from arsam.subscription.v1 as a table
 * (Tarih / Plan / Tutar / Durum / İndir). Subscribes to the
 * `arsam:subscription:changed` window event dispatched by SubscriptionPlans
 * so a fresh invoice shows up immediately after a plan upgrade — no page
 * reload required. Empty state mirrors the FavoritesList pattern.
 *
 * "İndir" is a stub: clicking it surfaces an alert "Yakında" (TR) / "Coming
 * soon" (EN). Real PDF generation is out of scope for the public-site SSG
 * build.
 */
import { useEffect, useState } from 'react'
import { getSubscription, type Invoice, type PlanTier } from '../../lib/subscription'
import { SUBSCRIPTION_CHANGED_EVENT } from './SubscriptionPlans'

interface InvoiceDictionary {
  heading: string
  emptyHeading: string
  emptyBody: string
  colDate: string
  colPlan: string
  colAmount: string
  colStatus: string
  colDownload: string
  statusPaid: string
  statusFailed: string
  downloadCta: string
  comingSoon: string
  planName: Record<PlanTier, string>
}

const TR: InvoiceDictionary = {
  heading: 'Fatura geçmişi',
  emptyHeading: 'Henüz fatura yok',
  emptyBody: 'Bir plana yükseldiğinde faturaların burada listelenir.',
  colDate: 'Tarih',
  colPlan: 'Plan',
  colAmount: 'Tutar',
  colStatus: 'Durum',
  colDownload: 'İndir',
  statusPaid: 'Ödendi',
  statusFailed: 'Başarısız',
  downloadCta: 'İndir',
  comingSoon: 'PDF indirme yakında aktif olacak.',
  planName: { free: 'Ücretsiz', pro: 'Pro', premium: 'Premium' },
}

const EN: InvoiceDictionary = {
  heading: 'Invoice history',
  emptyHeading: 'No invoices yet',
  emptyBody: 'Once you upgrade to a paid plan, your invoices will appear here.',
  colDate: 'Date',
  colPlan: 'Plan',
  colAmount: 'Amount',
  colStatus: 'Status',
  colDownload: 'Download',
  statusPaid: 'Paid',
  statusFailed: 'Failed',
  downloadCta: 'Download',
  comingSoon: 'PDF download will be available soon.',
  planName: { free: 'Free', pro: 'Pro', premium: 'Premium' },
}

function isEnglish(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/en/') || window.location.pathname === '/en'
}

function formatAmount(amount: number, locale: 'tr' | 'en'): string {
  if (locale === 'tr') {
    return `₺${new Intl.NumberFormat('tr-TR').format(amount)}`
  }
  return `₺${new Intl.NumberFormat('en-US').format(amount)}`
}

function formatDate(ts: number, locale: 'tr' | 'en'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toISOString().slice(0, 10)
  }
}

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<'tr' | 'en'>('tr')

  useEffect(() => {
    setLocale(isEnglish() ? 'en' : 'tr')
    const sync = () => {
      const sub = getSubscription()
      // Already newest-first per subscription.ts contract; defensive slice(0, 12).
      setInvoices(sub.invoiceHistory.slice(0, 12))
    }
    sync()
    setMounted(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'arsam.subscription.v1') sync()
    }
    const onChange = () => sync()
    window.addEventListener('storage', onStorage)
    window.addEventListener(SUBSCRIPTION_CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SUBSCRIPTION_CHANGED_EVENT, onChange)
    }
  }, [])

  const dict = locale === 'en' ? EN : TR

  if (!mounted) {
    return (
      <div
        data-invoice-history-loading=""
        className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground"
      >
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  return (
    <section
      data-invoice-history=""
      data-count={invoices.length}
      data-mounted="true"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="font-serif text-base tracking-tight">{dict.heading}</h2>
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {invoices.length}
        </span>
      </header>

      {invoices.length === 0 ? (
        <div
          data-invoice-history-empty=""
          className="flex flex-col items-start gap-1.5 px-5 py-8 text-sm text-muted-foreground"
        >
          <p className="font-serif text-base text-foreground">{dict.emptyHeading}</p>
          <p>{dict.emptyBody}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-foreground/[0.02] text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-mono font-normal">{dict.colDate}</th>
                <th className="px-5 py-2.5 font-mono font-normal">{dict.colPlan}</th>
                <th className="px-5 py-2.5 font-mono font-normal">{dict.colAmount}</th>
                <th className="px-5 py-2.5 font-mono font-normal">{dict.colStatus}</th>
                <th className="px-5 py-2.5 text-right font-mono font-normal">
                  {dict.colDownload}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  data-invoice-row={inv.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3 align-top text-foreground">
                    <div className="font-mono text-xs tabular-nums">{formatDate(inv.paidAt, locale)}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {inv.id}
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top">{dict.planName[inv.plan]}</td>
                  <td className="px-5 py-3 align-top font-mono tabular-nums">
                    {formatAmount(inv.amount, locale)}
                  </td>
                  <td className="px-5 py-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                          : 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      ></span>
                      {inv.status === 'paid' ? dict.statusPaid : dict.statusFailed}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right align-top">
                    <button
                      type="button"
                      data-invoice-download={inv.id}
                      onClick={() => {
                        // Stub: real PDF generation lives outside the SSG build.
                        if (typeof window !== 'undefined') window.alert(dict.comingSoon)
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-foreground/5"
                    >
                      {dict.downloadCta}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
