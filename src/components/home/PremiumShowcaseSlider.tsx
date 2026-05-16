import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface PremiumShowcaseSliderProps {
  total: number
  labels: {
    prev: string
    next: string
    goToSlide: string
    eyebrow: string
  }
  autoPlayMs?: number
  children?: ReactNode
}

const DEFAULT_AUTOPLAY_MS = 5000

export default function PremiumShowcaseSlider({
  total,
  labels,
  autoPlayMs = DEFAULT_AUTOPLAY_MS,
  children,
}: PremiumShowcaseSliderProps) {
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const safeTotal = Math.max(1, total)
  const isSingle = safeTotal <= 1

  const go = useCallback((next: number) => {
    setActive(((next % safeTotal) + safeTotal) % safeTotal)
  }, [safeTotal])

  const prev = useCallback(() => go(active - 1), [active, go])
  const next = useCallback(() => go(active + 1), [active, go])

  // Reflect active state on slide elements (server-rendered children).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const slides = root.querySelectorAll<HTMLElement>('[data-slide-index]')
    slides.forEach((el) => {
      const idx = Number(el.dataset.slideIndex)
      const isActive = idx === active
      el.dataset.active = isActive ? 'true' : 'false'
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true')
      const link = el.querySelector<HTMLAnchorElement>('a[data-testid="premium-showcase-link"]')
      if (link) link.tabIndex = isActive ? 0 : -1
    })
  }, [active])

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.eyebrow}
      data-testid="premium-showcase"
      data-active-index={active}
      className="relative h-full"
    >
      {children}

      {!isSingle && (
        <>
          <button
            type="button"
            aria-label={labels.prev}
            onClick={prev}
            data-testid="premium-showcase-prev"
            className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={next}
            data-testid="premium-showcase-next"
            className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className="absolute inset-x-0 bottom-3 z-30 flex justify-center gap-1.5"
            data-testid="premium-showcase-dots"
          >
            {Array.from({ length: safeTotal }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={labels.goToSlide.replace('{n}', String(i + 1))}
                aria-current={i === active ? 'true' : 'false'}
                onClick={() => go(i)}
                className={
                  'h-2 w-2 rounded-full border border-white/40 transition ' +
                  (i === active ? 'bg-white' : 'bg-white/20 hover:bg-white/50')
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
