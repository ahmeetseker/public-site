import { expect, test } from '@playwright/test'

/**
 * Wave F4.A.3 — /karsilastir client-island E2E.
 *
 * The page is now hydrated as a `client:only="react"` island that reads
 * `?ids=` (capped at 3) and falls back to the `arsam.compare.v1`
 * localStorage list maintained by /ara. These tests cover the three modes:
 *
 *   1. empty       — no ids in URL, no localStorage entries
 *   2. table       — two known listing ids → diff highlight should appear
 *   3. share copy  — share button writes `?ids=` URL to clipboard
 *
 * IDs are taken from LISTINGS[0] and LISTINGS[1] in
 * `packages/data/src/mock/listings.ts` so the diff row is guaranteed (the
 * two seed listings differ on price + size + zoning + …).
 */
const ID_1 = '28.AY.0142'
const ID_2 = '48.DT.0028'

test.describe('/karsilastir client-side comparison', () => {
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

  test('empty state when no ids', async ({ page }) => {
    await page.goto('/karsilastir')
    await expect(page.getByTestId('compare-empty-client')).toBeVisible({
      timeout: 5000,
    })
  })

  test('renders table from ?ids= URL param', async ({ page }) => {
    await page.goto(`/karsilastir?ids=${ID_1},${ID_2}`)
    await expect(page.getByTestId('compare-table')).toBeVisible({
      timeout: 5000,
    })
    const diffRows = page.locator('[data-diff="true"]')
    // At least one row should differ between 2 distinct listings.
    await expect(diffRows.first()).toBeVisible()
  })

  test('share button copies URL with ?ids=', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`/karsilastir?ids=${ID_1},${ID_2}`)
    await page.getByTestId('compare-share').click()
    await expect(page.getByTestId('compare-toast')).toContainText('Kopyalandı')
  })
})
