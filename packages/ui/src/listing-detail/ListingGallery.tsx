import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { cn } from '../lib/cn'

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
    // Lock scroll while open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  // Touch swipe.
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
      {/* Header */}
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

      {/* Stage */}
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

      {/* Thumbnail strip */}
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

export function ListingGallery({
  images,
  alt = 'İlan fotoğrafı',
}: ListingGalleryProps): ReactElement | null {
  const [openAt, setOpenAt] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  const main = images[0]!
  const thumbs = images.slice(1, 5) // up to 4 thumbnails
  const total = images.length
  const extra = total > 5 ? total - 5 : 0

  function open(at: number) {
    setOpenAt(at)
  }

  return (
    <>
      <div className="grid gap-2 md:grid-cols-[1.6fr_1fr] md:gap-3">
        {/* Main image */}
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative block overflow-hidden rounded-2xl ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          aria-label="Fotoğrafları büyüt"
        >
          <div className="aspect-[16/10] w-full bg-foreground/5">
            <img
              src={main}
              alt={`${alt} — kapak`}
              loading="eager"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </button>

        {/* Thumbnail grid */}
        {thumbs.length > 0 && (
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {thumbs.map((src, i) => {
              const isLast = i === thumbs.length - 1 && extra > 0
              return (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => open(i + 1)}
                  className="group relative block overflow-hidden rounded-2xl ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  aria-label={`Fotoğraf ${i + 2}`}
                >
                  <div className="aspect-[16/10] w-full bg-foreground/5">
                    <img
                      src={src}
                      alt={`${alt} — ${i + 2}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  {isLast && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white">
                      +{extra} fotoğraf
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* "Tüm fotoğraflar" CTA */}
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
          Tüm fotoğraflar ({total})
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
