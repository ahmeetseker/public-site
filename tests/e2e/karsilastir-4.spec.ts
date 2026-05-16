import { expect, test } from '@playwright/test'

/**
 * Wave F9.A — /karsilastir 4-listing comparison + PDF export.
 *
 * Builds on karsilastir.spec.ts (F4.A.3). The two specs share the same
 * island; this one focuses on the F9.A increments:
 *   1. 4 listings render across 4 data columns (label col + 4 data cols).
 *   2. URL `?ids=` capped at 4 — a 5th id is dropped.
 *   3. "PDF olarak indir" button calls `window.print()`.
 *   4. "Sadece farklılaşanları göster" toggle hides equal rows live.
 *
 * Listing IDs are taken from the LISTINGS seed
 * (`packages/data/src/mock/listings.ts`) so they're stable across runs.
 */
const ID_1 = '28.AY.0142'
const ID_2 = '48.DT.0028'
const ID_3 = '10.AY.0207'
const ID_4 = '09.AL.0061'
const ID_5 = '09.UR.0114' // 5th id — must be dropped by the slice(0, 4).

test.describe('/karsilastir — 4-listing + PDF (F9.A)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.compare.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('renders 4 data columns when 4 ids are provided', async ({ page }) => {
    await page.goto(`/karsilastir?ids=${ID_1},${ID_2},${ID_3},${ID_4}`)
    const table = page.getByTestId('compare-table')
    await expect(table).toBeVisible({ timeout: 5000 })
    await expect(table).toHaveAttribute('data-compare-count', '4')

    // Label column + 4 data columns = 5 <th>.
    const headerCells = table.locator('thead tr th')
    await expect(headerCells).toHaveCount(5)
  })

  test('caps URL ids at 4 (drops the 5th)', async ({ page }) => {
    await page.goto(
      `/karsilastir?ids=${ID_1},${ID_2},${ID_3},${ID_4},${ID_5}`,
    )
    const table = page.getByTestId('compare-table')
    await expect(table).toBeVisible({ timeout: 5000 })
    await expect(table).toHaveAttribute('data-compare-count', '4')
  })

  test('PDF button triggers window.print()', async ({ page }) => {
    await page.goto(`/karsilastir?ids=${ID_1},${ID_2}`)
    await expect(page.getByTestId('compare-pdf')).toBeVisible({ timeout: 5000 })

    // Stub window.print so we can observe the call without a real dialog.
    await page.evaluate(() => {
      const w = window as Window & { __printCalls?: number }
      w.__printCalls = 0
      w.print = () => {
        w.__printCalls = (w.__printCalls ?? 0) + 1
      }
    })

    await page.getByTestId('compare-pdf').click()
    const calls = await page.evaluate(
      () => (window as Window & { __printCalls?: number }).__printCalls ?? 0,
    )
    expect(calls).toBeGreaterThanOrEqual(1)
  })

  test('"only differences" toggle hides equal rows', async ({ page }) => {
    await page.goto(`/karsilastir?ids=${ID_1},${ID_2}`)
    await expect(page.getByTestId('compare-table')).toBeVisible({
      timeout: 5000,
    })

    // Initially the root has data-only-diff=false.
    const root = page.locator('[data-compare-root]')
    await expect(root).toHaveAttribute('data-only-diff', 'false')

    // Both diff=true and diff=false rows should exist before toggling.
    const equalRows = page.locator(
      '[data-testid="compare-table"] tr[data-diff="false"]',
    )
    const equalCountBefore = await equalRows.count()
    expect(equalCountBefore).toBeGreaterThan(0)

    // Toggle on (click the label — input is inside it).
    await page.getByTestId('compare-inversion-toggle').check()
    await expect(root).toHaveAttribute('data-only-diff', 'true')

    // Equal rows now have computed display:none (CSS hides them).
    const firstEqual = equalRows.first()
    await expect(firstEqual).toBeHidden()

    // Toggle off again — equal rows reappear.
    await page.getByTestId('compare-inversion-toggle').uncheck()
    await expect(root).toHaveAttribute('data-only-diff', 'false')
    await expect(firstEqual).toBeVisible()
  })

  test('EN mirror shows "Save as PDF" CTA', async ({ page }) => {
    await page.goto(`/en/karsilastir?ids=${ID_1},${ID_2}`)
    const pdfButton = page.getByTestId('compare-pdf')
    await expect(pdfButton).toBeVisible({ timeout: 5000 })
    await expect(pdfButton).toHaveText(/Save as PDF/)
  })
})
