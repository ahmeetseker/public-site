// F6.B — Similar listings island E2E.
//
// The sidebar island replaces the legacy static .astro renderer. We verify:
//   - up to 6 cards render (the mock seed has > 6 listings spread across
//     several cities/districts)
//   - the current listing is never present in the list
//   - links use the same slug shape consumers expect

import { test, expect } from '@playwright/test'

const LISTING_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'
const LISTING_ID = '28.AY.0142'

test.describe('Similar listings island', () => {
  test('shows up to 6 cards and excludes current listing', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const sidebar = page.getByTestId('similar-listings')
    await sidebar.scrollIntoViewIfNeeded()
    await expect(sidebar).toBeVisible()
    const items = page.getByTestId('similar-item')
    const count = await items.count()
    // Mock data should yield at least 1 and at most 6.
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(6)

    // Current listing must not appear.
    const ids = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.listingId ?? ''),
    )
    expect(ids).not.toContain(LISTING_ID)
  })

  test('first card links to /ilan/<slug>', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    await page.getByTestId('similar-listings').scrollIntoViewIfNeeded()
    const firstLink = page.getByTestId('similar-item').first().locator('a')
    const href = await firstLink.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href!).toMatch(/^\/ilan\//)
  })

  test('EN mirror renders Similar listings with English copy', async ({ page }) => {
    await page.goto(`/en/ilan/${LISTING_SLUG}`)
    const sidebar = page.getByTestId('similar-listings')
    await sidebar.scrollIntoViewIfNeeded()
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toContainText('Similar listings')
    // EN links use /en/ilan prefix.
    const firstLink = page.getByTestId('similar-item').first().locator('a')
    const href = await firstLink.getAttribute('href')
    expect(href!).toMatch(/^\/en\/ilan\//)
  })
})
