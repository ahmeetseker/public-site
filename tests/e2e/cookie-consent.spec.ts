import { expect, test } from '@playwright/test'

/**
 * Wave F13.D — Cookie consent banner + 4-category modal.
 *
 * Coverage
 *   - Banner appears on first visit (no `arsam.cookie-consent.v1` stored).
 *   - "Tümünü kabul et" persists all three categories as true and hides.
 *   - "Sadece zorunlu" persists all categories as false and hides.
 *   - "Ayarla" opens the modal; toggling analytics + Save writes the record.
 *   - Banner does NOT reappear once `decidedAt` is set.
 *   - OG image meta points at `/og/<slug>.svg` (default marquee endpoint).
 */

const STORAGE_KEY = 'arsam.cookie-consent.v1'

test.describe('Cookie consent banner (Wave F13.D)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.cookie-consent.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('banner appears on first visit', async ({ page }) => {
    await page.goto('/')
    const banner = page.locator('[data-testid="cookie-consent-banner"]')
    await expect(banner).toBeVisible({ timeout: 5000 })
    await expect(banner).toHaveAttribute('data-cc-banner', 'open')
  })

  test('Accept all persists all categories and hides the banner', async ({ page }) => {
    await page.goto('/')
    const banner = page.locator('[data-testid="cookie-consent-banner"]')
    await expect(banner).toBeVisible()

    await page.locator('[data-testid="cookie-consent-accept"]').click()
    await expect(banner).toBeHidden({ timeout: 2000 })

    const stored = await page.evaluate(
      (k) => window.localStorage.getItem(k),
      STORAGE_KEY,
    )
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.functional).toBe(true)
    expect(parsed.analytics).toBe(true)
    expect(parsed.marketing).toBe(true)
    expect(typeof parsed.decidedAt).toBe('string')
  })

  test('Essential only persists all categories as false', async ({ page }) => {
    await page.goto('/')
    const banner = page.locator('[data-testid="cookie-consent-banner"]')
    await expect(banner).toBeVisible()

    await page.locator('[data-testid="cookie-consent-reject"]').click()
    await expect(banner).toBeHidden({ timeout: 2000 })

    const stored = await page.evaluate(
      (k) => window.localStorage.getItem(k),
      STORAGE_KEY,
    )
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.functional).toBe(false)
    expect(parsed.analytics).toBe(false)
    expect(parsed.marketing).toBe(false)
    expect(typeof parsed.decidedAt).toBe('string')
  })

  test('Customize opens the modal and Save persists toggled state', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="cookie-consent-customize"]').click()

    const modal = page.locator('[data-testid="cookie-consent-modal"]')
    await expect(modal).toBeVisible()

    // Toggle analytics on.
    await page.locator('[data-testid="cookie-consent-toggle-analytics"]').click()
    await page.locator('[data-testid="cookie-consent-modal-save"]').click()

    await expect(modal).toBeHidden()
    await expect(page.locator('[data-testid="cookie-consent-banner"]')).toBeHidden({
      timeout: 2000,
    })

    const stored = await page.evaluate(
      (k) => window.localStorage.getItem(k),
      STORAGE_KEY,
    )
    const parsed = JSON.parse(stored as string)
    expect(parsed.analytics).toBe(true)
    expect(parsed.functional).toBe(false)
    expect(parsed.marketing).toBe(false)
  })

  test('banner does not reappear once a decision was made', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'arsam.cookie-consent.v1',
          JSON.stringify({
            functional: true,
            analytics: false,
            marketing: false,
            decidedAt: new Date().toISOString(),
          }),
        )
      } catch {
        /* ignore */
      }
    })
    await page.goto('/')
    const banner = page.locator('[data-testid="cookie-consent-banner"]')
    // Either hidden via attribute or display:none — both count.
    await expect(banner).toBeHidden({ timeout: 3000 })
  })
})

test.describe('Dynamic OG image (Wave F13.D)', () => {
  test('home og:image points at /og/anasayfa.svg', async ({ page }) => {
    await page.goto('/')
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    expect(ogImage).toMatch(/\/og\/anasayfa\.svg$/)
  })

  test('og:image:type advertises svg+xml', async ({ page }) => {
    await page.goto('/')
    const type = await page
      .locator('meta[property="og:image:type"]')
      .getAttribute('content')
    expect(type).toBe('image/svg+xml')
  })

  test('og marquee endpoint is reachable and valid SVG', async ({ request }) => {
    const res = await request.get('/og/anasayfa.svg')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/svg+xml')
    const body = await res.text()
    expect(body).toMatch(/<svg[\s\S]*<\/svg>$/)
    expect(body).toContain('arsam')
  })
})
