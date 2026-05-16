import { expect, test } from '@playwright/test'

/**
 * Wave F5 / Agent-F5B — /en/ilan-ver/* parity E2E.
 *
 * Mirrors the TR ilan-ver flow at /en/. Verifies:
 *   1. All 4 step routes + onizleme + tesekkurler are reachable.
 *   2. The wizard island renders English copy (Next button, Back button,
 *      Save draft).
 *   3. Internal navigation stays on /en/ when locale="en".
 */

const DRAFT_KEY = 'arsam.ilan-draft.v1'

test.describe('/en/ilan-ver wizard', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.ilan-draft.v1')
        window.localStorage.removeItem('arsam:ilan-ver:state')
      } catch {
        /* ignore */
      }
    })
  })

  test('all 4 step routes load + html lang is en', async ({ page }) => {
    await page.goto('/en/ilan-ver/')
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/)
    for (const step of [1, 2, 3, 4]) {
      const res = await page.goto(`/en/ilan-ver/${step}`)
      expect(res?.status() ?? 200).toBeLessThan(400)
    }
    const preview = await page.goto('/en/ilan-ver/onizleme')
    expect(preview?.status() ?? 200).toBeLessThan(400)
    const success = await page.goto('/en/ilan-ver/tesekkurler')
    expect(success?.status() ?? 200).toBeLessThan(400)
  })

  test('wizard renders EN copy on step 1', async ({ page }) => {
    await page.goto('/en/ilan-ver/1')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    // Save draft button in English.
    await expect(page.locator('[data-wizard-save]')).toHaveText(/Save draft/)
    // Back button (disabled on step 1) carries EN text.
    await expect(page.locator('[data-wizard-prev]')).toContainText('Back')
    // Step labels in StepIndicator come from LABELS.en.steps.
    await expect(page.locator('[data-step-indicator]')).toContainText('Location')
    await expect(page.locator('[data-step-indicator]')).toContainText('Features')
  })

  test('full flow on EN keeps user under /en/ throughout', async ({ page }) => {
    await page.goto('/en/ilan-ver/1')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    // Step 1
    await page.locator('[data-field="il"]').selectOption('Muğla')
    await page.locator('[data-field="ilce"]').fill('Datça · Hızırşah')
    await page.locator('[data-field="tip"][data-value="zeytinlik"]').click()
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/en\/ilan-ver\/2/)

    // Step 2
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="alan"]').fill('3200')
    await page.locator('[data-field="imar"]').selectOption('tarim')
    await page.locator('[data-field="tapu"][data-value="mustakil"]').click()
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/en\/ilan-ver\/3/)

    // Step 3
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="fiyat"]').fill('5400000')
    await page
      .locator('[data-field="aciklama"]')
      .fill('Datça peninsula, sea view, 120-year-old olive trees, road frontage.')
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/en\/ilan-ver\/4/)

    // Step 4
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="ad"]').fill('Ayşe Yılmaz')
    await page.locator('[data-field="telefon"]').fill('+90 532 111 22 33')
    await page.locator('[data-field="kvkk"]').check()
    // Last step CTA reads "Preview" in EN.
    await expect(page.locator('[data-wizard-next]')).toContainText('Preview')
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/en\/ilan-ver\/onizleme/)

    // Preview shows EN copy + publishes back into /en/tesekkurler.
    const preview = page.locator('[data-ilan-onizleme]')
    await expect(preview).toHaveAttribute('data-mounted', 'true')
    await expect(preview).toHaveAttribute('data-can-submit', 'true')
    await expect(page.locator('[data-ilan-publish]')).toContainText(/Publish listing/)

    await page.locator('[data-ilan-publish]').click()
    await page.waitForURL(/\/en\/ilan-ver\/tesekkurler\?id=AT-\d{4}-\d{4}/)

    // Success summary renders EN labels + the listing ref.
    const success = page.locator('[data-ilan-success]')
    await expect(success).toHaveAttribute('data-mounted', 'true')
    await expect(page.locator('[data-ilan-ref-card]')).toContainText('Listing ID')

    // Draft cleared.
    const cleared = await page.evaluate((key) => window.localStorage.getItem(key), DRAFT_KEY)
    expect(cleared).toBeNull()
  })
})
