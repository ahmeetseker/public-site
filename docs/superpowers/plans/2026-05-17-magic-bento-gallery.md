# MagicBento Listing Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `packages/ui/src/listing-detail/ListingGallery.tsx` to render a 6-tile asymmetric MagicBento grid with spotlight, border glow, and magnetism effects, while preserving the public API and built-in Lightbox.

**Architecture:** Single React component rewrite + one new colocated CSS file. Effects are powered by a single `useEffect` with a RAF-throttled `pointermove` listener that writes CSS custom properties on each tile. No GSAP, no new dependencies. Touch and reduced-motion users skip the effect setup entirely (CSS fallback covers them).

**Tech Stack:** React 19, TypeScript, Tailwind v4, Astro 6 (consumer), vitest (existing test harness — no new tests added per user preference).

**Reference spec:** `docs/superpowers/specs/2026-05-17-magic-bento-gallery-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `packages/ui/src/listing-detail/ListingGallery.css` | **Create** | `.mb-tile::after` border glow, `.mb-spotlight`, reduced-motion overrides, spotlight visuals |
| `packages/ui/src/listing-detail/ListingGallery.tsx` | **Rewrite** | 6-tile bento grid, effect orchestration, preserved Lightbox + CTA |

**Untouched (intentionally):** `[slug].astro` (TR/EN), barrel `index.tsx`, `Gallery.astro` (dead code), all other workspace files.

---

## Task 1: Add `ListingGallery.css` with all effect styles

**Files:**
- Create: `packages/ui/src/listing-detail/ListingGallery.css`

- [ ] **Step 1: Create the CSS file with full content**

```css
/* MagicBento gallery — border glow, spotlight, reduced-motion overrides.
   Imported by ListingGallery.tsx. */

.mb-tile {
  transform: translate3d(var(--mb-tx, 0px), var(--mb-ty, 0px), 0);
  transition: transform 0.3s ease-out;
  will-change: transform;
}

.mb-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: radial-gradient(
    var(--mb-glow-radius, 200px) circle
    at var(--mb-glow-x, 50%) var(--mb-glow-y, 50%),
    rgba(var(--mb-glow-color, 217, 165, 100), calc(var(--mb-glow-intensity, 0) * 0.8)) 0%,
    rgba(var(--mb-glow-color, 217, 165, 100), calc(var(--mb-glow-intensity, 0) * 0.3)) 35%,
    transparent 65%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
  pointer-events: none;
  transition: opacity 0.2s ease-out;
}

.mb-spotlight {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--mb-spotlight-size, 600px);
  height: var(--mb-spotlight-size, 600px);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  z-index: 50;
  mix-blend-mode: multiply;
  background: radial-gradient(
    circle,
    rgba(var(--mb-glow-color, 217, 165, 100), 0.18) 0%,
    rgba(var(--mb-glow-color, 217, 165, 100), 0.08) 25%,
    transparent 60%
  );
  will-change: transform, opacity;
  transition: opacity 0.25s ease-out;
}

.dark .mb-bento {
  --mb-glow-color: 230, 180, 110;
}

@media (prefers-reduced-motion: reduce) {
  .mb-tile {
    transition: none !important;
    transform: none !important;
  }
  .mb-spotlight {
    display: none !important;
  }
}
```

- [ ] **Step 2: Verify file was written**

Run: `ls -la packages/ui/src/listing-detail/ListingGallery.css`
Expected: file exists, ~1.5KB

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/listing-detail/ListingGallery.css
git commit -m "feat(ui/listing-detail): add MagicBento gallery effect styles"
```

---

## Task 2: Rewrite `ListingGallery.tsx` — bento layout, no effects yet

This task swaps the outer markup from the 1+4 layout to a 6-tile bento grid. The built-in `<Lightbox>` component (lines 16–144 of the current file) is preserved byte-identical. The `useEffect` for pointer effects is added in Task 3.

**Files:**
- Modify: `packages/ui/src/listing-detail/ListingGallery.tsx` (full rewrite of lines 146–243; Lightbox section unchanged)

- [ ] **Step 1: Replace the file with the new structure (Lightbox preserved, effects placeholder)**

Write the file with this exact content:

```tsx
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
```

- [ ] **Step 2: Run typecheck from the public-site app**

Run: `pnpm --filter @landx/public-site typecheck`
Expected: Pass with no errors. If errors mention `useRef` / refs, double-check imports.

- [ ] **Step 3: Run vitest unit suite to verify no other tests regressed**

Run: `pnpm --filter @landx/ui test`
Expected: PASS (existing `dynamic-island-header.test.tsx` and any others — there are no tests for ListingGallery itself).

- [ ] **Step 4: Commit the layout rewrite**

```bash
git add packages/ui/src/listing-detail/ListingGallery.tsx
git commit -m "refactor(ui/listing-detail): swap ListingGallery to 6-tile bento layout

Preserves public API (ListingGalleryProps) and built-in Lightbox.
Effects (spotlight/glow/magnetism) added in next commit."
```

---

## Task 3: Add the effects `useEffect` (spotlight + border glow + magnetism)

**Files:**
- Modify: `packages/ui/src/listing-detail/ListingGallery.tsx` — insert a `useEffect` inside the `ListingGallery` component, just before the early `if (!images || images.length === 0) return null` guard.

- [ ] **Step 1: Insert the effect**

Open `packages/ui/src/listing-detail/ListingGallery.tsx` and replace:

```tsx
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tilesRef = useRef<Array<HTMLButtonElement | null>>([])
  const [openAt, setOpenAt] = useState<number | null>(null)

  if (!images || images.length === 0) return null
```

with:

```tsx
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
```

(Imports already include `useEffect` from Task 2; no import change needed.)

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @landx/public-site typecheck`
Expected: Pass.

- [ ] **Step 3: Run vitest**

Run: `pnpm --filter @landx/ui test`
Expected: PASS — no test touches ListingGallery, others unaffected.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/listing-detail/ListingGallery.tsx
git commit -m "feat(ui/listing-detail): add MagicBento spotlight + glow + magnetism effects

Single useEffect with RAF-throttled pointermove. Touch and
prefers-reduced-motion users skip setup entirely."
```

---

## Task 4: Manual verification (dev server) and final checks

**Files:** none modified.

- [ ] **Step 1: Start dev server**

Run: `pnpm --filter @landx/public-site dev`
Expected: dev server listens on port 5180. Wait for "watching for file changes" or similar.

- [ ] **Step 2: Open a listing detail page in a browser**

Navigate to `http://localhost:5180/ilan/<any-listing-slug>` (any seeded listing). Confirm visually:

  - [ ] At desktop width (≥1024px) the gallery shows **6 tiles in asymmetric bento** (tiles 1, 2 small top-left; tile 3 large top-right; tile 4 large bottom-left; tiles 5, 6 small bottom-right)
  - [ ] Cursor over the gallery shows a **soft amber spotlight halo** following the pointer
  - [ ] Tile under the cursor shows a **subtle amber border glow** that intensifies as the cursor nears
  - [ ] Hovered tile **drifts ≤3px** toward the cursor and resets smoothly when the cursor leaves
  - [ ] Tile **click opens the existing Lightbox** at the correct index; keyboard ← → cycle works; ESC closes
  - [ ] If the listing has > 6 photos, tile #6 shows **"+N fotoğraf"** overlay
  - [ ] If the listing has < 6 photos, the missing tiles render as **muted placeholders** that are not clickable

- [ ] **Step 3: Resize to 320px width and confirm mobile layout**

In DevTools, set viewport to **320 × 720**. Confirm:

  - [ ] Grid is **2 columns × 3 rows**, all tiles equal `aspect-[4/3]`
  - [ ] No horizontal overflow
  - [ ] No spotlight or magnetism (touch emulation OR `pointer: coarse` triggers the bail-out)
  - [ ] Tile tap still opens the Lightbox

- [ ] **Step 4: Toggle reduced-motion and verify effects disable**

In DevTools → Rendering → set `prefers-reduced-motion` to `reduce`. Reload. Confirm:

  - [ ] No spotlight element appears in `<body>`
  - [ ] Cursor movement produces no glow or magnetism

- [ ] **Step 5: Stop dev server (Ctrl+C in the terminal running it).**

- [ ] **Step 6: Verify nothing else changed**

Run: `git status`
Expected: working tree clean (Tasks 1–3 already committed).

---

## Self-Review Notes

- Spec coverage: Layout (Task 2), colors (Task 1 CSS vars + Task 2 inline style), effects (Task 3), reduced-motion/touch (Task 1 CSS + Task 3 bail-out), overflow tile (Task 2 `showOverflow`), placeholder tiles (Task 2 `hasPhoto` branch), Lightbox preservation (Task 2 verbatim), CTA preservation (Task 2 "Tüm fotoğraflar"), public API preservation (Task 2 `ListingGalleryProps`).
- No placeholders or TBDs in the plan.
- Type consistency: `containerRef` `HTMLDivElement`, `tilesRef` `HTMLButtonElement[]`, `openAt` `number | null` — all used consistently across Tasks 2 and 3.
- No new dependencies. No consumer changes. No e2e tests (per user preference).
- Lightbox component is repeated verbatim in Task 2 because the engineer may read Task 2 without having read the existing file.
