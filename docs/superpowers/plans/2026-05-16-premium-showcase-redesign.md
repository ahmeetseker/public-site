# Premium Showcase Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-listing reflective showcase card with a multi-listing slider that shows clear listing images + responsive detail panels, while preserving the existing metallic chrome (border, sheen, noise).

**Architecture:** Three files. (1) Pure heuristic in `select-showcase-listings.ts` → top-N active İmarlı listings by price. (2) `PremiumShowcaseSlide.astro` server-renders each slide (image + details + badges, no JS). (3) `PremiumShowcaseSlider.tsx` React island hydrates the slider shell — arrows, dots, swipe, auto-play with `prefers-reduced-motion` respect. `PremiumShowcase.astro` becomes a thin coordinator: pulls listings, renders N `<PremiumShowcaseSlide>` server-side as children of `<PremiumShowcaseSlider client:visible>`.

**Tech Stack:** Astro 5 + React 19 island, Tailwind v4, Vitest (jsdom) for unit tests, Playwright for e2e. Existing `@landx/data` `LISTINGS`, `@landx/ui/lib` `formatTLCompact`, `@landx/icons`.

**Spec:** `docs/superpowers/specs/2026-05-16-premium-showcase-redesign-design.md`

---

## File Structure

**Create:**
- `src/components/home/select-showcase-listings.ts` — pure heuristic, no Astro imports
- `src/components/home/__tests__/select-showcase-listings.test.ts` — vitest unit tests
- `src/components/home/PremiumShowcaseSlide.astro` — server-rendered single slide
- `src/components/home/PremiumShowcaseSlider.tsx` — React island; slider shell only

**Modify:**
- `src/components/home/PremiumShowcase.astro` — rewrite as coordinator
- `src/i18n/tr.ts` — add `prevSlide`, `nextSlide`, `goToSlide`, `badges.*`
- `src/i18n/en.ts` — same keys, English values
- `tests/e2e/premium-showcase.spec.ts` — update existing 4 tests + add 4 new

**Leave alone:**
- `src/pages/index.astro` & `src/pages/en/index.astro` — `<PremiumShowcase locale={locale} />` API unchanged
- `src/components/image/ResponsiveListingImage.astro`
- Existing metallic CSS (`reflective-border`, `reflective-sheen`, `reflective-noise`, `reflective-card-container`)

---

## Task 1: Selection heuristic (pure function, TDD)

**Files:**
- Create: `src/components/home/select-showcase-listings.ts`
- Create: `src/components/home/__tests__/select-showcase-listings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/home/__tests__/select-showcase-listings.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Listing } from '@landx/data'
import { selectShowcaseListings } from '../select-showcase-listings'

function mkListing(over: Partial<Listing>): Listing {
  return {
    id: 'X', title: 't', city: 'c', district: 'd',
    type: 'İmarlı', size: 100, price: 1_000_000,
    status: 'Aktif', views: 0, weeklyTrend: [],
    lastUpdate: '2026-01-01', tags: [], lat: 0, lng: 0,
    ...over,
  }
}

describe('selectShowcaseListings', () => {
  it('returns top-N active İmarlı by price descending', () => {
    const pool = [
      mkListing({ id: 'A', price: 1_000_000 }),
      mkListing({ id: 'B', price: 9_000_000 }),
      mkListing({ id: 'C', price: 5_000_000 }),
      mkListing({ id: 'D', price: 7_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 3 })
    expect(out.map((l) => l.id)).toEqual(['B', 'D', 'C'])
  })

  it('excludes non-active listings', () => {
    const pool = [
      mkListing({ id: 'A', status: 'Pasif', price: 9_000_000 }),
      mkListing({ id: 'B', price: 1_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['B'])
  })

  it('falls back to all active types when İmarlı pool has fewer than 3', () => {
    const pool = [
      mkListing({ id: 'A', type: 'İmarlı', price: 9_000_000 }),
      mkListing({ id: 'B', type: 'İmarlı', price: 1_000_000 }),
      mkListing({ id: 'C', type: 'Tarla', price: 5_000_000 }),
      mkListing({ id: 'D', type: 'Zeytinlik', price: 3_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['A', 'C', 'D', 'B'])
  })

  it('prefers İmarlı pool when it has 3 or more', () => {
    const pool = [
      mkListing({ id: 'A', type: 'İmarlı', price: 9_000_000 }),
      mkListing({ id: 'B', type: 'İmarlı', price: 1_000_000 }),
      mkListing({ id: 'C', type: 'İmarlı', price: 5_000_000 }),
      mkListing({ id: 'D', type: 'Tarla', price: 99_000_000 }),
    ]
    const out = selectShowcaseListings(pool, { limit: 8 })
    expect(out.map((l) => l.id)).toEqual(['A', 'C', 'B'])
  })

  it('returns empty array when pool has no active listings', () => {
    const pool = [mkListing({ status: 'Pasif' })]
    expect(selectShowcaseListings(pool, { limit: 8 })).toEqual([])
  })

  it('respects override prop and slices to limit', () => {
    const pool = [mkListing({ id: 'A' })]
    const overrides = [
      mkListing({ id: 'X' }), mkListing({ id: 'Y' }), mkListing({ id: 'Z' }),
    ]
    const out = selectShowcaseListings(pool, { limit: 2, override: overrides })
    expect(out.map((l) => l.id)).toEqual(['X', 'Y'])
  })

  it('defaults limit to 8 when not provided', () => {
    const pool = Array.from({ length: 12 }, (_, i) =>
      mkListing({ id: `L${i}`, price: 1_000_000 - i }),
    )
    expect(selectShowcaseListings(pool).length).toBe(8)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/components/home/__tests__/select-showcase-listings.test.ts`
Expected: All 7 tests FAIL with "Cannot find module '../select-showcase-listings'"

- [ ] **Step 3: Implement the heuristic**

Create `src/components/home/select-showcase-listings.ts`:

```ts
import type { Listing } from '@landx/data'

export interface SelectOptions {
  limit?: number
  override?: Listing[]
}

const DEFAULT_LIMIT = 8
const IMARLI_MIN_FOR_PREFERENCE = 3

export function selectShowcaseListings(
  listings: Listing[],
  options: SelectOptions = {},
): Listing[] {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (options.override && options.override.length > 0) {
    return options.override.slice(0, limit)
  }
  const active = listings.filter((l) => l.status === 'Aktif')
  if (active.length === 0) return []
  const imarli = active.filter((l) => l.type === 'İmarlı')
  const pool = imarli.length >= IMARLI_MIN_FOR_PREFERENCE ? imarli : active
  return [...pool].sort((a, b) => b.price - a.price).slice(0, limit)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/components/home/__tests__/select-showcase-listings.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/home/select-showcase-listings.ts src/components/home/__tests__/select-showcase-listings.test.ts
git commit -m "feat: add multi-listing selection heuristic for premium showcase"
```

---

## Task 2: i18n keys (TR + EN)

**Files:**
- Modify: `src/i18n/tr.ts` (showcase block, ~line 127–132)
- Modify: `src/i18n/en.ts` (showcase block, ~line 127–132)

- [ ] **Step 1: Update Turkish dictionary**

In `src/i18n/tr.ts`, replace the `showcase: { ... }` block with:

```ts
    showcase: {
      eyebrow: 'VİTRİN İLAN',
      ctaLabel: 'İlanı incele',
      priceLabel: 'Fiyat',
      sizeLabel: 'm²',
      prevSlide: 'Önceki ilan',
      nextSlide: 'Sonraki ilan',
      goToSlide: 'İlana git: {n}',
      slideOf: 'İlan {n} / {total}',
      badgeRoad: 'Yol',
      badgeWater: 'Su',
      badgeElectricity: 'Elektrik',
      badgeTitleDeed: 'Tapu hazır',
    },
```

- [ ] **Step 2: Update English dictionary**

In `src/i18n/en.ts`, replace the `showcase: { ... }` block with:

```ts
    showcase: {
      eyebrow: 'FEATURED LISTING',
      ctaLabel: 'View listing',
      priceLabel: 'Price',
      sizeLabel: 'sqm',
      prevSlide: 'Previous listing',
      nextSlide: 'Next listing',
      goToSlide: 'Go to listing: {n}',
      slideOf: 'Listing {n} of {total}',
      badgeRoad: 'Road',
      badgeWater: 'Water',
      badgeElectricity: 'Electricity',
      badgeTitleDeed: 'Title deed ready',
    },
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/tr.ts src/i18n/en.ts
git commit -m "feat(i18n): add showcase slider + badge labels"
```

---

## Task 3: PremiumShowcaseSlide component (server-rendered slide markup)

**Files:**
- Create: `src/components/home/PremiumShowcaseSlide.astro`

- [ ] **Step 1: Create the slide component**

Create `src/components/home/PremiumShowcaseSlide.astro`:

```astro
---
import type { Listing } from '@landx/data'
import { formatTLCompact } from '@landx/ui/lib'
import { Lock, MapPin, Maximize2, CheckCircle2 } from '@landx/icons'
import ResponsiveListingImage from '@/components/image/ResponsiveListingImage.astro'
import type { Locale } from '@/i18n'

export interface Props {
  listing: Listing
  index: number
  total: number
  locale: Locale
  hrefPrefix: string
  dict: Record<string, string>
}

const { listing, index, total, locale, hrefPrefix, dict } = Astro.props

const slugify = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const href = `${hrefPrefix}/ilan/${slugify(listing.title)}-${listing.id}`
const isFirst = index === 0
const formattedSize = listing.size.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')

interface Badge { label: string }
const badges: Badge[] = [
  listing.hasRoad ? { label: dict.badgeRoad } : null,
  listing.hasWater ? { label: dict.badgeWater } : null,
  listing.hasElectricity ? { label: dict.badgeElectricity } : null,
  (listing.titleStatus === 'mustakil' || listing.titleStatus === 'kat-irtifakli')
    ? { label: dict.badgeTitleDeed }
    : null,
].filter((b): b is Badge => b !== null)

const slideLabel = (dict.slideOf ?? 'Slide {n} / {total}')
  .replace('{n}', String(index + 1))
  .replace('{total}', String(total))
---

<article
  class="premium-slide group/slide absolute inset-0 grid h-full grid-rows-[1fr_auto] md:grid-cols-[3fr_2fr] md:grid-rows-1 transition-opacity duration-500 data-[active=false]:pointer-events-none data-[active=false]:opacity-0"
  data-testid="premium-showcase-slide"
  data-listing-id={listing.id}
  data-slide-index={index}
  data-active={isFirst ? 'true' : 'false'}
  aria-roledescription="slide"
  aria-label={slideLabel}
  aria-hidden={isFirst ? 'false' : 'true'}
>
  {/* ─── Image (top on mobile, left on md+) ─── */}
  <div class="relative h-full min-h-0 overflow-hidden bg-black/80">
    <ResponsiveListingImage
      listingId={listing.id}
      district={listing.district}
      ratio="16/9"
      index={1}
      loading={isFirst ? 'eager' : 'lazy'}
      sizes="(min-width: 768px) 60vw, 100vw"
      alt={`${listing.title} — ${listing.district}, ${listing.city}`}
      className="absolute inset-0 h-full w-full object-cover"
    />
  </div>

  {/* ─── Detail panel (bottom on mobile, right on md+) ─── */}
  <div class="relative flex min-w-0 flex-col justify-between gap-4 bg-black/45 p-5 text-white backdrop-blur-sm md:p-8">
    <header class="flex items-center justify-between gap-3">
      <span class="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] sm:text-xs">
        <Lock size={12} aria-hidden="true" />
        <span>{dict.eyebrow}</span>
      </span>
      <span class="inline-flex min-w-0 items-center gap-1.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 sm:text-xs">
        <MapPin size={12} aria-hidden="true" />
        <span class="truncate">{listing.district} · {listing.city}</span>
      </span>
    </header>

    <a
      href={href}
      class="block min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      data-testid="premium-showcase-link"
      tabindex={isFirst ? 0 : -1}
    >
      <h3 class="line-clamp-2 font-serif text-xl font-normal leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
        {listing.title}
      </h3>
      <p class="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 sm:text-xs">
        {listing.type}
      </p>
    </a>

    <div class="flex flex-col gap-2">
      {badges.length > 0 && (
        <ul class="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
          {badges.map((b) => (
            <li class="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono uppercase tracking-[0.12em] text-white/85">
              <CheckCircle2 size={10} aria-hidden="true" />
              <span>{b.label}</span>
            </li>
          ))}
        </ul>
      )}

      <footer class="flex items-end justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <span class="font-mono text-[9px] uppercase tracking-[0.18em] text-white/60 sm:text-[10px]">
            {dict.priceLabel}
          </span>
          <span class="font-serif text-2xl tabular-nums md:text-3xl">
            {formatTLCompact(listing.price)}
          </span>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-white/90 sm:text-sm">
            <Maximize2 size={12} aria-hidden="true" />
            {formattedSize} {dict.sizeLabel}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:text-sm">
            {dict.ctaLabel}
          </span>
        </div>
      </footer>
    </div>
  </div>
</article>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PremiumShowcaseSlide.astro
git commit -m "feat: add PremiumShowcaseSlide server-rendered slide component"
```

---

## Task 4: PremiumShowcaseSlider React island (skeleton — children rendering, no controls yet)

**Files:**
- Create: `src/components/home/PremiumShowcaseSlider.tsx`

- [ ] **Step 1: Create the slider component skeleton**

Create `src/components/home/PremiumShowcaseSlider.tsx`:

```tsx
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
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PremiumShowcaseSlider.tsx
git commit -m "feat: add PremiumShowcaseSlider island with arrows + dots"
```

---

## Task 5: Rewrite PremiumShowcase.astro as coordinator

**Files:**
- Modify: `src/components/home/PremiumShowcase.astro` (full rewrite)

- [ ] **Step 1: Replace the entire file**

Replace the contents of `src/components/home/PremiumShowcase.astro` with:

```astro
---
import { LISTINGS, type Listing } from '@landx/data'
import { useDict, detectLocaleFromPath, type Locale } from '@/i18n'
import { selectShowcaseListings } from './select-showcase-listings'
import PremiumShowcaseSlide from './PremiumShowcaseSlide.astro'
import PremiumShowcaseSlider from './PremiumShowcaseSlider.tsx'

export interface Props {
  locale?: Locale
  listings?: Listing[]
  limit?: number
}

const locale: Locale = Astro.props.locale ?? detectLocaleFromPath(Astro.url.pathname)
const prefix = locale === 'en' ? '/en' : ''
const dict = useDict('homepage.showcase', locale) as Record<string, string>

const slides = selectShowcaseListings(LISTINGS, {
  limit: Astro.props.limit ?? 8,
  override: Astro.props.listings,
})

const labels = {
  prev: dict.prevSlide ?? 'Previous',
  next: dict.nextSlide ?? 'Next',
  goToSlide: dict.goToSlide ?? 'Go to slide {n}',
  eyebrow: dict.eyebrow ?? '',
}
---

{
  slides.length > 0 && (
    <section class="border-t border-border bg-background">
      <div class="mx-auto max-w-[1280px] px-4 py-8 md:py-16">
        <div class="reflective-card-container relative overflow-hidden rounded-3xl bg-[#1a1a1a] aspect-[16/9] md:aspect-[21/9] focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-foreground">
          <div class="reflective-noise" aria-hidden="true"></div>
          <div class="reflective-sheen" aria-hidden="true"></div>
          <div class="reflective-border" aria-hidden="true"></div>

          <PremiumShowcaseSlider
            total={slides.length}
            labels={labels}
            client:visible
          >
            {slides.map((listing, i) => (
              <PremiumShowcaseSlide
                listing={listing}
                index={i}
                total={slides.length}
                locale={locale}
                hrefPrefix={prefix}
                dict={dict}
              />
            ))}
          </PremiumShowcaseSlider>
        </div>
      </div>
    </section>
  )
}

<style>
  .reflective-card-container {
    isolation: isolate;
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  .reflective-noise {
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.18;
    pointer-events: none;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .reflective-sheen {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    mix-blend-mode: overlay;
    opacity: 0.55;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.08) 40%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.08) 60%,
      rgba(255, 255, 255, 0.25) 100%
    );
  }

  .reflective-border {
    position: absolute;
    inset: 0;
    z-index: 25;
    pointer-events: none;
    border-radius: 1.5rem;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.6) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
</style>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Build to catch Astro compile errors**

Run: `pnpm build`
Expected: Build succeeds. (May take 30-60s; this validates that Astro+React island wiring is correct.)

- [ ] **Step 4: Commit**

```bash
git add src/components/home/PremiumShowcase.astro
git commit -m "feat: rewrite PremiumShowcase as multi-listing slider coordinator"
```

---

## Task 6: Update existing e2e tests to match new markup

**Files:**
- Modify: `tests/e2e/premium-showcase.spec.ts`

- [ ] **Step 1: Replace test 1 (eyebrow + CTA)**

In `tests/e2e/premium-showcase.spec.ts`, replace the first test with:

```ts
  test('renders showcase carousel with eyebrow and CTA on first slide', async ({ page }) => {
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()

    // First slide should be active by default.
    const firstSlide = carousel.locator('[data-slide-index="0"]')
    await expect(firstSlide).toHaveAttribute('data-active', 'true')
    await expect(firstSlide.getByText('VİTRİN İLAN')).toBeVisible()
    await expect(firstSlide.getByText(/İlanı incele/i)).toBeVisible()
  })
```

- [ ] **Step 2: Replace test 2 (link assertion)**

Replace the second test with:

```ts
  test('first slide links to a listing detail page', async ({ page }) => {
    await page.goto('/')
    const link = page.getByTestId('premium-showcase')
      .locator('[data-slide-index="0"]')
      .getByTestId('premium-showcase-link')
    const href = await link.getAttribute('href')
    expect(href).toMatch(/^\/ilan\/[A-Za-z0-9.-]+$/)
  })
```

- [ ] **Step 3: Replace test 3 (reduced-motion)**

Replace the third test with:

```ts
  test('respects prefers-reduced-motion (no auto-advance)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()
    const initial = await carousel.getAttribute('data-active-index')
    // Wait longer than default auto-play interval (5s) plus margin.
    await page.waitForTimeout(6500)
    const after = await carousel.getAttribute('data-active-index')
    expect(after).toBe(initial)
    await context.close()
  })
```

- [ ] **Step 4: Replace test 4 (EN locale)**

Replace the fourth test with:

```ts
  test('EN homepage shows the English showcase label', async ({ page }) => {
    await page.goto('/en/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()
    const firstSlide = carousel.locator('[data-slide-index="0"]')
    await expect(firstSlide.getByText('FEATURED LISTING')).toBeVisible()
  })
```

- [ ] **Step 5: Run the updated tests**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts`
Expected: All 4 tests PASS. (First run also rebuilds via `pretest:e2e`.)

If reduced-motion test fails: auto-play isn't yet implemented to skip on reduced-motion. Task 8 implements this; for now you can `test.skip()` test 3 if it's flakier than expected — but ideally Task 4's slider doesn't auto-advance yet (no setInterval) so the test should pass trivially.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/premium-showcase.spec.ts
git commit -m "test(e2e): update premium showcase tests for slider markup"
```

---

## Task 7: Add slider control e2e tests (arrows + dots)

**Files:**
- Modify: `tests/e2e/premium-showcase.spec.ts`

- [ ] **Step 1: Add test for next-arrow behavior**

Append inside the `test.describe('Premium Showcase', () => { ... })` block (after the 4 existing tests):

```ts
  test('next arrow advances to slide 2', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toHaveAttribute('data-active-index', '0')
    await page.getByTestId('premium-showcase-next').click()
    await expect(carousel).toHaveAttribute('data-active-index', '1')
    const slide1 = carousel.locator('[data-slide-index="1"]')
    await expect(slide1).toHaveAttribute('data-active', 'true')
    const slide0 = carousel.locator('[data-slide-index="0"]')
    await expect(slide0).toHaveAttribute('data-active', 'false')
  })

  test('dots reflect and control active slide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    const dots = carousel.getByTestId('premium-showcase-dots').locator('button')
    const count = await dots.count()
    if (count < 2) test.skip()

    // Initial dot is current.
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')

    // Click second dot — second slide becomes active.
    await dots.nth(1).click()
    await expect(carousel).toHaveAttribute('data-active-index', '1')
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'false')
  })

  test('inactive slides are hidden from assistive tech', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    const slide0 = carousel.locator('[data-slide-index="0"]')
    const slide1 = carousel.locator('[data-slide-index="1"]')
    await expect(slide0).toHaveAttribute('aria-hidden', 'false')
    await expect(slide1).toHaveAttribute('aria-hidden', 'true')
  })
```

- [ ] **Step 2: Run the new tests**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts`
Expected: 7 tests PASS (4 existing + 3 new).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/premium-showcase.spec.ts
git commit -m "test(e2e): cover slider arrows, dots, and aria-hidden state"
```

---

## Task 8: Auto-play with reduced-motion respect

**Files:**
- Modify: `src/components/home/PremiumShowcaseSlider.tsx`

- [ ] **Step 1: Write failing e2e test for auto-advance**

In `tests/e2e/premium-showcase.spec.ts`, append:

```ts
  test('auto-plays to next slide after interval (no reduced motion)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toHaveAttribute('data-active-index', '0')
    // Default auto-play is 5000ms. Wait a touch longer.
    await page.waitForTimeout(5500)
    const after = await carousel.getAttribute('data-active-index')
    expect(after).not.toBe('0')
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts -g "auto-plays"`
Expected: FAIL — slider doesn't auto-advance yet.

- [ ] **Step 3: Implement auto-play**

In `src/components/home/PremiumShowcaseSlider.tsx`, replace the entire component body to include auto-play. Find this section:

```tsx
  const prev = useCallback(() => go(active - 1), [active, go])
  const next = useCallback(() => go(active + 1), [active, go])

  // Reflect active state on slide elements (server-rendered children).
  useEffect(() => {
```

Insert *between* these two blocks (after `const next = ...` and before `// Reflect active state`):

```tsx
  // Auto-play: skip when single slide, reduced motion, hovered/focused, or document hidden.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (isSingle) return
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    if (paused) return

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setActive((cur) => (cur + 1) % safeTotal)
    }, autoPlayMs)
    return () => window.clearInterval(id)
  }, [isSingle, paused, autoPlayMs, safeTotal])
```

Then update the outer `<div ref={rootRef} ...>` to add hover/focus pause handlers. Find:

```tsx
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.eyebrow}
      data-testid="premium-showcase"
      data-active-index={active}
      className="relative h-full"
    >
```

Replace with:

```tsx
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.eyebrow}
      data-testid="premium-showcase"
      data-active-index={active}
      className="relative h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
```

- [ ] **Step 4: Build and run all premium-showcase tests**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts`
Expected: All 8 tests PASS. The reduced-motion test still passes (auto-play disabled when `prefers-reduced-motion: reduce`).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/PremiumShowcaseSlider.tsx tests/e2e/premium-showcase.spec.ts
git commit -m "feat: add auto-play with reduced-motion + pause-on-hover support"
```

---

## Task 9: Keyboard nav + swipe gestures

**Files:**
- Modify: `src/components/home/PremiumShowcaseSlider.tsx`

- [ ] **Step 1: Write failing e2e test for keyboard nav**

In `tests/e2e/premium-showcase.spec.ts`, append:

```ts
  test('keyboard ArrowRight advances when carousel is focused', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await carousel.focus()
    await expect(carousel).toHaveAttribute('data-active-index', '0')
    await page.keyboard.press('ArrowRight')
    await expect(carousel).toHaveAttribute('data-active-index', '1')
    await page.keyboard.press('ArrowLeft')
    await expect(carousel).toHaveAttribute('data-active-index', '0')
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts -g "keyboard"`
Expected: FAIL — keyboard nav not wired yet (also the carousel `<div>` isn't focusable).

- [ ] **Step 3: Implement keyboard nav + swipe**

In `src/components/home/PremiumShowcaseSlider.tsx`, add keyboard + pointer handling. Find the `useEffect` that handles auto-play (added in Task 8) and add a new `useEffect` after it:

```tsx
  // Keyboard navigation while carousel has focus.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'Home') { e.preventDefault(); go(0) }
      else if (e.key === 'End') { e.preventDefault(); go(safeTotal - 1) }
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [next, prev, go, safeTotal])

  // Touch / pointer swipe (mobile-first).
  const swipeStartX = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    swipeStartX.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const startX = swipeStartX.current
    swipeStartX.current = null
    if (startX === null) return
    const dx = e.clientX - startX
    if (Math.abs(dx) < 50) return
    if (dx < 0) next()
    else prev()
  }
```

You'll need to import `React` for the `React.PointerEvent` type. Find the top import line and update:

```tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
```

Change to:

```tsx
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
```

Then update the outer `<div>` to be focusable and receive pointer events. Find the existing `<div ref={rootRef} ...>` and add `tabIndex={0}`, `onPointerDown`, `onPointerUp`:

```tsx
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.eyebrow}
      data-testid="premium-showcase"
      data-active-index={active}
      className="relative h-full outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
```

- [ ] **Step 4: Run all premium-showcase tests**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts`
Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/PremiumShowcaseSlider.tsx tests/e2e/premium-showcase.spec.ts
git commit -m "feat: add keyboard arrow + swipe navigation to premium showcase slider"
```

---

## Task 10: Manual verification + responsive check

**Files:**
- None (manual QA)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`
Expected: Server starts on `http://localhost:5180`.

- [ ] **Step 2: Visual check at desktop (1280×800)**

Open `http://localhost:5180/` in browser, resize to ~1280px. Verify:
- Carousel shows top-left image, top-right details (60/40 split).
- Eyebrow "VİTRİN İLAN" + location chip visible.
- Title, type, badges (Yol/Su/Elektrik), price (`formatTLCompact`), m², CTA visible and readable.
- Metallic border + sheen visible on the outer card (no blurred bg image).
- Arrows on left/right edges; clicking advances slides.
- Dots at bottom; clicking jumps to slide.
- After ~5s with no interaction, slide auto-advances.
- Hover over the card → auto-play pauses.

- [ ] **Step 3: Visual check at mobile (375×812 — iPhone X)**

In Chrome DevTools, switch to iPhone X (or 375×812 manual). Verify:
- Image on top (16/9), details below.
- Arrows hidden.
- Dots visible.
- Text scales down (`text-xl` title, `text-2xl` price, smaller badges).
- Swipe left/right (use DevTools touch emulation or click+drag with `Toggle device toolbar`) advances slides.
- Title with long text uses `line-clamp-2`.

- [ ] **Step 4: Reduced-motion check**

In DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → "reduce". Verify:
- Carousel renders.
- After 6+ seconds, active slide hasn't changed.
- Manual arrows + dots still work.

- [ ] **Step 5: EN locale check**

Navigate to `http://localhost:5180/en/`. Verify:
- "FEATURED LISTING" eyebrow on first slide.
- "View listing" CTA.
- Badge labels: "Road", "Water", "Electricity", "Title deed ready".
- "Listing N of M" aria-label structure on slides.

- [ ] **Step 6: Single-slide edge case (visual sanity)**

This isn't trivially reproducible without a fixture, but verify behavior if pool is small: temporarily edit `src/components/home/PremiumShowcase.astro` to pass `limit={1}` to `selectShowcaseListings`. Reload. Verify:
- One slide renders.
- Arrows + dots hidden.
- No console errors.
- Revert the `limit={1}` change.

- [ ] **Step 7: Full e2e suite**

Run: `pnpm test:e2e tests/e2e/premium-showcase.spec.ts`
Expected: All 9 tests PASS.

- [ ] **Step 8: Full typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: Both PASS.

- [ ] **Step 9: Final commit if any cleanup**

If there were any small fixes from manual QA:

```bash
git add -A
git commit -m "fix: minor polish from premium showcase manual QA"
```

---

## Self-review log

**Spec coverage check (cross-referenced with `2026-05-16-premium-showcase-redesign-design.md`):**
- "Çoklu vitrin ilanları slider" → Tasks 1, 4, 5 ✓
- "Net görsel" → Task 3 uses `ResponsiveListingImage` directly, no blur filter ✓
- "Detay paneli: başlık, konum, fiyat, m², tip, rozetler" → Task 3 markup ✓
- "Responsive: mobilde üst-alt yığın, desktop yan yana" → Task 3 grid + breakpoint classes ✓
- "Metalik border + sheen + noise korunur" → Task 5 keeps `.reflective-noise`, `.reflective-sheen`, `.reflective-border` ✓
- "Blur'lu bg image kaldırılır" → Task 5 removes `.reflective-bg`, SVG filter, blurred image ✓
- "Auto-play 5s, reduced-motion'da kapalı, hover'da durur, visibility'de durur" → Task 8 ✓
- "Oklar (desktop), dots (her boyut)" → Task 4 markup, `hidden md:inline-flex` for arrows ✓
- "Klavye ← →, Home/End" → Task 9 ✓
- "Swipe ≥50px" → Task 9 ✓
- "ARIA: roledescription=carousel, slide labels, aria-hidden inactive, aria-current dot" → Tasks 3, 4 ✓
- "Tek slide edge case: oklar/dots gizli" → Task 4 `isSingle` guard ✓
- "0 slide: hiçbir şey render etmez" → Task 5 `{slides.length > 0 && ...}` ✓
- "i18n yeni keys" → Task 2 ✓
- "Birim test: selectShowcaseListings" → Task 1 ✓
- "E2E güncelle + yeni testler" → Tasks 6, 7, 8, 9 ✓
- "Performans: ilk slide eager, diğerleri lazy, slider client:visible" → Task 3 (`isFirst` eager) + Task 5 (`client:visible`) ✓

**Type consistency:**
- `SelectOptions { limit?, override? }` (Task 1) is consumed in Task 5 (`{ limit, override }`) ✓
- `PremiumShowcaseSliderProps { total, labels, autoPlayMs?, children? }` (Task 4) — consumed in Task 5 with `total={slides.length}` and `labels={...}` ✓
- Slide `data-slide-index`, `data-active`, `data-testid="premium-showcase-slide"`, `data-testid="premium-showcase-link"` defined in Task 3, referenced in Tasks 4, 6, 7 ✓
- Slider `data-testid="premium-showcase"`, `data-active-index`, `data-testid="premium-showcase-prev"`, `data-testid="premium-showcase-next"`, `data-testid="premium-showcase-dots"` defined in Task 4, referenced in Tasks 6, 7, 8 ✓
- `dict.badgeRoad/Water/Electricity/TitleDeed` defined in Task 2, consumed in Task 3 ✓
- `labels.prev/next/goToSlide/eyebrow` defined in Task 5, consumed in Task 4 ✓

**Placeholder scan:** No TBD, no "implement later", no "similar to Task N" without code. All steps include exact code blocks or commands.

**Files-that-change-together check:** i18n changes split across `tr.ts` + `en.ts` in one task. Slide markup + image asset path in same file. Slider controls + auto-play + keyboard all in `PremiumShowcaseSlider.tsx`, evolving through Tasks 4, 8, 9.
