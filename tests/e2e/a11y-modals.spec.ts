import { expect, test } from '@playwright/test'

/**
 * Wave F23.C — focus-trap + ARIA live coverage for the three public-site
 * dialogs that used to ship inline trap copies:
 *   - LightboxModal (listing gallery)
 *   - CookieConsentModal (footer banner)
 *   - MobileFilterSheet (mobile-only — uses a phone viewport)
 *
 * All three now consume the shared `trapFocus` helper from `lib/a11y.ts`.
 * The cases below assert the externally-observable contract:
 *   1. Tab cycles within the dialog (forward + backward), never leaks to the
 *      underlying page.
 *   2. Escape closes the dialog.
 *   3. Focus returns to the previously-active element (trigger) on close.
 * A 4th case exercises the singleton aria-live region populated by
 * `announce()` when cookie preferences are saved.
 */

const LISTING_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'
const CONSENT_KEY = 'arsam.cookie-consent.v1'

test.describe('a11y: Lightbox modal focus trap', () => {
  test('Tab cycles inside the modal and Escape returns focus to trigger', async ({
    page,
  }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const trigger = page.locator('[data-gallery-open]')
    await expect(trigger).toBeVisible()
    await page.waitForFunction(() => !!document.querySelector('[data-gallery]'))
    await trigger.focus()
    await trigger.press('Enter')

    const modal = page.getByTestId('lightbox-modal')
    await expect(modal).toBeVisible()
    // Initial focus lands inside the dialog (close button).
    await expect(page.getByTestId('lightbox-close')).toBeFocused()

    // Cycle forward through all focusables — never escape the dialog.
    // The exact tab count depends on whether `total > 1` (prev/next render),
    // but every step must keep focus within the modal subtree.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const modalEl = document.querySelector('[data-testid="lightbox-modal"]')
        return modalEl ? modalEl.contains(document.activeElement) : false
      })
      expect(inside).toBe(true)
    }

    // Cycle backward — same invariant.
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press('Shift+Tab')
      const inside = await page.evaluate(() => {
        const modalEl = document.querySelector('[data-testid="lightbox-modal"]')
        return modalEl ? modalEl.contains(document.activeElement) : false
      })
      expect(inside).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('a11y: Cookie consent modal focus trap + announce', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }, CONSENT_KEY)
  })

  test('Tab stays inside, Escape closes, focus restored to "Customize" trigger', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-consent-banner')
    await expect(banner).toBeVisible({ timeout: 5000 })

    const customize = page.getByTestId('cookie-consent-customize')
    await customize.focus()
    await customize.press('Enter')

    const modal = page.getByTestId('cookie-consent-modal')
    await expect(modal).toBeVisible()

    // Tab forward 8 times, focus must remain inside the dialog every time.
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const modalEl = document.querySelector(
          '[data-testid="cookie-consent-modal"]',
        )
        return modalEl ? modalEl.contains(document.activeElement) : false
      })
      expect(inside).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
    await expect(customize).toBeFocused()
  })

  test('Save fires announce() into the singleton live region', async ({ page }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-consent-banner')
    await expect(banner).toBeVisible({ timeout: 5000 })
    await page.getByTestId('cookie-consent-customize').click()
    const modal = page.getByTestId('cookie-consent-modal')
    await expect(modal).toBeVisible()

    await page.getByTestId('cookie-consent-modal-save').click()
    await expect(modal).toHaveCount(0)

    // The singleton polite region is appended to <body> and re-uses id
    // `a11y-live-polite`. `announce()` writes the message asynchronously
    // (setTimeout 16ms) so we poll up to a generous bound.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const region = document.getElementById('a11y-live-polite')
            return region?.textContent ?? ''
          }),
        { timeout: 2000 },
      )
      .toMatch(/(Çerez tercihleri kaydedildi|Cookie preferences saved)/)
  })
})

test.describe('a11y: MobileFilterSheet focus trap', () => {
  // Bottom-sheet renders `md:hidden`, so this only fires on the mobile project.
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, 'mobile only')

  test('Tab cycles inside, Escape closes, focus restored to filter trigger', async ({
    page,
  }) => {
    await page.goto('/ara')
    const trigger = page.locator('[data-filter-sheet-trigger]')
    await expect(trigger).toBeVisible()
    await trigger.focus()
    await trigger.press('Enter')

    const sheet = page.locator('[data-filter-sheet-dialog]')
    await expect(sheet).toBeVisible()

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const sheetEl = document.querySelector('[data-filter-sheet-dialog]')
        return sheetEl ? sheetEl.contains(document.activeElement) : false
      })
      expect(inside).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})
