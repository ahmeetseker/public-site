// /ara map view — Wave F4.B.2
//
// Verifies the AraMapShell island wires ViewToggle + URL state into a
// lazily mounted Leaflet view. Map mount asserts use data-testid hooks
// MapView.tsx ships at `data-testid="map-container"` and AraMapShell ships
// at `data-testid="map-shell"`.
//
// Mobile / tablet projects rely on webkit which may be absent in some local
// environments; run with `--project=desktop` for a guaranteed green pass.
import { test, expect } from '@playwright/test'

test.describe('/ara map view', () => {
  test('defaults to list mode (no map mount)', async ({ page }) => {
    await page.goto('/ara')
    await expect(page.getByTestId('view-toggle')).toBeVisible()
    await expect(page.getByTestId('map-shell')).toHaveCount(0)
  })

  test('toggling to Harita renders map container', async ({ page }) => {
    await page.goto('/ara')
    await page.getByTestId('view-toggle-map').click()
    await expect(page).toHaveURL(/view=map/)
    await expect(page.getByTestId('map-shell')).toBeVisible()
    // Leaflet boots after a dynamic import — give it room to land.
    await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 5_000 })
  })

  test('URL ?view=map deep link mounts map directly', async ({ page }) => {
    await page.goto('/ara?view=map')
    await expect(page.getByTestId('map-shell')).toBeVisible()
    await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 5_000 })
  })

  test('map result count reflects filtered listings', async ({ page }) => {
    await page.goto('/ara?view=map')
    await expect(page.getByTestId('map-result-count')).toBeVisible()
    await expect(page.getByTestId('map-result-count')).toContainText(/\d+\s+sonuç/)
  })
})
