# Premium Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt React Bits `ReflectiveCard` as a homepage "premium listing showcase" between `<Hero>` and `<FeaturedListings>` — pure Astro component, 0 JS bundle, webcam swapped for `ListingImage`, metallic SVG filter preserved.

**Architecture:** Single Astro file (`PremiumShowcase.astro`) renders a server-side `<a>` card with a stack of layered divs (background image with SVG filter, noise, sheen, content, border). Selection heuristic picks the highest-priced active `İmarlı` listing. Inserted into both `/` (TR) and `/en/` (EN) homepages.

**Tech Stack:** Astro 6 (SSG), Tailwind v4 utilities + scoped `<style>`, `@landx/icons` (lucide-react re-export, SSR'd without hydration), `@landx/data` (`LISTINGS`, `Listing` type), `@landx/ui/lib` (`formatTLCompact`), `@/components/image/ListingImage.astro`, existing i18n (`useDict`/`t`).

**Spec reference:** `docs/superpowers/specs/2026-05-16-premium-showcase-design.md`

---

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/components/home/PremiumShowcase.astro` | Component: selection helper + DOM + SVG filter + scoped styles |
| Modify | `src/i18n/tr.ts` | Add `homepage.showcase` namespace (eyebrow, ctaLabel, priceLabel, sizeLabel) |
| Modify | `src/i18n/en.ts` | Mirror EN translations |
| Modify | `src/pages/index.astro` | Mount `<PremiumShowcase>` between Hero and FeaturedListings |
| Modify | `src/pages/en/index.astro` | Same for EN |
| Create | `tests/e2e/premium-showcase.spec.ts` | E2E: visibility, link target, reduced-motion fallback |

---

## Task 1: Add i18n strings

**Files:**
- Modify: `src/i18n/tr.ts:122-126` (after the `featured` block inside `homepage`)
- Modify: `src/i18n/en.ts:122-126` (mirror)

- [ ] **Step 1.1: Add `homepage.showcase` to `tr.ts`**

Open `src/i18n/tr.ts`. Find the `featured` block ending at line 126 (closes with `},`). Insert immediately after it, still inside `homepage`:

```ts
    showcase: {
      eyebrow: 'VİTRİN İLAN',
      ctaLabel: 'İlanı incele',
      priceLabel: 'Fiyat',
      sizeLabel: 'm²',
    },
```

- [ ] **Step 1.2: Add `homepage.showcase` to `en.ts`**

Open `src/i18n/en.ts`. Find the `featured` block ending at line 126. Insert immediately after:

```ts
    showcase: {
      eyebrow: 'FEATURED LISTING',
      ctaLabel: 'View listing',
      priceLabel: 'Price',
      sizeLabel: 'sqm',
    },
```

- [ ] **Step 1.3: Verify TypeScript compiles**

Run: `pnpm --filter @landx/public-site exec astro check`
Expected: 0 errors (the dictionaries are typed `as const` but loose; adding new keys is additive).

- [ ] **Step 1.4: Commit**

```bash
git add src/i18n/tr.ts src/i18n/en.ts
git commit -m "i18n: add homepage.showcase namespace"
```

---

## Task 2: Write failing E2E test for showcase visibility

**Files:**
- Create: `tests/e2e/premium-showcase.spec.ts`

- [ ] **Step 2.1: Create the spec file**

Create `tests/e2e/premium-showcase.spec.ts` with this exact content:

```ts
import { test, expect } from '@playwright/test'

test.describe('Premium Showcase', () => {
  test('renders showcase card with eyebrow and CTA', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('premium-showcase')
    await expect(card).toBeVisible()
    await expect(card.getByText('VİTRİN İLAN')).toBeVisible()
    await expect(card.getByText(/İlanı incele/i)).toBeVisible()
  })

  test('card links to a listing detail page', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('premium-showcase')
    const href = await card.getAttribute('href')
    expect(href).toMatch(/^\/ilan\/[a-z0-9-]+$/)
  })

  test('respects prefers-reduced-motion (no metallic-displacement filter)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const bg = page.getByTestId('premium-showcase-bg')
    const filter = await bg.evaluate((el) => getComputedStyle(el).filter)
    expect(filter).not.toContain('metallic-displacement')
    await context.close()
  })

  test('EN homepage shows the English showcase label', async ({ page }) => {
    await page.goto('/en/')
    const card = page.getByTestId('premium-showcase')
    await expect(card).toBeVisible()
    await expect(card.getByText('FEATURED LISTING')).toBeVisible()
  })
})
```

- [ ] **Step 2.2: Run the test to confirm it fails**

Run: `pnpm --filter @landx/public-site exec playwright test premium-showcase --reporter=line`
Expected: All 4 tests FAIL — selector `[data-testid="premium-showcase"]` not found on page.

- [ ] **Step 2.3: Commit**

```bash
git add tests/e2e/premium-showcase.spec.ts
git commit -m "test: add failing e2e for premium showcase"
```

---

## Task 3: Create PremiumShowcase component (structure only, no filter yet)

**Files:**
- Create: `src/components/home/PremiumShowcase.astro`
- Modify: `src/pages/index.astro` (insert between Hero and FeaturedListings)

This task lands the DOM, the listing selection, the link wrapper, and `data-testid` hooks so Tasks 2.1's first two tests pass. SVG filter + visual layers come in Task 4.

- [ ] **Step 3.1: Create `PremiumShowcase.astro` with structure + selection**

Create `src/components/home/PremiumShowcase.astro` with this exact content:

```astro
---
import { LISTINGS, type Listing } from '@landx/data'
import { formatTLCompact } from '@landx/ui/lib'
import { Lock, MapPin, Maximize2 } from '@landx/icons'
import ListingImage from '@/components/image/ListingImage.astro'
import { useDict, detectLocaleFromPath, type Locale } from '@/i18n'

export interface Props {
  locale?: Locale
  listing?: Listing
}

const locale: Locale = Astro.props.locale ?? detectLocaleFromPath(Astro.url.pathname)
const prefix = locale === 'en' ? '/en' : ''
const dict = useDict('homepage.showcase', locale) as Record<string, string>

// Selection heuristic: prop override → highest-priced active İmarlı → first active listing.
function selectShowcaseListing(override?: Listing): Listing | null {
  if (override) return override
  const active = LISTINGS.filter((l) => l.status === 'Aktif')
  if (active.length === 0) return null
  const imarli = active.filter((l) => l.type === 'İmarlı')
  if (imarli.length > 0) {
    return [...imarli].sort((a, b) => b.price - a.price)[0]
  }
  return active[0]
}

const listing = selectShowcaseListing(Astro.props.listing)

const slugify = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
---

{
  listing && (
    <section class="border-t border-border bg-background">
      <div class="mx-auto max-w-[1280px] px-4 py-12 md:py-16">
        <a
          href={`${prefix}/ilan/${slugify(listing.title)}-${listing.id}`}
          data-testid="premium-showcase"
          class="reflective-card-container relative block overflow-hidden rounded-3xl bg-[#1a1a1a] aspect-[16/9] md:aspect-[21/9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <div data-testid="premium-showcase-bg" class="reflective-bg absolute inset-0 h-full w-full">
            <ListingImage
              listingId={listing.id}
              district={listing.district}
              ratio="16/9"
              index={1}
              alt={`${listing.title} — vitrin ilanı`}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>

          <div class="reflective-content absolute inset-0 z-10 flex h-full flex-col justify-between p-6 text-white md:p-10">
            <header class="flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2 py-1 font-mono text-xs uppercase tracking-[0.18em]">
                <Lock size={14} aria-hidden="true" />
                <span>{dict.eyebrow}</span>
              </span>
              <span class="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-white/80">
                <MapPin size={14} aria-hidden="true" />
                <span>{listing.district}</span>
              </span>
            </header>

            <div class="flex flex-col items-center gap-2 text-center">
              <h2 class="font-serif text-3xl font-normal tracking-tight md:text-4xl">
                {listing.title}
              </h2>
              <p class="font-mono text-xs uppercase tracking-[0.2em] text-white/70">
                {listing.type} · {listing.city}
              </p>
            </div>

            <footer class="flex items-end justify-between gap-4">
              <div class="flex flex-col gap-0.5">
                <span class="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {dict.priceLabel}
                </span>
                <span class="font-serif text-2xl tabular-nums md:text-3xl">
                  {formatTLCompact(listing.price)}
                </span>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-white/90">
                  <Maximize2 size={14} aria-hidden="true" />
                  {listing.size.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')} {dict.sizeLabel}
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                  {dict.ctaLabel}
                </span>
              </div>
            </footer>
          </div>
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 3.2: Mount on TR homepage**

Open `src/pages/index.astro`. Add the import alongside the others (after `import Hero` line around line 3):

```astro
import PremiumShowcase from '@/components/home/PremiumShowcase.astro'
```

Then in the markup, insert the component between `<Hero />` and `<RecentViewedSection />`:

```astro
  <Hero locale={locale} />
  <PremiumShowcase locale={locale} />
  <RecentViewedSection client:visible />
```

- [ ] **Step 3.3: Visually verify with dev server**

Run: `pnpm --filter @landx/public-site run dev`
Open: `http://localhost:5180/`
Expected: A panoramic card appears under the hero with district, title, price, m², and "İlanı incele" CTA. No metallic effect yet (Task 4) — just plain image + overlay text. The card is a link to `/ilan/<slug>-<id>`.

Stop the dev server (Ctrl-C) when done.

- [ ] **Step 3.4: Run the first two E2E tests**

Run: `pnpm --filter @landx/public-site exec playwright test premium-showcase -g "renders showcase|links to a listing"`
Expected: Both tests PASS.

The reduced-motion test (3rd) and EN test (4th) still fail — handled in Tasks 4 and 6.

- [ ] **Step 3.5: Commit**

```bash
git add src/components/home/PremiumShowcase.astro src/pages/index.astro
git commit -m "feat: add PremiumShowcase component structure"
```

---

## Task 4: Add SVG filter, noise, sheen, and border layers

**Files:**
- Modify: `src/components/home/PremiumShowcase.astro` (add SVG defs, three layer divs, `<style>` block)

This task adds the metallic-displacement filter and the decorative layers that make the card "reflective".

- [ ] **Step 4.1: Add inline SVG defs and layer divs**

In `src/components/home/PremiumShowcase.astro`, locate the `<ListingImage … />` line (inside the `<a>` element). Insert the following **immediately before** `<ListingImage`:

```astro
          <svg class="reflective-svg-filters" aria-hidden="true">
            <defs>
              <filter id="metallic-displacement" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="turbulence" baseFrequency="0.0167" numOctaves="2" result="noise" />
                <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="rippled" />
                <feSpecularLighting in="noiseAlpha" surfaceScale="18" specularConstant="1.8" specularExponent="20" lightingColor="#ffffff" result="light">
                  <fePointLight x="0" y="0" z="300" />
                </feSpecularLighting>
                <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
                <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="solidAlpha" />
                <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
                <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
                <feComponentTransfer in="blurredMap" result="glassMap">
                  <feFuncA type="linear" slope="0.5" intercept="0" />
                </feComponentTransfer>
                <feDisplacementMap in="metallic-result" in2="glassMap" scale="24" xChannelSelector="A" yChannelSelector="A" result="final" />
              </filter>
            </defs>
          </svg>
```

- [ ] **Step 4.2: Add the three decorative layer divs**

The image wrapper with `data-testid="premium-showcase-bg"` and `class="reflective-bg"` was already added in Task 3.1, so no change to it here. Insert the three decorative layers directly after the image wrapper's closing `</div>` and before `<div class="reflective-content …">`:

```astro
          <div class="reflective-noise" aria-hidden="true"></div>
          <div class="reflective-sheen" aria-hidden="true"></div>
          <div class="reflective-border" aria-hidden="true"></div>
```

- [ ] **Step 4.3: Add scoped `<style>` block**

Append the following `<style>` block at the very end of `src/components/home/PremiumShowcase.astro` (after the closing `}`):

```astro
<style>
  .reflective-card-container {
    isolation: isolate;
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  .reflective-svg-filters {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    opacity: 0;
  }

  .reflective-bg {
    z-index: 0;
    opacity: 0.9;
    transform: scale(1.05);
    filter:
      saturate(0.4)
      contrast(1.2)
      brightness(1.1)
      blur(8px)
      url(#metallic-displacement);
    transition: filter 0.3s ease;
  }

  .reflective-noise {
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.25;
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
    opacity: 0.7;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.1) 40%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.1) 60%,
      rgba(255, 255, 255, 0.3) 100%
    );
  }

  .reflective-border {
    position: absolute;
    inset: 0;
    z-index: 20;
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

  .reflective-content {
    background: rgba(0, 0, 0, 0.35);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* Reduced-motion + small-screen fallback: drop the expensive displacement filter. */
  @media (prefers-reduced-motion: reduce), (max-width: 640px) {
    .reflective-bg {
      filter:
        saturate(0.4)
        contrast(1.2)
        brightness(1.1)
        blur(8px);
    }
  }
</style>
```

- [ ] **Step 4.4: Visually verify with dev server**

Run: `pnpm --filter @landx/public-site run dev`
Open: `http://localhost:5180/`
Expected: The card now has a metallic/rippled background, diagonal sheen, faint grain, and a thin gradient border. Text remains readable against the dark overlay. Resize the window narrower than 640px — the heavy displacement filter drops out (the image stays blurred + desaturated without ripples). Stop server.

- [ ] **Step 4.5: Run astro check**

Run: `pnpm --filter @landx/public-site exec astro check`
Expected: 0 errors.

- [ ] **Step 4.6: Commit**

```bash
git add src/components/home/PremiumShowcase.astro
git commit -m "feat: add metallic SVG filter and reflective layers to showcase"
```

---

## Task 5: Verify reduced-motion E2E test passes

**Files:**
- (No code changes — verifies Task 4 satisfied Task 2.1's third test.)

- [ ] **Step 5.1: Run the reduced-motion test**

Run: `pnpm --filter @landx/public-site exec playwright test premium-showcase -g "reduced-motion"`
Expected: PASS — computed `filter` on `[data-testid="premium-showcase-bg"]` does NOT contain `metallic-displacement` when context has `reducedMotion: 'reduce'`.

- [ ] **Step 5.2: If it fails, debug**

The most likely cause: Playwright's `reducedMotion: 'reduce'` context option isn't propagating, or the CSS media-query syntax isn't matching. If failing:
- Open `http://localhost:5180/` in Chrome devtools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce".
- In console, run `getComputedStyle(document.querySelector('[data-testid=premium-showcase-bg]')).filter` and confirm the output does NOT contain `url("#metallic-displacement")`.
- If the browser shows the reduced filter but Playwright still fails, the test viewport may be wider than 640px (which is the other branch of the media query — should already drop the filter). Print `await bg.evaluate(el => getComputedStyle(el).filter)` to inspect actual value and adjust assertion.

No commit in this step unless a selector change is required.

---

## Task 6: Mount on EN homepage

**Files:**
- Modify: `src/pages/en/index.astro` (insert `<PremiumShowcase>` between Hero and FeaturedListings)

- [ ] **Step 6.1: Add import and mount**

Open `src/pages/en/index.astro`. After the `import Hero from '@/components/home/Hero.astro'` line, add:

```astro
import PremiumShowcase from '@/components/home/PremiumShowcase.astro'
```

In the markup, between `<Hero locale={locale} />` and `<PopularRegions locale={locale} />`, insert:

```astro
  <PremiumShowcase locale={locale} />
```

Note: EN homepage has no `<RecentViewedSection>`, so we place the showcase directly after Hero, before PopularRegions. (TR has `RecentViewedSection` between Hero and PopularRegions; showcase still goes immediately after Hero per spec.)

- [ ] **Step 6.2: Run EN E2E test**

Run: `pnpm --filter @landx/public-site exec playwright test premium-showcase -g "EN homepage"`
Expected: PASS — `FEATURED LISTING` text visible on `/en/`.

- [ ] **Step 6.3: Run full premium-showcase suite**

Run: `pnpm --filter @landx/public-site exec playwright test premium-showcase --reporter=line`
Expected: All 4 tests PASS.

- [ ] **Step 6.4: Commit**

```bash
git add src/pages/en/index.astro
git commit -m "feat: mount PremiumShowcase on EN homepage"
```

---

## Task 7: Final verification

**Files:** None — pure verification.

- [ ] **Step 7.1: Astro check**

Run: `pnpm --filter @landx/public-site exec astro check`
Expected: `0 errors, 0 warnings`. If any errors, fix them inline before continuing.

- [ ] **Step 7.2: Production build**

Run: `pnpm --filter @landx/public-site run build`
Expected: Build succeeds. Verify the homepage HTML in `dist/index.html` contains the string `VİTRİN İLAN` and a `<filter id="metallic-displacement">` element.

Quick check:
```bash
grep -c "VİTRİN İLAN" dist/index.html
grep -c 'metallic-displacement' dist/index.html
```
Both should output `1` or higher.

- [ ] **Step 7.3: Run full E2E suite (regression check)**

Run: `pnpm --filter @landx/public-site run test:e2e --reporter=line`
Expected: All tests pass. If any pre-existing test fails because the homepage layout changed (e.g., a test that relied on `Hero` being immediately followed by `RecentViewedSection`), investigate and decide:
- If the test was implicitly coupled to ordering, update it.
- If the showcase broke a real flow, fix the showcase.

- [ ] **Step 7.4: Manual screenshot smoke test**

Run: `pnpm --filter @landx/public-site run dev`
- Open `http://localhost:5180/` — confirm showcase appears with TR labels.
- Open `http://localhost:5180/en/` — confirm showcase appears with EN labels (`FEATURED LISTING`, `View listing`, `Price`, `sqm`).
- Resize browser to mobile width (~375px) — confirm card scales, filter simplifies.
- DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" — confirm metallic ripples disappear, sheen and border remain.

Stop the dev server.

- [ ] **Step 7.5: Final commit (if any drift / no-op otherwise)**

```bash
git status
```
If clean, skip. Otherwise commit any fixups from Steps 7.3-7.4:
```bash
git add -A
git commit -m "fix: address verification fallout from premium showcase"
```

---

## Done criteria

- All 4 E2E tests in `tests/e2e/premium-showcase.spec.ts` pass.
- `astro check` reports 0 errors.
- `astro build` produces a homepage containing the showcase HTML and the SVG filter.
- Visual smoke test confirms TR + EN + mobile + reduced-motion variants render correctly.
- No new dependencies in `package.json`.
- 0 JS bytes added to the homepage bundle (verify with `ls -la dist/_astro/*.js | wc -l` returning the same count as before, or by inspecting the homepage `<script>` tags in `dist/index.html`).
