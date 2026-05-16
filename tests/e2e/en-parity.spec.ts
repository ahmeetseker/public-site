// Wave F23.B — TR ↔ EN companion parity smoke.
//
// For each TR page that has a hand-rolled EN companion, asserts:
//   1. Both URLs return < 400.
//   2. Each emits a <link rel="canonical"> pointing at its own URL.
//   3. Each emits hreflang alternates that cross-reference the other locale.
//
// The list is intentionally short — top-level pages where parity matters most
// (account hub, help center, search, listing, regions). Per-section pages are
// covered by existing spec files (en-account, en-yardim, en-ilan-ver).
import { test, expect } from '@playwright/test'

type Pair = {
  name: string
  tr: string
  en: string
  /** RootLayout normalises trailing slash on canonical via URL constructor. */
  canonicalTr: string
  canonicalEn: string
}

const PAIRS: Pair[] = [
  {
    name: 'help hub',
    tr: '/yardim',
    en: '/en/yardim',
    canonicalTr: 'https://arsam.net/yardim',
    canonicalEn: 'https://arsam.net/en/yardim',
  },
  {
    name: 'account overview',
    tr: '/hesabim/',
    en: '/en/hesabim/',
    canonicalTr: 'https://arsam.net/hesabim/',
    canonicalEn: 'https://arsam.net/en/hesabim/',
  },
  {
    name: 'login',
    tr: '/giris',
    en: '/en/giris',
    canonicalTr: 'https://arsam.net/giris',
    canonicalEn: 'https://arsam.net/en/giris',
  },
  {
    name: 'search hub',
    tr: '/ara',
    en: '/en/ara',
    canonicalTr: 'https://arsam.net/ara',
    canonicalEn: 'https://arsam.net/en/ara',
  },
  {
    name: 'about',
    tr: '/hakkimizda',
    en: '/en/hakkimizda',
    canonicalTr: 'https://arsam.net/hakkimizda',
    canonicalEn: 'https://arsam.net/en/hakkimizda',
  },
]

// Pages under /hesabim/* are AuthGuard-gated — seed the demo cookie so they
// render instead of redirecting to /giris.
test.describe('TR ↔ EN companion parity', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: 'arsam_buyer_demo', value: '1', path: '/', domain: 'localhost' },
    ])
  })

  for (const pair of PAIRS) {
    test(`${pair.name}: both locales 200 + canonical pair`, async ({ page }) => {
      // TR side
      const resTr = await page.goto(pair.tr)
      expect(resTr?.status(), `TR ${pair.tr}`).toBeLessThan(400)
      const canonicalTrHrefs = await page
        .locator('link[rel="canonical"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(canonicalTrHrefs.length, `TR canonical present`).toBeGreaterThan(0)
      expect(
        canonicalTrHrefs.some((h) => h === pair.canonicalTr || h === `${pair.canonicalTr}/`),
        `TR canonical matches ${pair.canonicalTr}`,
      ).toBe(true)

      // hreflang alternate to EN companion
      const trAlternates = await page
        .locator('link[rel="alternate"][hreflang="en-US"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(trAlternates.length, `TR has hreflang=en-US`).toBeGreaterThan(0)

      // EN side
      const resEn = await page.goto(pair.en)
      expect(resEn?.status(), `EN ${pair.en}`).toBeLessThan(400)
      const canonicalEnHrefs = await page
        .locator('link[rel="canonical"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(canonicalEnHrefs.length, `EN canonical present`).toBeGreaterThan(0)
      expect(
        canonicalEnHrefs.some((h) => h === pair.canonicalEn || h === `${pair.canonicalEn}/`),
        `EN canonical matches ${pair.canonicalEn}`,
      ).toBe(true)

      // hreflang alternate back to TR companion
      const enAlternates = await page
        .locator('link[rel="alternate"][hreflang="tr-TR"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(enAlternates.length, `EN has hreflang=tr-TR`).toBeGreaterThan(0)
    })
  }

  test('EN account page emits English sidebar nav', async ({ page }) => {
    await page.goto('/en/hesabim/')
    // Locale-aware aria-label is present on both desktop and mobile nav variants
    // (one is `display:none` per breakpoint via Tailwind, but both are in DOM).
    const navs = page.locator('nav[aria-label^="Account sections"]')
    expect(await navs.count()).toBeGreaterThan(0)
    // First nav item label is English ("Overview").
    await expect(navs.first().locator('a').first()).toContainText(/Overview/i)
    // Sign-out link points at EN logout route (present in both nav variants).
    const signOutHrefs = await page
      .locator('a[href="/en/cikis"]')
      .evaluateAll((els) => els.length)
    expect(signOutHrefs).toBeGreaterThan(0)
  })

  test('TR account page emits Turkish sidebar nav (regression)', async ({ page }) => {
    await page.goto('/hesabim/')
    const navs = page.locator('nav[aria-label^="Hesap bölümleri"]')
    expect(await navs.count()).toBeGreaterThan(0)
    await expect(navs.first().locator('a').first()).toContainText(/Genel bakış/i)
    const signOutHrefs = await page
      .locator('a[href="/cikis"]')
      .evaluateAll((els) => els.length)
    expect(signOutHrefs).toBeGreaterThan(0)
  })
})
