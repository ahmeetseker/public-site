// SocialProofToast — Wave F29.C (F30.C: canonical mock-stream)
//
// Sol-alt köşede mock "X kişi şu an bakıyor" benzeri sosyal kanıt toast'ı.
// Backend gerçek tracking (PostHog session presence + favoriler) inecek
// noktada `useMockStream` real `EventSource`/`WebSocket` adaptörüyle değişir;
// component contract aynı kalır.
//
// KVKK / F13.D:
//   - `isAllowed('analytics')` false ise hiç render yok, interval kurulmaz.
//   - Consent runtime'da değişebilir (CookieConsentModal "Tümünü kabul et"
//     → `cookie-consent:changed` event); component aboneliği üzerinden
//     reaktif: kapat → bir sonraki render'da yeniden başlar.
//
// UX:
//   - ~45s aralıklarla mock mesaj seçilir, 4s sonra otomatik kapanır,
//     X butonuyla manuel kapatılabilir.
//   - `prefers-reduced-motion: reduce` → fade animasyonu opacity'siz, snap.
//   - `aria-live="polite"` — ekran okuyucu konuşma sırasını bozmaz.
//
// Mount: `client:idle` from `[slug].astro` — LCP sonrası hidrate, post.
import { useEffect, useMemo, useState } from 'react'
import { useMockStream } from '@landx/ui/lib'
import { isAllowed, onConsentChanged } from '@/lib/cookie-consent'

const AUTO_DISMISS_MS = 4000

export interface SocialProofMessage {
  /** Stable kind tag — useful for analytics swap later. */
  kind: 'viewing' | 'favorited' | 'compared'
  /** Localized, ready-to-render copy. */
  text: string
}

/** Pick a random integer in `[min, max]` (inclusive). */
function randomIntInclusive(min: number, max: number): number {
  if (max < min) [min, max] = [max, min]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate a single mock message. */
function generateMockMessage(): SocialProofMessage {
  const flavor = randomIntInclusive(0, 2)
  if (flavor === 0) {
    const n = randomIntInclusive(3, 18)
    return { kind: 'viewing', text: `Şu an ${n} kişi bu ilana bakıyor` }
  }
  if (flavor === 1) {
    const n = randomIntInclusive(2, 24)
    return { kind: 'favorited', text: `Son 24 saatte ${n} kişi favorilere ekledi` }
  }
  const n = randomIntInclusive(1, 9)
  return { kind: 'compared', text: `${n} kişi karşılaştırmaya ekledi` }
}

export interface SocialProofToastProps {
  /** Override interval (ms). Default 45_000 — 45s (mid of old 30-60s band). */
  intervalMs?: number
}

export default function SocialProofToast({
  intervalMs = 45_000,
}: SocialProofToastProps) {
  // Consent gate — start optimistic-false, then re-check on mount + on
  // `cookie-consent:changed`. SSR-safe (component is `client:idle`).
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    setConsented(isAllowed('analytics'))
    return onConsentChanged((c) => setConsented(c.analytics === true))
  }, [])

  const [dismissed, setDismissed] = useState(false)

  // Canonical generic stream — pull-style. `generator(cursor)` is invoked on
  // tick; we return a fresh message each cursor. `enabled=false` while no
  // consent → hook is a no-op (interval is never armed).
  const { events, clear } = useMockStream<SocialProofMessage>({
    intervalMs,
    enabled: consented,
    maxBuffer: 1,
    generator: () => generateMockMessage(),
  })

  const current = useMemo(() => events[0] ?? null, [events])

  // Auto-dismiss after 4s. Resets on every new message.
  useEffect(() => {
    if (!current || dismissed) return
    setDismissed(false)
    const t = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [current])

  // Reset dismissed flag when a new event arrives (events list shifts).
  useEffect(() => {
    setDismissed(false)
  }, [events.length])

  if (!consented || !current || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="social-proof-toast"
      className="fixed bottom-4 left-4 z-40 max-w-[320px] rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500 motion-safe:animate-pulse"
        />
        <p className="min-w-0 flex-1 text-foreground">{current.text}</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            clear()
          }}
          aria-label="Bildirimi kapat"
          className="-mr-1 -mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  )
}
