import { expect, test } from '@playwright/test'

/**
 * Wave F4 / Agent-F4B — /ara FavoriteToggle + SaveSearchButton spec.
 *
 * Closes the loop on Wave F3 / Agent-F3E's /hesabim/{favori,aramalar}
 * islands. F3E only verified READ-from-localStorage (seeded keys then
 * asserted UI). This spec verifies the missing WRITE path: clicking a
 * heart on /ara mutates `arsam.favorites.v1` and the /hesabim/favori page
 * subsequently renders the listing as a favorite card.
 *
 * Flows:
 *   1. /ara → click first FavoriteToggle → assert localStorage updated.
 *   2. Navigate to /hesabim/favori → assert seeded id shows up.
 *   3. /ara?q=Ayvalık → click SaveSearchButton → fill label → Kaydet →
 *      assert toast + localStorage updated → /hesabim/aramalar lists it.
 */

const FAVORITES_KEY = 'arsam.favorites.v1'
const SAVED_SEARCHES_KEY = 'arsam.savedSearches.v1'

test.describe('/ara FavoriteToggle + SaveSearchButton (Wave F4)', () => {
  test.beforeEach(async ({ context }) => {
    // /hesabim/* requires the demo cookie (AuthGuard.astro).
    await context.addCookies([
      {
        name: 'arsam_buyer_demo',
        value: '1',
        domain: 'localhost',
        path: '/',
      },
    ])
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.favorites.v1')
        window.localStorage.removeItem('arsam.savedSearches.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('favorite toggle on /ara card writes to localStorage + appears in /hesabim/favori', async ({
    page,
  }) => {
    await page.goto('/ara')

    // Hydration: at least one toggle exists.
    const firstToggle = page.locator('[data-favorite-toggle]').first()
    await expect(firstToggle).toBeVisible({ timeout: 5000 })
    await expect(firstToggle).toHaveAttribute('data-state', 'off')

    // Capture the listing id from the toggle's data attribute.
    const id = await firstToggle.getAttribute('data-favorite-toggle')
    expect(id).toBeTruthy()

    await firstToggle.click()
    await expect(firstToggle).toHaveAttribute('data-state', 'on')

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      FAVORITES_KEY,
    )
    expect(stored).toContain(id!)

    // Now navigate to /hesabim/favori — the favorite should render there.
    await page.goto('/hesabim/favori')
    const list = page.locator('[data-favorites-list]')
    await expect(list).toBeVisible({ timeout: 5000 })
    await expect(list).toHaveAttribute('data-count', '1')
  })

  test('save search button captures URL → appears in /hesabim/aramalar', async ({
    page,
  }) => {
    await page.goto('/ara?q=' + encodeURIComponent('Ayvalık'))

    const trigger = page.locator('[data-save-search-trigger]')
    await expect(trigger).toBeVisible({ timeout: 5000 })
    await trigger.click()

    const input = page.locator('[data-save-search-input]')
    await expect(input).toBeVisible()
    await input.fill('Ayvalık zeytinlik 0-2M')

    await page.locator('[data-save-search-confirm]').click()

    // Toast appears.
    const toast = page.locator('[data-save-search-toast]')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Arama kaydedildi')

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      SAVED_SEARCHES_KEY,
    )
    expect(stored).toContain('Ayvalık zeytinlik 0-2M')
    expect(stored).toContain('Ayvalık')

    // Now /hesabim/aramalar should list it.
    await page.goto('/hesabim/aramalar')
    const list = page.locator('[data-saved-searches-list]')
    await expect(list).toBeVisible({ timeout: 5000 })
    await expect(list).toHaveAttribute('data-count', '1')
    await expect(list).toContainText('Ayvalık zeytinlik 0-2M')
  })

  test('save search is hidden when URL is pristine', async ({ page }) => {
    await page.goto('/ara')
    // After hydration the trigger should still not appear (no filters/q).
    // We give the island generous idle time but expect zero rendered triggers.
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-save-search-trigger]')).toHaveCount(0)
  })
})
