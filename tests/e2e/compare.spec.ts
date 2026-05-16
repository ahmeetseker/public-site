import { expect, test } from '@playwright/test'

/**
 * Faz 9.16 — /ara compare picker + sticky dock E2E.
 *
 * Flow:
 *  1. Visit /ara
 *  2. Click two compare toggles
 *  3. Assert dock visible with "2 arsa seçildi"
 *  4. Click "Karşılaştır →" CTA
 *  5. Assert URL contains /karsilastir?ids=
 */
test.describe('Compare picker — /ara → /karsilastir', () => {
  test.beforeEach(async ({ context }) => {
    // Clean slate — localStorage scope is per-origin, set before nav.
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.compare.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('toggling 2 cards reveals dock and CTA navigates to /karsilastir?ids=', async ({
    page,
  }) => {
    await page.goto('/ara')

    // Wait for the React island toggles to hydrate.
    const toggles = page.locator('[data-compare-toggle]')
    await expect(toggles.first()).toBeVisible({ timeout: 5000 })

    const count = await toggles.count()
    expect(count).toBeGreaterThanOrEqual(2)

    await toggles.nth(0).click()
    await toggles.nth(1).click()

    const dock = page.locator('[data-compare-dock]')
    await expect(dock).toBeVisible()
    await expect(dock).toContainText('2 arsa seçildi')

    const cta = page.locator('[data-compare-cta]')
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toMatch(/^\/karsilastir\?ids=[^,&]+,[^,&]+$/)

    await Promise.all([page.waitForURL(/\/karsilastir\?ids=/), cta.click()])
    expect(page.url()).toContain('/karsilastir?ids=')
  })

  test('clear button empties the dock', async ({ page }) => {
    await page.goto('/ara')
    const toggles = page.locator('[data-compare-toggle]')
    await expect(toggles.first()).toBeVisible({ timeout: 5000 })

    await toggles.nth(0).click()
    const dock = page.locator('[data-compare-dock]')
    await expect(dock).toBeVisible()

    await page.getByRole('button', { name: 'Temizle' }).click()
    await expect(dock).toBeHidden()
  })
})
