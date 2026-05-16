/**
 * NotificationPrefMatrix — `/hesabim/bildirim-tercihleri` island.
 *
 * Wave F32 / W3A. Matrix: satır olay tipi (8), sütun kanal (Email/Push/SMS),
 * hücre toggle. React 19 `useOptimistic` ile anlık UI + mutation arkada.
 */
import { useOptimistic, useTransition } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Mail, Bell, MessageSquare } from '@landx/icons'
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@landx/data'
import type {
  NotificationChannel,
  NotificationEventType,
  NotificationPrefs,
} from '@landx/data'

interface Props {
  locale?: 'tr' | 'en'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const EVENT_TYPES: NotificationEventType[] = [
  'new_message',
  'listing_view',
  'price_change',
  'favorite',
  'appointment',
  'offer',
  'payment',
  'security',
]

const CHANNELS: NotificationChannel[] = ['email', 'push', 'sms']

const LABELS = {
  tr: {
    eventTypes: {
      new_message: 'Yeni mesaj',
      listing_view: 'İlan görüntüleme',
      price_change: 'Fiyat değişimi',
      favorite: 'Favori güncellemesi',
      appointment: 'Randevu',
      offer: 'Teklif',
      payment: 'Ödeme',
      security: 'Güvenlik',
    } satisfies Record<NotificationEventType, string>,
    channels: { email: 'E-posta', push: 'Push', sms: 'SMS' },
    quietHours: 'Sessiz saatler',
    columnHeader: 'Olay / Kanal',
    saving: 'Kaydediliyor…',
    saved: 'Tüm değişiklikler kaydedildi.',
    error: 'Bir hata oluştu.',
    loading: 'Yükleniyor…',
  },
  en: {
    eventTypes: {
      new_message: 'New message',
      listing_view: 'Listing view',
      price_change: 'Price change',
      favorite: 'Favorite update',
      appointment: 'Appointment',
      offer: 'Offer',
      payment: 'Payment',
      security: 'Security',
    } satisfies Record<NotificationEventType, string>,
    channels: { email: 'Email', push: 'Push', sms: 'SMS' },
    quietHours: 'Quiet hours',
    columnHeader: 'Event / Channel',
    saving: 'Saving…',
    saved: 'All changes saved.',
    error: 'An error occurred.',
    loading: 'Loading…',
  },
}

const CHANNEL_ICONS = { email: Mail, push: Bell, sms: MessageSquare } as const

interface OptimisticPatch {
  eventType: NotificationEventType
  channel: NotificationChannel
  next: boolean
}

function MatrixBody({ locale }: Required<Props>) {
  const labels = LABELS[locale]
  const [, startTransition] = useTransition()
  const { data, isPending } = useNotificationPrefs()
  const updateMutation = useUpdateNotificationPrefs()

  const [optimisticPrefs, applyOptimistic] = useOptimistic<NotificationPrefs | null, OptimisticPatch>(
    data ?? null,
    (current, patch) => {
      if (!current) return current
      return {
        ...current,
        matrix: {
          ...current.matrix,
          [patch.eventType]: {
            ...current.matrix[patch.eventType],
            [patch.channel]: patch.next,
          },
        },
      }
    },
  )

  if (isPending || !optimisticPrefs) {
    return (
      <div role="status" aria-busy="true" className="animate-pulse">
        <div className="h-12 rounded-t-2xl bg-foreground/5" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-14 border-t border-border bg-foreground/[0.02]" />
        ))}
      </div>
    )
  }

  const toggle = (eventType: NotificationEventType, channel: NotificationChannel) => {
    const current = optimisticPrefs.matrix[eventType][channel]
    const next: NotificationPrefs = {
      ...optimisticPrefs,
      matrix: {
        ...optimisticPrefs.matrix,
        [eventType]: {
          ...optimisticPrefs.matrix[eventType],
          [channel]: !current,
        },
      },
    }
    startTransition(() => {
      applyOptimistic({ eventType, channel, next: !current })
      updateMutation.mutate(next)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="notification-pref-matrix">
      {/* Header row */}
      <div
        className="grid border-b border-border bg-foreground/[0.03] text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground"
        style={{ gridTemplateColumns: '1fr repeat(3, 90px)' }}
      >
        <div className="px-4 py-3">{labels.columnHeader}</div>
        {CHANNELS.map((c) => {
          const Icon = CHANNEL_ICONS[c]
          return (
            <div
              key={c}
              className="flex items-center justify-center gap-1.5 px-2 py-3 text-center"
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              <span>{labels.channels[c]}</span>
            </div>
          )
        })}
      </div>

      {/* Rows */}
      {EVENT_TYPES.map((eventType) => (
        <div
          key={eventType}
          data-testid={`pref-row-${eventType}`}
          className="grid items-center border-b border-border last:border-b-0 hover:bg-foreground/[0.02]"
          style={{ gridTemplateColumns: '1fr repeat(3, 90px)' }}
        >
          <div className="px-4 py-3 text-sm">{labels.eventTypes[eventType]}</div>
          {CHANNELS.map((channel) => {
            const checked = optimisticPrefs.matrix[eventType][channel]
            return (
              <div key={channel} className="flex justify-center px-2 py-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={`${labels.eventTypes[eventType]} – ${labels.channels[channel]}`}
                  data-testid={`pref-toggle-${eventType}-${channel}`}
                  onClick={() => toggle(eventType, channel)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                    checked ? 'bg-foreground' : 'bg-foreground/15'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition ${
                      checked ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      ))}

      {/* Quiet hours info */}
      {optimisticPrefs.quietHours && (
        <div className="border-t border-border bg-foreground/[0.02] px-4 py-3 text-xs">
          <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
            {labels.quietHours}:
          </span>{' '}
          <span className="font-mono tabular-nums">{optimisticPrefs.quietHours}</span>
        </div>
      )}

      {updateMutation.isError && (
        <div
          role="alert"
          data-testid="pref-error"
          className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300"
        >
          {labels.error}
        </div>
      )}
      {updateMutation.isPending && (
        <div className="border-t border-border bg-foreground/[0.02] px-4 py-2 text-xs text-muted-foreground">
          {labels.saving}
        </div>
      )}
    </div>
  )
}

export default function NotificationPrefMatrix({ locale = 'tr' }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <MatrixBody locale={locale} />
    </QueryClientProvider>
  )
}
