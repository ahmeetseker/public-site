/**
 * PaymentForm — /odeme React island (client:only="react").
 *
 * Wave F32 W1A.
 *
 * Reads `?plan=plus|pro|business` from the URL, looks up the matching plan via
 * `usePlans()`, renders a billing summary + payment method picker (card / bank
 * / wallet) + card form. On submit, calls `useCreatePayment()` and navigates to
 * `/odeme/basarili?id=<paymentId>` (or `/odeme/basarisiz` on failure).
 *
 * Card validation: Luhn check, MM/YY future, CVV 3 digits. Mock-only —
 * `useCreatePayment` always succeeds (the failure branch is reachable only by
 * removing the `cardMasked` field locally for the demo).
 *
 * Includes its own QueryClientProvider since the public-site app shell does
 * not host one — TanStack Query was added as part of Faz 1 and only billing
 * islands consume it for now.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  queryClient,
  usePlans,
  useCreatePayment,
  type Plan,
} from '@landx/data'
import { formatTL } from '@landx/ui/lib'

type Locale = 'tr' | 'en'
type Method = 'card' | 'bank' | 'wallet'

interface Dictionary {
  eyebrow: string
  title: string
  emphasis: string
  description: string
  summaryHeading: string
  cycleMonthly: string
  cycleYearly: string
  vatNote: string
  methodHeading: string
  method: Record<Method, string>
  methodDesc: Record<Method, string>
  cardNumber: string
  cardName: string
  cardExpiry: string
  cardCvv: string
  payNow: string
  paying: string
  errCardNumber: string
  errCardName: string
  errExpiry: string
  errCvv: string
  errPlan: string
  bankBody: string
  walletBody: string
  back: string
}

const TR: Dictionary = {
  eyebrow: 'ÖDEME · GÜVENLİ',
  title: 'Ödemeyi',
  emphasis: 'tamamlayın.',
  description: 'Kart bilgileriniz şifreli aktarılır, sunucumuzda saklanmaz.',
  summaryHeading: 'Sipariş özeti',
  cycleMonthly: 'aylık',
  cycleYearly: 'yıllık',
  vatNote: 'Tutara KDV dahildir.',
  methodHeading: 'Ödeme yöntemi',
  method: { card: 'Kredi/Banka kartı', bank: 'Havale/EFT', wallet: 'LandX Cüzdan' },
  methodDesc: {
    card: 'Visa · Mastercard · Troy',
    bank: 'IBAN ile manuel havale',
    wallet: 'Bakiyenizden düş',
  },
  cardNumber: 'Kart numarası',
  cardName: 'Kart üzerindeki isim',
  cardExpiry: 'AA/YY',
  cardCvv: 'CVV',
  payNow: 'Ödemeyi tamamla',
  paying: 'İşleniyor…',
  errCardNumber: 'Geçerli bir kart numarası girin.',
  errCardName: 'Kart üzerindeki ismi girin.',
  errExpiry: 'AA/YY formatında, gelecekteki bir tarih girin.',
  errCvv: 'CVV 3 haneli olmalıdır.',
  errPlan: 'Plan bulunamadı. /premium üzerinden tekrar seçin.',
  bankBody: 'Onay sonrası IBAN bilgileri e-postanıza gönderilir.',
  walletBody: 'Mevcut bakiyenizden tutar düşülür. Yetersiz bakiyede yükleme yönlendirilirsiniz.',
  back: 'Planları gör',
}

const EN: Dictionary = {
  eyebrow: 'PAYMENT · SECURE',
  title: 'Complete your',
  emphasis: 'payment.',
  description: 'Your card details are transmitted encrypted and never stored on our servers.',
  summaryHeading: 'Order summary',
  cycleMonthly: 'monthly',
  cycleYearly: 'yearly',
  vatNote: 'VAT included.',
  methodHeading: 'Payment method',
  method: { card: 'Credit/Debit card', bank: 'Wire/EFT', wallet: 'LandX Wallet' },
  methodDesc: {
    card: 'Visa · Mastercard · Troy',
    bank: 'Manual transfer via IBAN',
    wallet: 'Deduct from your balance',
  },
  cardNumber: 'Card number',
  cardName: 'Cardholder name',
  cardExpiry: 'MM/YY',
  cardCvv: 'CVV',
  payNow: 'Pay now',
  paying: 'Processing…',
  errCardNumber: 'Enter a valid card number.',
  errCardName: 'Enter the cardholder name.',
  errExpiry: 'Enter MM/YY in the future.',
  errCvv: 'CVV must be 3 digits.',
  errPlan: 'Plan not found. Please pick one from /premium.',
  bankBody: 'After confirmation, IBAN details will be emailed to you.',
  walletBody: 'Amount is deducted from your balance. Insufficient balance redirects to top-up.',
  back: 'See plans',
}

function luhn(num: string): boolean {
  const digits = num.replace(/\D/g, '').split('').reverse().map(Number)
  if (digits.length < 12) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function expiryValid(value: string): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const month = Number(m[1])
  const yearShort = Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expYear = 2000 + yearShort
  const expDate = new Date(expYear, month, 0, 23, 59, 59)
  return expDate.getTime() > now.getTime()
}

interface PaymentFormProps {
  locale: Locale
  initialPlan?: string
}

function Inner({ locale, initialPlan }: PaymentFormProps) {
  const dict = locale === 'en' ? EN : TR
  const prefix = locale === 'en' ? '/en' : ''

  const plansQuery = usePlans()
  const createPayment = useCreatePayment()

  const [method, setMethod] = useState<Method>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const plan: Plan | undefined = useMemo(() => {
    const all = plansQuery.data ?? []
    if (!all.length) return undefined
    if (initialPlan) {
      const byTier = all.find((p) => p.tier === initialPlan)
      if (byTier) return byTier
    }
    return all.find((p) => p.tier === 'plus') ?? all[0]
  }, [plansQuery.data, initialPlan])

  function validate(): boolean {
    if (method !== 'card') {
      setErrors({})
      return true
    }
    const next: Record<string, string> = {}
    if (!luhn(cardNumber)) next.cardNumber = dict.errCardNumber
    if (cardName.trim().length < 3) next.cardName = dict.errCardName
    if (!expiryValid(cardExpiry)) next.cardExpiry = dict.errExpiry
    if (!/^\d{3}$/.test(cardCvv)) next.cardCvv = dict.errCvv
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!plan) return
    if (!validate()) return

    try {
      const created = await createPayment.mutateAsync({
        amount: plan.monthlyPrice,
        method,
        description:
          locale === 'en'
            ? `${plan.name} membership — monthly`
            : `${plan.name} üyelik — aylık`,
        ...(method === 'card' && cardNumber.replace(/\D/g, '').length >= 4
          ? { cardMasked: `**** ${cardNumber.replace(/\D/g, '').slice(-4)}` }
          : {}),
      })
      window.location.assign(`${prefix}/odeme/basarili?id=${encodeURIComponent(created.id)}`)
    } catch {
      window.location.assign(`${prefix}/odeme/basarisiz`)
    }
  }

  if (plansQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-serif text-lg text-foreground">{dict.errPlan}</p>
        <a
          href={`${prefix}/premium`}
          className="mt-3 inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-foreground/5"
        >
          {dict.back}
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]" data-payment-form>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 md:p-6"
        noValidate
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {dict.methodHeading}
          </legend>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {(['card', 'bank', 'wallet'] as Method[]).map((m) => {
              const active = method === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  data-method={m}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left text-xs transition ${
                    active
                      ? 'border-foreground/30 bg-foreground/5'
                      : 'border-border bg-background hover:border-foreground/20'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">{dict.method[m]}</span>
                  <span className="text-xs text-muted-foreground">{dict.methodDesc[m]}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {method === 'card' && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {dict.cardNumber}
              </span>
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                aria-invalid={!!errors.cardNumber}
                aria-describedby={errors.cardNumber ? 'err-card-number' : undefined}
                className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm tabular-nums focus:border-foreground/40 focus:outline-none"
                placeholder="4242 4242 4242 4242"
              />
              {errors.cardNumber && (
                <span id="err-card-number" className="text-xs text-red-600 dark:text-red-400">
                  {errors.cardNumber}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {dict.cardName}
              </span>
              <input
                autoComplete="cc-name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                aria-invalid={!!errors.cardName}
                aria-describedby={errors.cardName ? 'err-card-name' : undefined}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground/40 focus:outline-none"
                placeholder="AHMET ŞEKER"
              />
              {errors.cardName && (
                <span id="err-card-name" className="text-xs text-red-600 dark:text-red-400">
                  {errors.cardName}
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {dict.cardExpiry}
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  aria-invalid={!!errors.cardExpiry}
                  aria-describedby={errors.cardExpiry ? 'err-card-expiry' : undefined}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm tabular-nums focus:border-foreground/40 focus:outline-none"
                  placeholder="12/29"
                />
                {errors.cardExpiry && (
                  <span id="err-card-expiry" className="text-xs text-red-600 dark:text-red-400">
                    {errors.cardExpiry}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {dict.cardCvv}
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  aria-invalid={!!errors.cardCvv}
                  aria-describedby={errors.cardCvv ? 'err-card-cvv' : undefined}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm tabular-nums focus:border-foreground/40 focus:outline-none"
                  placeholder="123"
                />
                {errors.cardCvv && (
                  <span id="err-card-cvv" className="text-xs text-red-600 dark:text-red-400">
                    {errors.cardCvv}
                  </span>
                )}
              </label>
            </div>
          </div>
        )}

        {method === 'bank' && (
          <p className="rounded-xl border border-border bg-foreground/[0.02] p-3 text-sm text-muted-foreground">
            {dict.bankBody}
          </p>
        )}

        {method === 'wallet' && (
          <p className="rounded-xl border border-border bg-foreground/[0.02] p-3 text-sm text-muted-foreground">
            {dict.walletBody}
          </p>
        )}

        <button
          type="submit"
          disabled={createPayment.isPending}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {createPayment.isPending ? dict.paying : `${dict.payNow} · ${formatTL(plan.monthlyPrice / 100)}`}
        </button>
      </form>

      <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {dict.summaryHeading}
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-serif text-2xl font-normal text-foreground">{plan.name}</span>
          <span className="font-mono text-xs uppercase text-muted-foreground">
            {dict.cycleMonthly}
          </span>
        </div>
        {plan.tagline && (
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>
        )}
        <div className="my-2 border-t border-border" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-foreground">{plan.name}</span>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {formatTL(plan.monthlyPrice / 100)}
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="font-serif text-base text-foreground">Toplam</span>
          <span className="font-serif text-2xl font-normal tabular-nums text-foreground">
            {formatTL(plan.monthlyPrice / 100)}
          </span>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{dict.vatNote}</p>
      </aside>
    </div>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner {...props} />
    </QueryClientProvider>
  )
}
