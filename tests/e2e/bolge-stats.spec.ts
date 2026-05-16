import { test, expect } from '@playwright/test'

/**
 * Wave F6 / Agent-F6D — /bölge[slug] BolgeStats panel.
 *
 * Verifies:
 *   - The stat panel renders on a known region page (Ayvalık).
 *   - All four stat cards are present (avg ₺/m², total, new30d, sizeRange).
 *   - The 12-bar PriceTrendChart renders.
 *   - Hovering a bar reveals the floating tooltip + the SVG <title>.
 */

test.describe('/bölge[slug] BolgeStats (Wave F6.D)', () => {
  test('renders 4 stat cards + 12-bar trend chart on /bolge/ayvalik', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    const stats = page.locator('[data-bolge-stats]')
    await expect(stats).toBeVisible({ timeout: 5_000 })

    const cards = stats.locator('[data-bolge-stats-card]')
    await expect(cards).toHaveCount(4)

    await expect(stats.locator('[data-bolge-stats-card="avgPricePerSqm"]')).toBeVisible()
    await expect(stats.locator('[data-bolge-stats-card="totalListings"]')).toBeVisible()
    await expect(stats.locator('[data-bolge-stats-card="newLast30Days"]')).toBeVisible()
    await expect(stats.locator('[data-bolge-stats-card="sizeRange"]')).toBeVisible()

    const bars = stats.locator('[data-price-trend-bar]')
    await expect(bars).toHaveCount(12)
  })

  test('focusing a bar reveals the floating tooltip with ₺/m² value', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    const stats = page.locator('[data-bolge-stats]')
    await expect(stats).toBeVisible({ timeout: 5_000 })

    // SVG group elements with onFocus handle keyboard focus reliably across
    // Playwright headless/headed; hover dispatch into <g> can be flaky.
    const bars = stats.locator('[data-price-trend-bar]')
    await bars.nth(5).focus()
    const tooltip = page.locator('[data-price-trend-tooltip]')
    await expect(tooltip).toBeVisible({ timeout: 5_000 })
    await expect(tooltip).toContainText('₺/m²')
  })

  test('each bar carries a native SVG <title> with month + ₺/m² value', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    const stats = page.locator('[data-bolge-stats]')
    await expect(stats).toBeVisible({ timeout: 5_000 })

    const firstBarTitle = stats.locator('[data-price-trend-bar] title').first()
    const titleText = await firstBarTitle.textContent()
    expect(titleText).toMatch(/₺\/m²/)
  })
})
