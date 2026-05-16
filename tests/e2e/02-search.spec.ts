import { test, expect } from '@playwright/test'

test.describe('Search /ara', () => {
  test('renders results grid', async ({ page }) => {
    await page.goto('/ara')
    // Scope to the results container — `[class*="card"]` previously matched
    // the FilterSidebar's `bg-card` form (hidden on mobile), causing false
    // failures. The listing cards live under `[data-ara-list]` and are
    // rendered as `<a>` anchors to `/ilan/...`.
    const firstCard = page.locator('[data-ara-list] a[href^="/ilan/"]').first()
    await expect(firstCard).toBeVisible({ timeout: 5000 })
  })

  test('filter by tip', async ({ page }) => {
    await page.goto('/ara?tip=Zeytinlik')
    // `getByText(/Zeytinlik/i).first()` used to match the `<option value="Zeytinlik">`
    // inside the hidden `<select>` (always hidden by browsers). After T8 added
    // the `<select name="tip">` to FilterSidebar, that match became flaky.
    // Assert against a visible Zeytinlik card title in the result list instead.
    const card = page.locator('[data-ara-list] a[href^="/ilan/"]', { hasText: /Zeytinlik/i }).first()
    await expect(card).toBeVisible({ timeout: 5000 })
  })

  test('sort by price preserved in URL', async ({ page }) => {
    await page.goto('/ara?sort=price-desc')
    expect(page.url()).toContain('sort=price-desc')
  })
})
