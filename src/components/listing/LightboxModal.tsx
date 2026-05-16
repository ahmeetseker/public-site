// LightboxModal — pure presentational React component for the listing gallery
// lightbox. State + dispatch come from the parent (LightboxRoot) so the
// reducer can be tested in isolation.
//
// A11y / UX guarantees:
//   - role="dialog" + aria-modal="true" + aria-label
//   - aria-describedby links to the running "n / total — alt" caption
//   - Body scroll is locked while open (overflow hidden) and restored on close.
//   - Initial focus → close button; on close focus returns to the trigger.
//   - Tab cycles within the dialog (focus trap, both directions).
//   - ←/→ arrow keys page; Esc closes. Mobile: swipe left/right (>50px).
//   - Renders nothing while closed → unmounted DOM, no portal flicker.

import { useEffect, useRef } from 'react'
import { trapFocus } from '@/lib/a11y'
import type { LightboxState, LightboxAction, LightboxImage } from '@/lib/lightbox-reducer'

export type { LightboxImage }

export interface LightboxModalProps {
  state: LightboxState
  dispatch: (a: LightboxAction) => void
  images: LightboxImage[]
  returnFocusEl: HTMLElement | null
  /** UI locale for visible/aria strings. Defaults to 'tr'. */
  locale?: 'tr' | 'en'
}

export default function LightboxModal({
  state,
  dispatch,
  images,
  returnFocusEl,
  locale = 'tr',
}: LightboxModalProps) {
  const labels =
    locale === 'en'
      ? {
          gallery: 'Image gallery',
          close: 'Close gallery',
          closeBtn: 'Close ✕',
          prev: 'Previous image',
          next: 'Next image',
        }
      : {
          gallery: 'Görsel galerisi',
          close: 'Galeriyi kapat',
          closeBtn: 'Kapat ✕',
          prev: 'Önceki görsel',
          next: 'Sonraki görsel',
        }
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const touchStartX = useRef<number | null>(null)

  // Body scroll lock + initial focus + restore on close.
  useEffect(() => {
    if (!state.open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Defer focus until the dialog is mounted in the DOM.
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      if (returnFocusEl && document.body.contains(returnFocusEl)) {
        returnFocusEl.focus()
      }
    }
  }, [state.open, returnFocusEl])

  // Keyboard: Esc / ←/→ + Tab focus trap (Wave F23.C: shared `trapFocus`).
  // Focus return on close is handled separately above via `returnFocusEl`,
  // so we disable `restoreFocus` here to avoid double-restore races.
  useEffect(() => {
    if (!state.open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'close' })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        dispatch({ type: 'next' })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        dispatch({ type: 'prev' })
      }
    }
    document.addEventListener('keydown', onKey)
    const dialog = dialogRef.current
    let teardown: (() => void) | null = null
    if (dialog) {
      teardown = trapFocus(dialog, {
        initialFocus: closeBtnRef.current ?? undefined,
        restoreFocus: false,
      })
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      teardown?.()
    }
  }, [state.open, dispatch])

  if (!state.open) return null
  const img = images[state.index]
  if (!img) return null

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) dispatch({ type: dx < 0 ? 'next' : 'prev' })
    touchStartX.current = null
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.gallery}
      aria-describedby="lightbox-caption"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur"
      data-testid="lightbox-modal"
      data-print-hide=""
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={() => dispatch({ type: 'close' })}
        aria-label={labels.close}
        className="absolute right-4 top-4 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="lightbox-close"
      >
        {labels.closeBtn}
      </button>
      {state.total > 1 && (
        <>
          <button
            type="button"
            onClick={() => dispatch({ type: 'prev' })}
            aria-label={labels.prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            data-testid="lightbox-prev"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'next' })}
            aria-label={labels.next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            data-testid="lightbox-next"
          >
            →
          </button>
        </>
      )}
      <figure className="mx-auto max-h-[88vh] max-w-[92vw]">
        <img
          src={img.src}
          alt={img.alt}
          className="max-h-[80vh] w-auto rounded-2xl border border-border object-contain"
        />
        <figcaption
          id="lightbox-caption"
          className="mt-3 text-center font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
          data-testid="lightbox-caption"
        >
          {state.index + 1} / {state.total} — {img.alt}
        </figcaption>
      </figure>
    </div>
  )
}
