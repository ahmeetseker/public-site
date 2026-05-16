/**
 * VerificationStartIsland — `/dogrula` start verification flow.
 *
 * Wave F32 / W3A. 3 seçenek kart (Email | Telefon | Kimlik). Tıklayınca
 * OTP modal açılır (mock 6 dijit). React 19 `useActionState` form submit +
 * error + pending tek state.
 */
import { useActionState, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Mail, Phone, IdCard, ShieldCheck, X } from '@landx/icons'
import { useStartVerification } from '@landx/data'
import OtpInput from './OtpInput'

interface Props {
  locale?: 'tr' | 'en'
}

type VerificationType = 'email' | 'phone' | 'identity'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const LABELS = {
  tr: {
    eyebrow: 'HESAP · DOĞRULAMA',
    heading: 'Hesabını',
    headingEm: 'doğrula',
    desc: 'Üç farklı yöntemle hesabını doğrula. Doğrulanmış kullanıcılar için ilanlar daha üst sırada görünür.',
    optionEmail: 'E-posta',
    optionEmailDesc: 'Kayıtlı e-posta adresine 6 haneli kod gönderilir.',
    optionPhone: 'Telefon',
    optionPhoneDesc: 'Telefonuna SMS ile 6 haneli kod gönderilir.',
    optionIdentity: 'Kimlik',
    optionIdentityDesc: 'TC Kimlik No ile manuel inceleme başlat.',
    cta: 'Başlat',
    modalTitle: (t: string) => `${t} doğrulama`,
    modalDesc: '6 haneli kodu gir veya yapıştır. (Mock — herhangi bir kod kabul edilir.)',
    submit: 'Doğrula',
    submitting: 'Doğrulanıyor…',
    success: 'Doğrulama başarılı! Durumun güncellendi.',
    error: 'Bir hata oluştu, tekrar dene.',
    close: 'Kapat',
    invalid: 'Lütfen 6 haneli kodu eksiksiz gir.',
  },
  en: {
    eyebrow: 'ACCOUNT · VERIFICATION',
    heading: 'Verify your',
    headingEm: 'account',
    desc: 'Verify your account with three options. Verified users get higher visibility on listings.',
    optionEmail: 'Email',
    optionEmailDesc: 'Receive a 6-digit code at your registered email.',
    optionPhone: 'Phone',
    optionPhoneDesc: 'Receive a 6-digit SMS code on your phone.',
    optionIdentity: 'Identity',
    optionIdentityDesc: 'Start a manual review with your national ID.',
    cta: 'Start',
    modalTitle: (t: string) => `${t} verification`,
    modalDesc: 'Enter or paste the 6-digit code. (Mock — any code is accepted.)',
    submit: 'Verify',
    submitting: 'Verifying…',
    success: 'Verification successful! Status updated.',
    error: 'An error occurred, please try again.',
    close: 'Close',
    invalid: 'Please enter the full 6-digit code.',
  },
}

interface FormState {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

const initialFormState: FormState = { status: 'idle', message: null }

function VerificationFlow({ locale }: Required<Props>) {
  const labels = LABELS[locale]
  const [openType, setOpenType] = useState<VerificationType | null>(null)
  const [otpValue, setOtpValue] = useState('')
  const startMutation = useStartVerification()

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const code = String(formData.get('otp') ?? '')
      if (code.length !== 6) {
        return { status: 'error', message: labels.invalid }
      }
      const type = formData.get('type') as VerificationType
      try {
        await startMutation.mutateAsync({ type, targetMasked: getMaskedTarget(type) })
        return { status: 'success', message: labels.success }
      } catch {
        return { status: 'error', message: labels.error }
      }
    },
    initialFormState,
  )

  const closeModal = () => {
    setOpenType(null)
    setOtpValue('')
  }

  const OPTIONS = [
    {
      type: 'email' as const,
      icon: Mail,
      title: labels.optionEmail,
      desc: labels.optionEmailDesc,
    },
    {
      type: 'phone' as const,
      icon: Phone,
      title: labels.optionPhone,
      desc: labels.optionPhoneDesc,
    },
    {
      type: 'identity' as const,
      icon: IdCard,
      title: labels.optionIdentity,
      desc: labels.optionIdentityDesc,
    },
  ]

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 md:py-16" data-testid="verification-start-island">
      <header className="mb-10 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {labels.eyebrow}
        </span>
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
          {labels.heading}{' '}
          <em className="font-normal italic text-muted-foreground">{labels.headingEm}</em>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{labels.desc}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {OPTIONS.map(({ type, icon: Icon, title, desc }) => (
          <button
            key={type}
            type="button"
            data-testid={`verification-option-${type}`}
            onClick={() => setOpenType(type)}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-5 text-left backdrop-blur-sm transition hover:border-foreground/30 hover:bg-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 transition group-hover:bg-foreground/10">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg tracking-tight">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
              <ShieldCheck className="h-3 w-3" />
              {labels.cta}
            </span>
          </button>
        ))}
      </div>

      {openType && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-modal-title"
            data-testid="verification-otp-modal"
            className="fixed left-1/2 top-1/2 z-[61] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label={labels.close}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id="verification-modal-title"
              className="mb-2 font-serif text-xl tracking-tight"
            >
              {labels.modalTitle(
                openType === 'email'
                  ? labels.optionEmail
                  : openType === 'phone'
                  ? labels.optionPhone
                  : labels.optionIdentity,
              )}
            </h2>
            <p className="mb-6 text-xs leading-relaxed text-muted-foreground">{labels.modalDesc}</p>

            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="type" value={openType} />
              <input type="hidden" name="otp" value={otpValue} />
              <OtpInput onChange={setOtpValue} disabled={pending} />

              {state.status === 'error' && state.message && (
                <p
                  role="alert"
                  data-testid="verification-error"
                  className="text-center text-xs text-rose-600 dark:text-rose-300"
                >
                  {state.message}
                </p>
              )}
              {state.status === 'success' && state.message && (
                <p
                  role="status"
                  data-testid="verification-success"
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-700 dark:text-emerald-300"
                >
                  {state.message}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                data-testid="verification-submit"
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {pending ? labels.submitting : labels.submit}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function getMaskedTarget(type: VerificationType): string {
  if (type === 'email') return 'us***@arsam.net'
  if (type === 'phone') return '+90 *** *** 00 00'
  return 'TC *** *** 0000'
}

export default function VerificationStartIsland({ locale = 'tr' }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <VerificationFlow locale={locale} />
    </QueryClientProvider>
  )
}
