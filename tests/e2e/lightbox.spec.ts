import { test, expect } from '@playwright/test'

// Slug rule for /ilan: `${slugify(title)}-${id}` where `id` keeps dots/case
// (only `title` is slugified). The first mock listing is "Cunda · denize 80m
// …" with id "28.AY.0142" → see packages/data/src/mock/listings.ts.
const LISTING_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'

test.describe('Listing detail lightbox', () => {
  test('opens via "Galeriyi aç", navigates with arrows, closes with Esc', async ({
    page,
  }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    // LightboxRoot mounts with `client:load`, so the delegated click listener
    // is wired up as soon as the page is interactive. The button itself is a
    // hydration target — wait for it to be visible AND for the island to have
    // attached its handler. Polling `dataset` of an island wrapper is brittle
    // across browsers, so we instead try once and rely on `toBeVisible`'s
    // built-in 5s retry to absorb iOS WebKit hydration latency.
    const trigger = page.locator('[data-gallery-open]')
    await expect(trigger).toBeVisible()
    // Give iOS WebKit one extra frame to flush the LightboxRoot useEffect.
    await page.waitForFunction(() => !!document.querySelector('[data-gallery]'))
    await trigger.click()

    const modal = page.getByTestId('lightbox-modal')
    await expect(modal).toBeVisible()
    const caption = page.getByTestId('lightbox-caption')
    await expect(caption).toContainText('1 /')

    await page.keyboard.press('ArrowRight')
    await expect(caption).toContainText('2 /')

    await page.keyboard.press('ArrowLeft')
    await expect(caption).toContainText('1 /')

    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
  })

  test('returns focus to trigger after close', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const trigger = page.locator('[data-gallery-open]')
    await expect(trigger).toBeVisible()
    await trigger.focus()
    await trigger.press('Enter')
    await expect(page.getByTestId('lightbox-modal')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('share popover exposes Yazdır action', async ({ page }) => {
    // ShareButtons defers to `navigator.share` when available (mobile + Safari
    // macOS) and only opens the popover when the native sheet is dismissed.
    // The popover-with-Yazdır flow is the *fallback* path, so neuter
    // `navigator.share` before navigation so every browser/device project
    // exercises the same code path.
    await page.addInitScript(() => {
      // Walk up the prototype chain and remove `share` wherever it lives.
      // Mobile/iPad Safari define it on a non-extensible prototype, so a
      // simple `delete navigator.share` is silently ignored.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any
      const targets = [nav, Object.getPrototypeOf(nav), Object.getPrototypeOf(Object.getPrototypeOf(nav))]
      for (const t of targets) {
        if (!t) continue
        try {
          Object.defineProperty(t, 'share', { value: undefined, configurable: true })
        } catch {
          // descriptor locked — try the next prototype
        }
      }
    })
    await page.goto(`/ilan/${LISTING_SLUG}`)
    // ShareButtons mounts via `client:idle`; iPad WebKit can be slow to fire
    // requestIdleCallback. Wait for network idle so the island has a fair
    // chance to hydrate before we click — without this, the click hits the
    // SSR DOM (no onClick handler attached) and the popover never opens.
    await page.waitForLoadState('networkidle')
    const shareTrigger = page.getByTestId('share-trigger')
    await expect(shareTrigger).toBeVisible()
    await shareTrigger.click()
    await expect(page.getByTestId('share-print')).toBeVisible()
  })
})
