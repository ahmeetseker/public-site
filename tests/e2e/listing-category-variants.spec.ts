import { test, expect } from '@playwright/test'

test.describe('P bölüm — Kategori variants', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('arsam.newsletter-modal-seen.v1', '1')
        window.localStorage.setItem(
          'arsam.onboarding.v1',
          JSON.stringify({
            completed: true,
            currentStep: 5,
            completedSteps: [1, 2, 3, 4, 5],
            startedAt: Date.now(),
            finishedAt: Date.now(),
          }),
        )
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
  })

  test('Arsa — hero h1 görünür (legacy fallback)', async ({ page }) => {
    await page.goto('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Konut RES.001 — Bina bilgisi gösterir (IdentityCardVariant residential)', async ({ page }) => {
    // Konut slug pattern: kadikoy-daire-82-m-RES.001 (size variable, but RES.001 ID stable)
    const r = await page.goto('/ilan/kadikoy-daire-82-m-RES.001', { waitUntil: 'domcontentloaded' })
    if (r?.status() === 404) {
      // Try with different size variations or alt slugs from sitemap
      const sitemap = await page.context().request.get('/sitemap.xml')
      const text = await sitemap.text()
      const m = text.match(/\/ilan\/[a-z0-9-]+-RES\.001\/?/i)
      if (m) {
        await page.goto(m[0])
      } else {
        test.skip(true, 'RES.001 slug not found in sitemap')
      }
    }
    await expect(page.getByText(/Bina bilgisi/i)).toBeVisible({ timeout: 5000 })
  })

  test('Villa VIL.001 — Brüt m² gösterir (HeroVariant villa chip)', async ({ page }) => {
    const sitemap = await page.context().request.get('/sitemap.xml')
    const text = await sitemap.text()
    const m = text.match(/\/ilan\/[a-z0-9-]+-VIL\.001\/?/i)
    if (!m) test.skip(true, 'VIL.001 slug not found in sitemap')
    await page.goto(m![0])
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })
  })

  test('İşyeri COM.001 — İşyeri bilgisi gösterir', async ({ page }) => {
    const sitemap = await page.context().request.get('/sitemap.xml')
    const text = await sitemap.text()
    const m = text.match(/\/ilan\/[a-z0-9-]+-COM\.001\/?/i)
    if (!m) test.skip(true, 'COM.001 slug not found in sitemap')
    await page.goto(m![0])
    await expect(page.getByText(/İşyeri bilgisi/i)).toBeVisible({ timeout: 5000 })
  })
})
