// F6.B — Reviews island E2E.
//
// Cunda listing slug is shared across the lightbox + recent-views suites.
// Keep this constant in sync if the mock listings move.
import { test, expect } from '@playwright/test'

const LISTING_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'
const LISTING_ID = '28.AY.0142'

test.describe('Reviews island', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    // Approach: visit a same-origin page first, wipe the two storage keys
    // imperatively, THEN drop into the actual test. This avoids the brittle
    // addInitScript pattern which can re-wipe on reloads triggered inside
    // the test body (sessionStorage guard isn't always durable across
    // reload() in chromium contexts).
    await page.goto('/')
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem('arsam.reviews.v1')
        window.localStorage.removeItem('arsam.virtualTourInterest.v1')
      } catch { /* ignore */ }
    })
  })

  test('renders 3 seeded reviews + average label', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const list = page.getByTestId('reviews-list')
    // ReviewsList mounts with client:visible. Scroll it into view to force
    // hydration on browsers that lazy-init IntersectionObserver work.
    await list.scrollIntoViewIfNeeded()
    await expect(list).toBeVisible()
    const items = page.getByTestId('review-item')
    await expect(items).toHaveCount(3)
    await expect(page.getByTestId('reviews-avg-label')).toContainText('/ 5')
    await expect(page.getByTestId('reviews-avg-label')).toContainText('3')
  })

  test('add review form validates body length', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    await page.getByTestId('reviews-list').scrollIntoViewIfNeeded()
    await page.getByTestId('reviews-toggle-add').click()
    await expect(page.getByTestId('add-review-form')).toBeVisible()
    // Pick a star then submit with empty body.
    await page.locator('[data-testid="add-review-rating"] [data-star-value="4"]').click()
    await page.getByTestId('add-review-submit').click()
    await expect(page.getByTestId('add-review-error')).toBeVisible()
  })

  test('submitting a valid review adds a 4th item and updates average', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    await page.getByTestId('reviews-list').scrollIntoViewIfNeeded()

    // ReviewsList hydrates with client:visible — wait for the seeded 3 items
    // to render before measuring.
    await expect(page.getByTestId('review-item')).toHaveCount(3)

    await page.getByTestId('reviews-toggle-add').click()
    await page.locator('[data-testid="add-review-rating"] [data-star-value="5"]').click()
    await page.getByTestId('add-review-author').fill('E2E Test User')
    await page
      .getByTestId('add-review-body')
      .fill('Bu test için yazılmış uzunca bir yorum metnidir.')
    await page.getByTestId('add-review-submit').click()

    // Success banner + list grew to 4.
    await expect(page.getByTestId('add-review-success')).toBeVisible()
    await expect(page.getByTestId('review-item')).toHaveCount(4)
    // Avg label still mentions "/ 5" and the count is now 4.
    await expect(page.getByTestId('reviews-avg-label')).toContainText('4')

    // Persistence: storage survives reload. Inspect the raw localStorage
    // payload so a regression surfaces in CI logs without screenshot diffing.
    const persisted = await page.evaluate(() =>
      window.localStorage.getItem('arsam.reviews.v1'),
    )
    expect(persisted).not.toBeNull()
    expect(persisted!).toContain('E2E Test User')
  })

  test('virtual tour CTA opens modal and accepts email', async ({ page }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const trigger = page.getByTestId('virtual-tour-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()
    await expect(page.getByTestId('virtual-tour-modal')).toBeVisible()

    // Invalid email → error.
    await page.getByTestId('virtual-tour-email').fill('not-an-email')
    await page.getByTestId('virtual-tour-submit').click()
    await expect(page.getByTestId('virtual-tour-error')).toBeVisible()

    // Valid email → success banner appears, storage gets a row.
    await page.getByTestId('virtual-tour-email').fill('ahmet@arsam.net')
    await page.getByTestId('virtual-tour-submit').click()
    await expect(page.getByTestId('virtual-tour-success')).toBeVisible()

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('arsam.virtualTourInterest.v1'),
    )
    expect(stored).not.toBeNull()
    expect(stored!).toContain('ahmet@arsam.net')
    expect(stored!).toContain(LISTING_ID)
  })
})
