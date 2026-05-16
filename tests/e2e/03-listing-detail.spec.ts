import { test, expect } from '@playwright/test'

test.describe('Listing detail', () => {
  test('Cunda listing renders with JSON-LD', async ({ page }) => {
    await page.goto('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    await expect(page.locator('h1')).toBeVisible()
    const json = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(json).toContain('RealEstateListing')
    expect(json).toContain('TRY')
  })

  test('all sample listing slugs reachable', async ({ page }) => {
    const slugs = [
      'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142',
      'datca-merkez-villa-imarli-2-150-m-48.DT.0028',
      'ayvalik-sarimsakli-580-agacli-zeytinlik-10.AY.0207',
    ]
    for (const s of slugs) {
      const r = await page.goto(`/ilan/${s}`)
      expect(r?.status()).toBe(200)
    }
  })
})
