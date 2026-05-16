// F4.A.2 — Recently-viewed E2E.
//
// Selector note: `a[href^="/ilan/"]` matches the main card anchor on /ara
// (ListingCard.astro wraps the card in `<a href={/ilan/...}>`; the sibling
// "Karşılaştır" link points to /karsilastir and is excluded by the prefix
// match). The `data-listing-id` overlay sits at z-10 but `.click()` on the
// locator targets the matched <a> element directly.
import { test, expect } from '@playwright/test'

test.describe('Recently viewed', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
    // Wipe `arsam.recent.v1` ONCE at the very start of the test (mirrors
    // favorite-toggle / compare specs). Guard with sessionStorage so
    // subsequent in-test navigations don't nuke writes made by listing
    // detail pages — recent-views fundamentally relies on cross-nav
    // persistence.
    await context.addInitScript(() => {
      try {
        if (!window.sessionStorage.getItem('__recent_wiped__')) {
          window.localStorage.removeItem('arsam.recent.v1')
          window.sessionStorage.setItem('__recent_wiped__', '1')
        }
      } catch { /* ignore */ }
    })
  })

  test('visits 2 listings, dropdown shows them newest-first', async ({ page }) => {
    await page.goto('/ara')
    const firstCard = page.locator('a[href^="/ilan/"]').first()
    const firstHref = await firstCard.getAttribute('href')
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    await page.goto('/ara')
    const secondCard = page.locator('a[href^="/ilan/"]').nth(1)
    const secondHref = await secondCard.getAttribute('href')
    await secondCard.click()
    await page.waitForLoadState('networkidle')

    await page.goto('/')
    await page.getByTestId('recent-trigger').first().click()
    const menu = page.getByTestId('recent-menu')
    await expect(menu).toBeVisible()
    const items = menu.locator('li')
    await expect(items).toHaveCount(2)
    // Newest first: second click should be on top.
    await expect(items.nth(0).locator('a')).toHaveAttribute('href', secondHref!)
    await expect(items.nth(1).locator('a')).toHaveAttribute('href', firstHref!)
  })

  test('clear empties the dropdown', async ({ page }) => {
    await page.goto('/ara')
    await page.locator('a[href^="/ilan/"]').first().click()
    await page.waitForLoadState('networkidle')
    await page.goto('/')
    // Open dropdown — should currently have 1 item.
    await page.getByTestId('recent-trigger').first().click()
    await expect(page.getByTestId('recent-menu')).toBeVisible()
    // Clear — component re-renders the (still-open) menu with empty state.
    await page.getByTestId('recent-clear').click()
    await expect(page.getByTestId('recent-menu')).toContainText('Henüz')
    // Persistence check: close + reopen — empty state survives.
    await page.getByTestId('recent-trigger').first().click() // close
    await page.getByTestId('recent-trigger').first().click() // reopen
    await expect(page.getByTestId('recent-menu')).toContainText('Henüz')
  })
})
