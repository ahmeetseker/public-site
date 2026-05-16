/**
 * VerificationStatusList — `/hesabim/dogrulama` island.
 *
 * Wave F32 / W3A. 3 doğrulama tipi yan yana: durum badge + son güncelleme +
 * "Yeniden başlat" CTA. `useGetVerificationStatus` + `useStartVerification`.
 */
import { useTransition } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Mail, Phone, IdCard, CheckCircle2, AlertCircle, Clock, RefreshCw } from '@landx/icons'
import { useGetVerificationStatus, useStartVerification } from '@landx/data'
import type { VerificationRequest, VerificationStatus, VerificationType } from '@landx/data'

interface Props {
  locale?: 'tr' | 'en'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const LABELS = {
  tr: {
    types: { email: 'E-posta', phone: 'Telefon', identity: 'Kimlik' },
    statuses: { pending: 'Beklemede', verified: 'Doğrulandı', rejected: 'Reddedildi' },
    target: 'Hedef',
    sentAt: 'Gönderim',
    verifiedAt: 'Doğrulama',
    restart: 'Yeniden başlat',
    starting: 'Başlatılıyor…',
    empty: 'Henüz bir doğrulama başlatılmadı.',
    startFirst: '/dogrula sayfasından başlat',
    loading: 'Yükleniyor…',
    rejectionReason: 'Sebep',
  },
  en: {
    types: { email: 'Email', phone: 'Phone', identity: 'Identity' },
    statuses: { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' },
    target: 'Target',
    sentAt: 'Sent',
    verifiedAt: 'Verified',
    restart: 'Restart',
    starting: 'Starting…',
    empty: 'No verifications started yet.',
    startFirst: 'Start from /dogrula',
    loading: 'Loading…',
    rejectionReason: 'Reason',
  },
}

function getMaskedTarget(type: VerificationType): string {
  if (type === 'email') return 'us***@arsam.net'
  if (type === 'phone') return '+90 *** *** 00 00'
  return 'TC *** *** 0000'
}

function StatusBadge({ status, locale }: { status: VerificationStatus; locale: 'tr' | 'en' }) {
  const labels = LABELS[locale].statuses
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        {labels.verified}
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
        <AlertCircle className="h-3 w-3" />
        {labels.rejected}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
      <Clock className="h-3 w-3" />
      {labels.pending}
    </span>
  )
}

function StatusBody({ locale }: Required<Props>) {
  const labels = LABELS[locale]
  const [, startTransition] = useTransition()
  const { data, isPending } = useGetVerificationStatus()
  const startMutation = useStartVerification()

  if (isPending) {
    return (
      <div role="status" aria-busy="true" className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-40 rounded-2xl bg-foreground/5" />
        <div className="h-40 rounded-2xl bg-foreground/5" />
        <div className="h-40 rounded-2xl bg-foreground/5" />
      </div>
    )
  }

  // Birleştirilmiş tip-bazlı son durum (en yeni request öncelikli)
  const TYPES: VerificationType[] = ['email', 'phone', 'identity']
  const ICONS = { email: Mail, phone: Phone, identity: IdCard } as const

  const byType = TYPES.map((type) => {
    const requests = (data ?? []).filter((r) => r.type === type)
    const latest = requests.sort(
      (a: VerificationRequest, b: VerificationRequest) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    )[0]
    return { type, latest }
  })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="verification-status-list">
      {byType.map(({ type, latest }) => {
        const Icon = ICONS[type]
        const status = latest?.status ?? null
        return (
          <div
            key={type}
            data-testid={`verification-status-${type}`}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base tracking-tight">{labels.types[type]}</h3>
              </div>
              {status && <StatusBadge status={status} locale={locale} />}
            </div>

            {latest ? (
              <dl className="space-y-1 text-xs">
                {latest.targetMasked && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{labels.target}</dt>
                    <dd className="font-mono tabular-nums">{latest.targetMasked}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{labels.sentAt}</dt>
                  <dd className="font-mono tabular-nums">
                    {new Date(latest.sentAt).toLocaleDateString(
                      locale === 'en' ? 'en-US' : 'tr-TR',
                    )}
                  </dd>
                </div>
                {latest.verifiedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{labels.verifiedAt}</dt>
                    <dd className="font-mono tabular-nums">
                      {new Date(latest.verifiedAt).toLocaleDateString(
                        locale === 'en' ? 'en-US' : 'tr-TR',
                      )}
                    </dd>
                  </div>
                )}
                {latest.rejectionReason && (
                  <div className="rounded-md bg-rose-500/5 px-2 py-1 text-xs text-rose-700 dark:text-rose-300">
                    {labels.rejectionReason}: {latest.rejectionReason}
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">{labels.empty}</p>
            )}

            <button
              type="button"
              data-testid={`verification-restart-${type}`}
              disabled={startMutation.isPending}
              onClick={() => {
                startTransition(() => {
                  startMutation.mutate({ type, targetMasked: getMaskedTarget(type) })
                })
              }}
              className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-foreground/5 disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              {startMutation.isPending ? labels.starting : labels.restart}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function VerificationStatusList({ locale = 'tr' }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBody locale={locale} />
    </QueryClientProvider>
  )
}
