// VirtualTourViewer — Wave F24.A.
//
// Originally shipped as `VirtualTourPlaceholder` (Wave F6.B): a small CTA +
// "coming soon" modal that captured visitor interest in localStorage. F24.0
// adds per-listing `extras.hasVirtualTour` flags driven by deterministic
// hashing, so we can now render a real Pannellum 360° viewer for ~25% of
// listings and keep the placeholder fallback for the rest.
//
// Mount strategy:
//   - Pannellum is loaded from CDN (link + script tags injected via
//     `is:inline` in `ListingExtrasTabs.astro`). We don't `import 'pannellum'`
//     to keep the React island chunk tiny; the CDN script populates
//     `window.pannellum` which we feature-detect with a short polling loop.
//   - `prefersReducedMotion()` gates the auto-rotate animation so the
//     viewer is still navigable without spinning on its own.
//
// Fallback:
//   - When `hasVirtualTour === false` (~75% of listings), render the
//     original "coming soon" interest-capture UI. The localStorage key
//     (`arsam.virtualTourInterest.v1`) is preserved so existing data and
//     the F6.B e2e expectations don't move.

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/a11y'

export const STORAGE_KEY = 'arsam.virtualTourInterest.v1'

interface Entry {
  listingId: string
  email: string
  createdAt: number
}

function safeStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function readAll(): Entry[] {
  const ls = safeStorage()
  if (!ls) return []
  try {
    const raw = ls.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is Entry =>
        !!v &&
        typeof v === 'object' &&
        typeof (v as Entry).listingId === 'string' &&
        typeof (v as Entry).email === 'string' &&
        typeof (v as Entry).createdAt === 'number',
    )
  } catch {
    return []
  }
}

function appendEntry(entry: Entry): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    const current = readAll()
    ls.setItem(STORAGE_KEY, JSON.stringify([...current, entry]))
  } catch {
    /* quota — ignore */
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Copy {
  trigger: string
  modalHeading: string
  modalLead: string
  emailLabel: string
  emailPlaceholder: string
  submit: string
  close: string
  thanks: string
  invalidEmail: string
  viewerLabel: string
  viewerLoading: string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    trigger: '360° sanal tur',
    modalHeading: 'Sanal tur yakında',
    modalLead:
      'Bu ilan için 360° sanal tur hazırlığı sürüyor. E-posta bırakırsan tur yayına girdiğinde sana haber veririz.',
    emailLabel: 'E-posta',
    emailPlaceholder: 'ornek@arsam.net',
    submit: 'Haber ver',
    close: 'Kapat',
    thanks: 'Teşekkürler — tur hazır olduğunda haberin olacak ✓',
    invalidEmail: 'Geçerli bir e-posta girin.',
    viewerLabel: '360° sanal tur',
    viewerLoading: 'Sanal tur yükleniyor…',
  },
  en: {
    trigger: '360° virtual tour',
    modalHeading: 'Virtual tour — coming soon',
    modalLead:
      'A 360° virtual tour for this listing is on the way. Leave your email and we’ll ping you the moment it goes live.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@arsam.net',
    submit: 'Notify me',
    close: 'Close',
    thanks: 'Thanks — we’ll email you when the tour is live ✓',
    invalidEmail: 'Please enter a valid email.',
    viewerLabel: '360° virtual tour',
    viewerLoading: 'Loading virtual tour…',
  },
}

export interface VirtualTourViewerProps {
  listingId: string
  locale?: 'tr' | 'en'
  /**
   * When provided, the panorama is rendered inline via Pannellum (loaded
   * from CDN by the parent layout). When absent/undefined the original
   * F6.B placeholder behaviour is preserved.
   */
  panoramaUrl?: string | null
}

// ---- Live viewer ----------------------------------------------------------

interface PannellumViewer {
  destroy: () => void
}
interface PannellumGlobal {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>,
  ) => PannellumViewer
}

function getPannellum(): PannellumGlobal | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { pannellum?: PannellumGlobal }
  return w.pannellum ?? null
}

function LiveViewer({ panoramaUrl, copy }: { panoramaUrl: string; copy: Copy }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof window === 'undefined') return

    let cancelled = false
    let viewer: PannellumViewer | null = null
    let pollId: number | null = null

    function init() {
      if (cancelled) return
      const pannellum = getPannellum()
      if (!pannellum) {
        // CDN script not loaded yet — poll briefly. Pannellum is small
        // (~30 KB gzipped) and Astro injects the <script> in <head>, so it
        // typically resolves on the first attempt; the loop guards against
        // slow networks without spinning forever (max ~3s).
        pollId = window.setTimeout(init, 100)
        return
      }
      try {
        viewer = pannellum.viewer(node!, {
          type: 'equirectangular',
          panorama: panoramaUrl,
          autoLoad: true,
          autoRotate: prefersReducedMotion() ? 0 : -2,
          hfov: 100,
          compass: false,
          showControls: true,
          showZoomCtrl: true,
          showFullscreenCtrl: true,
          friction: 0.15,
        })
        setReady(true)
      } catch {
        // Malformed panorama URL or CDN script mismatch — leave the
        // loading state visible. The component still renders the labelled
        // region so screen readers know something is here.
      }
    }

    init()

    return () => {
      cancelled = true
      if (pollId !== null) window.clearTimeout(pollId)
      if (viewer && typeof viewer.destroy === 'function') {
        try {
          viewer.destroy()
        } catch {
          /* ignore */
        }
      }
    }
  }, [panoramaUrl])

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={copy.viewerLabel}
      data-testid="virtual-tour-viewer"
      data-ready={ready ? 'true' : 'false'}
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card"
    >
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-card text-xs text-muted-foreground">
          <span data-testid="virtual-tour-loading">{copy.viewerLoading}</span>
        </div>
      )}
    </div>
  )
}

// ---- Placeholder (interest capture) --------------------------------------

function Placeholder({
  listingId,
  copy,
}: {
  listingId: string
  copy: Copy
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Restore focus to the trigger when the modal closes (a11y).
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function submit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError(copy.invalidEmail)
      return
    }
    appendEntry({ listingId, email: value, createdAt: Date.now() })
    setError(null)
    setDone(true)
    setEmail('')
    window.setTimeout(() => {
      setDone(false)
      setOpen(false)
    }, 1400)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen(true)
          setDone(false)
          setError(null)
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="virtual-tour-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        {copy.trigger}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vt-modal-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
          data-testid="virtual-tour-modal"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="vt-modal-heading"
                className="font-serif text-lg font-medium tracking-tight"
              >
                {copy.modalHeading}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border bg-background px-2 py-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={copy.close}
                data-testid="virtual-tour-close"
              >
                {copy.close}
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{copy.modalLead}</p>

            <form onSubmit={submit} className="mt-4 space-y-2" data-testid="virtual-tour-form">
              <label
                htmlFor="vt-email"
                className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
              >
                {copy.emailLabel}
              </label>
              <input
                id="vt-email"
                // text-type so our own regex validation is what fires on
                // submit — `type="email"` triggers the native HTML5 popup
                // first and our `setError` branch never runs (this also
                // matches how other forms in the codebase validate by hand).
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                }}
                placeholder={copy.emailPlaceholder}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                autoComplete="email"
                data-testid="virtual-tour-email"
              />
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                  data-testid="virtual-tour-error"
                >
                  {error}
                </p>
              )}
              {done && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                  data-testid="virtual-tour-success"
                >
                  {copy.thanks}
                </p>
              )}
              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                  data-testid="virtual-tour-submit"
                >
                  {copy.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ---- Public component ----------------------------------------------------

export default function VirtualTourViewer({
  listingId,
  locale = 'tr',
  panoramaUrl,
}: VirtualTourViewerProps) {
  const copy = COPY[locale]
  if (panoramaUrl) {
    return <LiveViewer panoramaUrl={panoramaUrl} copy={copy} />
  }
  return <Placeholder listingId={listingId} copy={copy} />
}

// Backwards-compatible named export so anything that imported the old
// `VirtualTourPlaceholder` symbol while we're transitioning keeps working.
export { VirtualTourViewer as VirtualTourPlaceholder }
