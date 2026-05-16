import { test, expect } from '@playwright/test'

/**
 * Wave F6 / Agent-F6D — /ara SearchSuggestions dropdown.
 *
 * Verifies:
 *   - The combobox input hydrates and is interactive.
 *   - Focus opens the dropdown with the 3 sections (Popüler bölgeler + İlan
 *     tipleri visible even with no saved searches).
 *   - ArrowDown highlights the first option (aria-activedescendant + the
 *     `data-search-suggestion-active` attribute).
 *   - Enter on a highlighted region option navigates to /ara with the
 *     bölge name + city as URL params.
 *   - Escape closes the dropdown.
 */

const SAVED_SEARCHES_KEY = 'arsam.savedSearches.v1'

test.describe('/ara SearchSuggestions (Wave F6.D)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }, SAVED_SEARCHES_KEY)
  })

  test('focus opens dropdown with regions + types sections', async ({ page }) => {
    await page.goto('/ara')
    const input = page.locator('[data-search-suggestions-input]')
    await expect(input).toBeVisible({ timeout: 10_000 })

    // `client:idle` may not have hydrated yet — click triggers focus AND
    // hydration in one gesture.
    await input.click()
    const dropdown = page.locator('[data-search-suggestions-dropdown]')
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    await expect(dropdown.locator('[data-search-suggestion-section="regions"]')).toBeVisible()
    await expect(dropdown.locator('[data-search-suggestion-section="types"]')).toBeVisible()

    const regionOptions = dropdown.locator(
      '[data-search-suggestion-section="regions"] [data-search-suggestion-option]',
    )
    await expect(regionOptions).toHaveCount(8)
  })

  test('ArrowDown highlights first option, Enter navigates to /ara with bölge params', async ({
    page,
  }) => {
    await page.goto('/ara')
    const input = page.locator('[data-search-suggestions-input]')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.click()
    await expect(page.locator('[data-search-suggestions-dropdown]')).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('ArrowDown')

    // With no recents, first option is a region (Çeşme).
    const highlighted = page.locator('[data-search-suggestion-active="true"]')
    await expect(highlighted).toBeVisible()
    await expect(highlighted).toContainText(/Çeşme/i)

    const [response] = await Promise.all([
      page.waitForURL((u) => u.pathname.endsWith('/ara') && u.search.includes('il=')),
      page.keyboard.press('Enter'),
    ])
    void response
    expect(page.url()).toContain('q=')
    expect(page.url()).toContain('il=')
  })

  test('Escape closes the dropdown', async ({ page }) => {
    await page.goto('/ara')
    const input = page.locator('[data-search-suggestions-input]')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.click()
    await expect(page.locator('[data-search-suggestions-dropdown]')).toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-search-suggestions-dropdown]')).toHaveCount(0)
  })

  test('seeded saved searches appear in the Son aramalar section', async ({ context, page }) => {
    await context.addInitScript((key) => {
      const entry = {
        id: 's_test_1',
        q: 'Ayvalık zeytinlik',
        filters: { il: 'Balıkesir' },
        savedAt: new Date().toISOString(),
        label: 'Ayvalık zeytinlik',
      }
      window.localStorage.setItem(key, JSON.stringify([entry]))
    }, SAVED_SEARCHES_KEY)

    await page.goto('/ara')
    const input = page.locator('[data-search-suggestions-input]')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.click()
    const recentSection = page.locator('[data-search-suggestion-section="recent"]')
    await expect(recentSection).toBeVisible({ timeout: 5_000 })
    await expect(recentSection).toContainText('Ayvalık zeytinlik')
  })
})
