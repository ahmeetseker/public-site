// FloorPlanViewer — Wave F24.A.
//
// Lightbox-style modal for floor-plan images. Built on the shared F23.0
// `trapFocus` helper so focus is restored to the trigger on close. Keeps
// keyboard navigation predictable: Esc closes, `+`/`-` zoom, backdrop
// click dismisses, in-modal `data-fp-close` buttons close.
//
// Mounted with `client:visible` from `ListingExtrasTabs.astro` only when
// the active tab is `plan`, so the JS chunk doesn't ship for listings
// without a floor plan and never enters the initial-route budget for
// listings that have one but aren't viewing the tab.

import { useEffect, useRef, useState } from 'react'
import { trapFocus, prefersReducedMotion } from '@/lib/a11y'

interface Copy {
  open: string
  close: string
  zoomIn: string
  zoomOut: string
  reset: string
  alt: string
  loading: string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    open: 'Plan görüntüsünü büyüt',
    close: 'Plan görüntüsünü kapat',
    zoomIn: 'Yaklaştır',
    zoomOut: 'Uzaklaştır',
    reset: 'Sıfırla',
    alt: 'Kat planı',
    loading: 'Plan yükleniyor…',
  },
  en: {
    open: 'Open floor plan',
    close: 'Close floor plan',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset',
    alt: 'Floor plan',
    loading: 'Loading floor plan…',
  },
}

export interface FloorPlanViewerProps {
  url: string
  locale?: 'tr' | 'en'
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const STEP = 0.25

export default function FloorPlanViewer({ url, locale = 'tr' }: FloorPlanViewerProps) {
  const copy = COPY[locale]
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Reset zoom whenever modal toggles so reopening shows full plan.
  useEffect(() => {
    if (!open) setZoom(1)
  }, [open])

  // Focus trap + keyboard handlers.
  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    if (!node) return

    const cleanupTrap = trapFocus(node, { restoreFocus: true })

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
      }
    }
    document.addEventListener('keydown', onKey)

    // Body scroll lock — same approach LightboxModal uses.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      cleanupTrap()
    }
  }, [open])

  const transition = prefersReducedMotion()
    ? 'none'
    : 'transform 160ms ease-out'

  return (
    <div className="space-y-3">
      {/* Inline preview — clickable to open the lightbox. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        aria-label={copy.open}
        data-testid="floor-plan-trigger"
      >
        <div className="relative aspect-[4/3] w-full bg-background">
          <img
            src={url}
            alt={copy.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-end">
            <span className="rounded-full border border-border bg-card/90 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
              {copy.open} →
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.alt}
          className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4"
          data-testid="floor-plan-modal"
          onClick={(e) => {
            // Backdrop click → close. Inner content stops propagation.
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          {/* Toolbar */}
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-2 backdrop-blur">
            <div
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
              aria-live="polite"
            >
              {Math.round(zoom * 100)}%
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
                }
                className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs tabular-nums text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                aria-label={copy.zoomOut}
                data-testid="floor-plan-zoom-out"
                disabled={zoom <= MIN_ZOOM}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                aria-label={copy.reset}
                data-testid="floor-plan-reset"
              >
                1×
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
                }
                className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs tabular-nums text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                aria-label={copy.zoomIn}
                data-testid="floor-plan-zoom-in"
                disabled={zoom >= MAX_ZOOM}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                aria-label={copy.close}
                data-testid="floor-plan-close"
                data-fp-close
              >
                {copy.close}
              </button>
            </div>
          </div>

          {/* Image stage */}
          <div
            className="mt-3 flex flex-1 items-center justify-center overflow-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <img
              src={url}
              alt={copy.alt}
              data-testid="floor-plan-image"
              draggable={false}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition,
              }}
              className="max-h-full max-w-full select-none rounded-xl border border-border bg-card shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
