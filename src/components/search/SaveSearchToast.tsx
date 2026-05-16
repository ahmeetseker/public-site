/**
 * SaveSearchToast — minimal slide-down toast for "Arama kaydedildi" feedback.
 *
 * Wave F4 / Agent-F4B. Used by SaveSearchButton. Standalone (no global toast
 * provider in public-site yet — F2D's FilterChips doesn't render toasts).
 *
 * Caller controls visibility via `visible` prop; component handles its own
 * auto-dismiss timer through the parent's `onDone` callback. Esc closes.
 *
 * Token-only: bg-foreground text-background (inverted high-contrast pill).
 */
import { useEffect } from 'react'
import { announce } from '@/lib/a11y'

export interface Props {
  visible: boolean
  message: string
  onDone: () => void
  /** Auto-dismiss delay in ms. Defaults to 2400ms. */
  duration?: number
}

export default function SaveSearchToast({
  visible,
  message,
  onDone,
  duration = 2400,
}: Props) {
  useEffect(() => {
    if (!visible) return
    // Wave F23.C — route the message through the singleton live region too,
    // so screen readers re-announce on rapid show/hide cycles (the local
    // `role=status` node alone is unreliable when the element unmounts).
    announce(message || 'Aramanız kaydedildi')
    const t = window.setTimeout(onDone, duration)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [visible, message, duration, onDone])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-save-search-toast=""
      className="pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 transform"
    >
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg [animation:save-search-toast-in_180ms_ease-out_both]">
        <span aria-hidden="true">✓</span>
        <span>{message}</span>
      </div>
      {/* Wave F28.B — slide-in animation aligned with ShareToast pattern.
          Global `prefers-reduced-motion` rule in _theme.css collapses this
          to ~0ms automatically (no per-component gate needed). */}
      <style>{`
        @keyframes save-search-toast-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
