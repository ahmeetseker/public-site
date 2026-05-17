# MagicBento Listing Gallery — Design

**Date**: 2026-05-17
**Status**: Approved (brainstorming complete; awaiting implementation plan)
**Owner**: ahmet seker

## Context

The listing detail page renders photos via the **`ListingGallery`** React component exported from the workspace package `@landx/ui/listing-detail` (file: `packages/ui/src/listing-detail/ListingGallery.tsx`, 243 lines). It is consumed by both `src/pages/ilan/[slug].astro` and `src/pages/en/ilan/[slug].astro`. The component is fully self-contained: it owns its layout (1 main + 4 thumbs `1.6fr_1fr` grid, `+N fotoğraf` overlay on the last thumb, "Tüm fotoğraflar" CTA pill) AND its own `<Lightbox>` (keyboard arrows, ESC, touch swipe, body scroll lock, thumbnail strip).

Note: `src/components/listing/Gallery.astro` exists locally but is **not imported anywhere** — it is dead code and out of scope.

This spec rewrites `ListingGallery.tsx` to use a custom **MagicBento-inspired** 6-tile asymmetric bento grid plus three subtle premium interaction effects (spotlight, border glow, magnetism) in the site's warm amber palette. The original React-bits MagicBento component is the visual reference; we adapt the *layout and effects*, not the source.

## Goals

- Replace `ListingGallery`'s 1+4 layout with a 6-tile asymmetric bento grid that scales from 320px to desktop
- Add three subtle cursor-driven effects: global spotlight, per-tile border glow, per-tile magnetism (≤3px translate)
- Preserve the built-in Lightbox (keyboard nav, swipe, scroll lock, thumb strip) and the "Tüm fotoğraflar" CTA
- Preserve the public API: `ListingGallery({ images, alt })` — no consumer changes in `[slug].astro` (TR + EN)
- Zero new dependencies (no GSAP), effects implemented with React refs + RAF-throttled `pointermove` + CSS variables
- Respect `prefers-reduced-motion` and touch devices by skipping all effect logic

## Non-Goals

- **No** other MagicBento effects (tilt, particles, click ripple) — they conflict with photo legibility or the lightbox click
- **No** purple/dark theme — site uses warm neutral palette; glow is amber
- **No** GSAP dependency
- **No** new e2e test spec — user runs `pnpm test:e2e` themselves; manual smoke check suffices
- **No** changes to consumers (`[slug].astro` TR/EN) — `ListingGalleryProps` interface preserved
- **No** changes to `Gallery.astro` (dead code; leave for separate cleanup if desired)
- **No** dynamic per-photo color extraction (performance cost not justified)
- **No** changes to the built-in `<Lightbox>` other than what's required by structural refactor

## Architecture

### Files touched

```
packages/ui/src/listing-detail/
├── ListingGallery.tsx          ← REWRITTEN (same exports, same props)
└── ListingGallery.css          ← NEW (.mb-tile::after, .mb-spotlight, reduced-motion)
```

No consumer changes. No other workspace edits.

### Public API (UNCHANGED)

```ts
export interface ListingGalleryProps {
  images: readonly string[]
  alt?: string                  // default 'İlan fotoğrafı'
}
export function ListingGallery(props: ListingGalleryProps): ReactElement | null
export default ListingGallery
```

### Internal structure (new)

```
<ListingGallery>
  <BentoGrid>                   ← new wrapper, sets up CSS vars + listener
    <BentoTile i={0..5} />      ← 6 tiles, asymmetric on desktop, 2×3 on mobile
  </BentoGrid>
  <FullPhotosPill />            ← preserved CTA: "Tüm fotoğraflar (N)"
  {openAt !== null && <Lightbox /> }  ← preserved as-is
  <Spotlight />                  ← new fixed div, only mounted when effects active
</ListingGallery>
```

`Lightbox` component (lines 16–144 of current file) stays byte-identical.

## Layout

Container: `display: grid`, breakpoint-driven. Replaces current `md:grid-cols-[1.6fr_1fr]` outer + `grid-cols-2` inner with a single asymmetric grid.

### Breakpoints

| Viewport | Grid | Tile sizing |
|---|---|---|
| `≥1024px` (`lg:`) | 4 col × 3 row asymmetric bento | Tile 3 spans cols 3–4 rows 1–2 (2×2). Tile 4 spans cols 1–2 rows 2–3 (2×2). Tiles 1, 2, 5, 6 each occupy 1 col × 1 row. Container `aspect-[16/10]`. |
| `640–1023px` (`sm:`) | 2 col × 3 row equal | Each tile `aspect-[4/3]`. |
| `<640px` (mobile, incl. 320px) | 2 col × 3 row equal compact | Each tile `aspect-[4/3]`, gap `6px` (`gap-1.5`). |

### Desktop tile positions

```
┌──────┬──────┬─────────────┐
│  1   │  2   │             │
├──────┴──────┤      3      │
│             │             │
│      4      ├──────┬──────┤
│             │  5   │  6   │
└─────────────┴──────┴──────┘
```

### Approach: Tailwind + small inline `<style>`

Tailwind v4 covers most of it. The asymmetric `grid-column` / `grid-row` spans for tiles 3 and 4 are easier with one tiny `<style jsx-equivalent>` block via a `<style>` tag at module level OR via Tailwind arbitrary values:

```tsx
className={cn(
  'mb-tile relative overflow-hidden rounded-2xl',
  i === 2 && 'lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-3',
  i === 3 && 'lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-4',
)}
```

Container:
```tsx
className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:aspect-[16/10] lg:grid-cols-4 lg:grid-rows-3 lg:gap-2"
```

Total visible desktop height ≈ 520–580px (in line with current; no major layout shift).

## Tile content & overflow handling

Always 6 tiles. Tile content depends on `images.length`:

| `images.length` | Tile content |
|---|---|
| `< 6` | First N tiles render the photos; remaining `(6 − N)` tiles render a static placeholder (subtle `bg-foreground/5` + shimmer), `disabled`, `aria-hidden` — they do NOT open the lightbox. |
| `= 6` | Each tile renders one photo; last tile opens lightbox at index 5. |
| `> 6` | First 5 tiles render photos 0–4; tile #6 renders photo 5 with a `+(N − 6) fotoğraf` overlay; click opens lightbox at index 5. |

```tsx
const TILE_COUNT = 6
const photoCount = images.length
const overflow = Math.max(0, photoCount - TILE_COUNT)
// tile i: photo if i < photoCount; placeholder otherwise
```

Tile render:
```tsx
<button
  type="button"
  ref={(el) => { tilesRef.current[i] = el }}
  onClick={() => open(i)}
  disabled={i >= photoCount}
  aria-hidden={i >= photoCount || undefined}
  className={cn(
    'mb-tile group relative overflow-hidden rounded-2xl ring-1 ring-border',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
    'transition-transform duration-300 ease-out will-change-transform',
    i === 2 && 'lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-3',
    i === 3 && 'lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-4',
  )}
  style={{
    transform: 'translate3d(var(--mb-tx, 0), var(--mb-ty, 0), 0)',
  }}
  aria-label={`Fotoğraf ${i + 1}`}
>
  {i < photoCount ? (
    <>
      <img
        src={images[i]}
        alt={`${alt} — ${i + 1}`}
        loading={i === 0 ? 'eager' : 'lazy'}
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {i === TILE_COUNT - 1 && overflow > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white">
          +{overflow} fotoğraf
        </span>
      )}
    </>
  ) : (
    <div className="absolute inset-0 bg-foreground/5" />
  )}
  {/* Border-glow pseudo via CSS class, reads --mb-glow-* vars */}
</button>
```

Lightbox `open(i)` only fires when `i < photoCount` (button is `disabled` otherwise, so React won't fire `onClick`).

### "Tüm fotoğraflar" CTA (preserved)

```tsx
<div className="mt-2 flex justify-end">
  <button type="button" onClick={() => open(0)} className="...">
    <span aria-hidden>▦</span>
    Tüm fotoğraflar ({photoCount})
  </button>
</div>
```

## Colors & tokens

CSS variables declared on the bento grid container (inline `style` prop):

```ts
style={{
  '--mb-glow-color': '217, 165, 100',    // warm amber RGB
  '--mb-spotlight-size': '600px',
  '--mb-glow-radius': '200px',
}}
```

Dark theme override via a single CSS rule (added to the component's `<style>` block):

```css
.dark .mb-bento { --mb-glow-color: 230, 180, 110; }
```

Per-tile (JS sets these on `tile.style` directly):

```
--mb-glow-x, --mb-glow-y         (cursor position % within tile)
--mb-glow-intensity              (0–1, distance falloff)
--mb-tx, --mb-ty                 (magnetism offset, max ~3px)
```

Spotlight `<div>` fixed-positioned, appended to `document.body`. `mix-blend-mode: multiply` (light theme).

## Interaction implementation

A small inline `<style>` block at module top (or a sibling `.css` file if the workspace prefers — check `ListingGalleryTabs.tsx` for precedent) handles the border-glow `::after` and the spotlight. A `useEffect` in `BentoGrid` wires up the listener.

### Effect setup (React)

```tsx
useEffect(() => {
  const isTouch = matchMedia('(pointer: coarse)').matches
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (isTouch || reduce) return  // CSS hover suffices, no spotlight

  const container = containerRef.current
  if (!container) return

  // Mount spotlight
  const spot = document.createElement('div')
  spot.className = 'mb-spotlight'
  document.body.appendChild(spot)

  let raf = 0
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

      spot.style.opacity = inside ? '0.6' : '0'
      spot.style.transform =
        `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`

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
        tile.style.setProperty('--mb-glow-x', `${((e.clientX - r.left) / r.width) * 100}%`)
        tile.style.setProperty('--mb-glow-y', `${((e.clientY - r.top) / r.height) * 100}%`)
        tile.style.setProperty('--mb-glow-intensity', String(intensity))

        const hover = Math.abs(dx) < r.width / 2 && Math.abs(dy) < r.height / 2
        tile.style.setProperty('--mb-tx', hover ? `${dx * 0.03}px` : '0px')
        tile.style.setProperty('--mb-ty', hover ? `${dy * 0.03}px` : '0px')
      })
    })
  }

  const onLeave = () => {
    spot.style.opacity = '0'
    tilesRef.current.forEach((tile) => {
      if (!tile) return
      tile.style.setProperty('--mb-glow-intensity', '0')
      tile.style.setProperty('--mb-tx', '0px')
      tile.style.setProperty('--mb-ty', '0px')
    })
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)

  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    spot.parentNode?.removeChild(spot)
  }
}, [])
```

### Border glow CSS

```css
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
```

### Spotlight CSS

```css
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

@media (prefers-reduced-motion: reduce) {
  .mb-tile { transition: none !important; transform: none !important; }
  .mb-spotlight { display: none !important; }
}
```

### CSS placement

Workspace has precedent for colocated `.css` files (`packages/ui/src/styles/theme.css`). Add:

```
packages/ui/src/listing-detail/
├── ListingGallery.tsx          ← rewritten
└── ListingGallery.css          ← NEW: .mb-tile::after, .mb-spotlight, reduced-motion overrides
```

Imported at the top of `ListingGallery.tsx`:
```ts
import './ListingGallery.css'
```

Tailwind v4 picks up plain CSS files via Astro's bundler. All `.mb-*` classes live there (not in `_theme.css`) to keep the component portable within the package.

## Accessibility

- Tiles are `<button type="button">` — keyboard Enter/Space opens lightbox
- Placeholder tiles: `disabled` + `aria-hidden="true"` — removed from tab order, not announced
- Overflow tile: `aria-label="${overflow} adet daha fotoğraf, galeriyi aç"`
- `<noscript>`: React component won't render at all — Astro page already handles JS-disabled UX via `noscript` fallbacks elsewhere (out of scope)
- Lightbox a11y unchanged (`role="dialog"`, `aria-modal="true"`, keyboard ESC/arrows preserved)

## Reduced motion & touch

| Condition | Behavior |
|---|---|
| `prefers-reduced-motion: reduce` | `useEffect` returns early; spotlight not mounted; `--mb-tx/ty` never set; CSS media query nukes any leftover transitions/transforms |
| `pointer: coarse` (touch) | `useEffect` returns early; tap → lightbox via native button click; `:active` provides 0.97 scale tap feedback (optional, Tailwind `active:scale-[0.97]`) |
| JS error / hydration fails | Tiles remain interactive (server-rendered `<button>`s); no effects |

## Performance budget

- **JS**: ~2.5KB minified added to the bundle (one `useEffect` + small RAF loop, inline)
- **CSS**: ~1.2KB additional (border glow `::after` + spotlight + reduced-motion overrides)
- **No new dependencies**
- **Hydration**: same as current (the component was already a React island; no additional hydration cost)
- **Runtime**: 6 tiles × ~5 `setProperty` per frame, RAF-throttled, ~60fps on mid-range hardware
- **Image weight**: unchanged — still 6 `<img>` tags with same `src` URLs

## Testing

- **No new e2e spec** — per user preference (`feedback_skip_e2e.md`)
- `pnpm typecheck` validates that `ListingGalleryProps` is unchanged
- `pnpm test` (vitest unit) — verify any existing unit test for ListingGallery still passes
- Existing e2e suite: should pass because public API and lightbox behavior are preserved
- User runs `pnpm test:e2e` themselves at end of work

## Open questions / future work

Out of scope for this iteration:
- Removing dead `src/components/listing/Gallery.astro` (separate cleanup PR)
- Per-photo dynamic glow color
- Bento tilt or particle effects
- Animated entry on scroll

## Acceptance criteria

- [ ] `packages/ui/src/listing-detail/ListingGallery.tsx` renders a 6-tile asymmetric grid at ≥1024px
- [ ] 320px viewport renders 2×3 compact grid without overflow
- [ ] Pointer over container produces visible amber spotlight + per-tile border glow
- [ ] Hovered tile translates ≤3px toward cursor; resets smoothly on leave
- [ ] Touch device (or DevTools touch emulation) shows no JS-driven effects; tap still opens lightbox
- [ ] `prefers-reduced-motion: reduce` disables all motion effects
- [ ] `images.length > 6` shows `+N fotoğraf` overlay on tile #6
- [ ] `images.length < 6` renders placeholder tiles that are non-interactive (`disabled`, `aria-hidden`)
- [ ] Built-in `<Lightbox>` (keyboard arrows, ESC, swipe, scroll lock, thumb strip) works unchanged
- [ ] "Tüm fotoğraflar (N)" CTA preserved
- [ ] `ListingGalleryProps` interface unchanged; no consumer changes in `[slug].astro` (TR + EN)
- [ ] `pnpm typecheck` passes
