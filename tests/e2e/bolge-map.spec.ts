// Wave F9.D — /bolge/[slug] map + neighbors + photos + transport
//
// Verifies the four new sections shipped by F9.D are visible and the Leaflet
// map only mounts after the user opts in via the "Haritada göster" toggle
// (default collapsed → no extra bundle on initial load).
import { test, expect } from '@playwright/test'

test.describe('/bolge/[slug] — F9.D advanced sections', () => {
  test('region page renders the four new sections', async ({ page }) => {
    await page.goto('/bolge/cesme')
    await expect(page.locator('[data-region-map]')).toBeVisible()
    await expect(page.locator('[data-region-photos]')).toBeVisible()
    await expect(page.locator('[data-transport-info]')).toBeVisible()
    await expect(page.locator('[data-neighbor-regions]')).toBeVisible()
  })

  test('map starts collapsed and toggles open on click', async ({ page }) => {
    await page.goto('/bolge/cesme')
    const toggle = page.getByTestId('region-map-toggle')
    // Scroll into view so client:visible can hydrate the island.
    await toggle.scrollIntoViewIfNeeded()
    await expect(toggle).toBeVisible()
    // Container not yet mounted.
    await expect(page.getByTestId('region-map-container')).toHaveCount(0)

    await toggle.click()
    await expect(page.getByTestId('region-map-container')).toBeVisible({ timeout: 5_000 })
    // Leaflet boots after a dynamic import — give it room to land.
    await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 10_000 })
  })

  test('shows exactly 4 neighbor cards for a well-connected region', async ({ page }) => {
    await page.goto('/bolge/cesme')
    const cards = page.locator('[data-neighbor-card]')
    await expect(cards).toHaveCount(4)
    // None of the neighbor cards link to the current region itself.
    const hrefs = await cards.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href))
    expect(hrefs.every((h) => !h.endsWith('/bolge/cesme'))).toBe(true)
  })

  test('renders 4 region photos with mock captions', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    const photos = page.locator('[data-region-photo]')
    await expect(photos).toHaveCount(4)
  })

  test('transport chips: airport + motorway always; port for coastal regions', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    await expect(page.locator('[data-transport-chip="airport"]')).toBeVisible()
    await expect(page.locator('[data-transport-chip="motorway"]')).toBeVisible()
    await expect(page.locator('[data-transport-chip="port"]')).toBeVisible()

    await page.goto('/bolge/soke')
    await expect(page.locator('[data-transport-chip="airport"]')).toBeVisible()
    await expect(page.locator('[data-transport-chip="motorway"]')).toBeVisible()
    // Söke is inland — no port chip.
    await expect(page.locator('[data-transport-chip="port"]')).toHaveCount(0)
  })

  test('/en variant ships English copy for the new sections', async ({ page }) => {
    await page.goto('/en/bolge/cesme')
    await expect(page.locator('[data-region-map]')).toBeVisible()
    await expect(page.getByTestId('region-map-toggle')).toContainText(/Show map/i)
    await expect(page.locator('[data-transport-chip="airport"]')).toBeVisible()
  })
})
