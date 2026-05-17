import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { cn } from '../lib/cn'
import './ListingGallery.css'

export interface ListingGalleryProps {
  images: readonly string[]
  alt?: string
}

interface LightboxProps {
  images: readonly string[]
  alt: string
  startIndex: number
  onClose: () => void
}

function Lightbox({ images, alt, startIndex, onClose }: LightboxProps): ReactElement {
  const [index, setIndex] = useState(startIndex)
  const last = images.length - 1

  const prev = useCallback(() => {
    setIndex((i) => (i === 0 ? last : i - 1))
  }, [last])

  const next = useCallback(() => {
    setIndex((i) => (i === last ? 0 : i + 1))
  }, [last])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  const [touchStart, setTouchStart] = useState<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0]?.clientX ?? null)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const end = e.changedTouches[0]?.clientX ?? touchStart
    const delta = end - touchStart
    if (delta > 40) prev()
    else if (delta < -40) next()
    setTouchStart(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galeri"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="font-mono text-xs tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Kapat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg leading-none hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-4 pb-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={prev}
          aria-label="Önceki"
          className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:inline-flex"
        >
          ‹
        </button>
        <img
          src={images[index]}
          alt={`${alt} — ${index + 1}`}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
        <button
          type="button"
          onClick={next}
          aria-label="Sonraki"
          className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:inline-flex"
        >
          ›
        </button>
      </div>

      <div
        className="overflow-x-auto border-t border-white/10 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Fotoğraf ${i + 1}`}
              className={cn(
                'h-14 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10 transition',
                i === index ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const TILE_COUNT = 6

export function ListingGallery({
  images,
  alt = 'İlan fotoğrafı',
}: ListingGalleryProps): ReactElement | null {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tilesRef = useRef<Array<HTMLButtonElement | null>>([])
  const [openAt, setOpenAt] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const container = containerRef.current
    if (!container) return

    const spotlight = document.createElement('div')
    spotlight.className = 'mb-spotlight'
    document.body.appendChild(spotlight)

    let raf = 0

    const reset = () => {
      spotlight.style.opacity = '0'
      tilesRef.current.forEach((tile) => {
        if (!tile) return
        tile.style.setProperty('--mb-glow-intensity', '0')
        tile.style.setProperty('--mb-tx', '0px')
        tile.style.setProperty('--mb-ty', '0px')
      })
    }

    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const rect = container.getBoundingClientRect()
        const inside =
          e.clientX >= rect.left - 100 &&
          e.clientX <= rect.right + 100 &&
          e.clientY >= rect.top - 100 &&
          e.clientY <= rect.bottom + 100

        spotlight.style.opacity = inside ? '0.6' : '0'
        spotlight.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`

        tilesRef.current.forEach((tile) => {
          if (!tile) return
          const r = tile.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const dx = e.clientX - cx
          const dy = e.clientY - cy
          const dist = Math.hypot(dx, dy)
          const proximity = 150
          const intensity = inside
            ? Math.max(0, 1 - dist / (Math.max(r.width, r.height) + proximity))
            : 0
          tile.style.setProperty(
            '--mb-glow-x',
            `${((e.clientX - r.left) / r.width) * 100}%`,
          )
          tile.style.setProperty(
            '--mb-glow-y',
            `${((e.clientY - r.top) / r.height) * 100}%`,
          )
          tile.style.setProperty('--mb-glow-intensity', String(intensity))

          const hover =
            Math.abs(dx) < r.width / 2 && Math.abs(dy) < r.height / 2
          tile.style.setProperty('--mb-tx', hover ? `${dx * 0.03}px` : '0px')
          tile.style.setProperty('--mb-ty', hover ? `${dy * 0.03}px` : '0px')
        })
      })
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
      spotlight.parentNode?.removeChild(spotlight)
    }
  }, [])

  if (!images || images.length === 0) return null

  const photoCount = images.length
  const overflow = Math.max(0, photoCount - TILE_COUNT)

  function open(at: number) {
    setOpenAt(at)
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'mb-bento grid grid-cols-2 gap-1.5 sm:gap-2',
          'lg:aspect-[16/10] lg:grid-cols-4 lg:grid-rows-3 lg:gap-2',
        )}
        style={
          {
            '--mb-glow-color': '217, 165, 100',
            '--mb-spotlight-size': '600px',
            '--mb-glow-radius': '200px',
          } as React.CSSProperties
        }
      >
        {Array.from({ length: TILE_COUNT }).map((_, i) => {
          const hasPhoto = i < photoCount
          const isLargeA = i === 2
          const isLargeB = i === 3
          const showOverflow = i === TILE_COUNT - 1 && overflow > 0

          return (
            <button
              key={i}
              ref={(el) => {
                tilesRef.current[i] = el
              }}
              type="button"
              onClick={hasPhoto ? () => open(i) : undefined}
              disabled={!hasPhoto}
              aria-hidden={!hasPhoto || undefined}
              aria-label={
                showOverflow
                  ? `${overflow} adet daha fotoğraf, galeriyi aç`
                  : hasPhoto
                    ? `Fotoğraf ${i + 1}`
                    : undefined
              }
              className={cn(
                'mb-tile group relative block aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-border',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
                'active:scale-[0.98]',
                'lg:aspect-auto',
                isLargeA && 'lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-3',
                isLargeB && 'lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-4',
                !hasPhoto && 'cursor-default opacity-100',
              )}
            >
              {hasPhoto ? (
                <>
                  <img
                    src={images[i]}
                    alt={`${alt} — ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  {showOverflow && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white">
                      +{overflow} fotoğraf
                    </span>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-foreground/5" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => open(0)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5',
            'text-[12px] font-medium text-foreground hover:bg-foreground/10',
          )}
        >
          <span aria-hidden>▦</span>
          Tüm fotoğraflar ({photoCount})
        </button>
      </div>

      {openAt !== null && (
        <Lightbox
          images={images}
          alt={alt}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  )
}

export default ListingGallery
