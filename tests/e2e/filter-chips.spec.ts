import { expect, test } from '@playwright/test'

/**
 * Faz 10.F2 / Wave-F2 / Agent-F2D — /ara active filter chips spec.
 *
 * Flow:
 *  1. Navigate to /ara?tip=İmarlı
 *  2. Assert the chip "Tip: İmarlı" appears above the results grid
 *  3. Click the chip (which acts as a remove link)
 *  4. Assert URL no longer contains tip=İmarlı + chip gone
 *  5. Also verify "Tümünü temizle" routes to /ara with no params
 */
test.describe('FilterChips — /ara active filter removal', () => {
  test('chip renders for ?tip=İmarlı and click removes the filter', async ({ page }) => {
    await page.goto('/ara?tip=' + encodeURIComponent('İmarlı'))

    // Wait for React island to hydrate.
    const chipRegion = page.locator('[data-filter-chips]')
    await expect(chipRegion).toBeVisible({ timeout: 5000 })

    const tipChip = page.locator('[data-filter-chip="tip"]')
    await expect(tipChip).toBeVisible()
    await expect(tipChip).toContainText(/Tip:\s*İmarlı/)

    // Click chip (anchor) → URL updates.
    await Promise.all([
      page.waitForURL((url) => !url.search.includes('tip=')),
      tipChip.click(),
    ])

    expect(page.url()).not.toContain('tip=')
    // After navigation, no active filters → chip row should not render.
    await expect(page.locator('[data-filter-chip="tip"]')).toHaveCount(0)
  })

  test('multiple filters render multiple chips + Tümünü temizle clears all', async ({
    page,
  }) => {
    await page.goto(
      '/ara?tip=' + encodeURIComponent('İmarlı') + '&il=' + encodeURIComponent('İstanbul'),
    )

    const chipRegion = page.locator('[data-filter-chips]')
    await expect(chipRegion).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-filter-chip="tip"]')).toBeVisible()
    await expect(page.locator('[data-filter-chip="il"]')).toBeVisible()

    const clearAll = page.locator('[data-filter-clear-all]')
    await expect(clearAll).toBeVisible()

    await Promise.all([page.waitForURL((url) => !url.search), clearAll.click()])

    expect(page.url()).not.toContain('?')
    await expect(page.locator('[data-filter-chips]')).toHaveCount(0)
  })

  test('no chip row when no active filters', async ({ page }) => {
    await page.goto('/ara')
    // Sort default doesn't count; chip region must not render at all.
    await expect(page.locator('[data-filter-chips]')).toHaveCount(0)
  })
})
