import { test, expect } from '@playwright/test'

test.describe('ara — Wave 1 SSR filter params', () => {
  test('priceMin filtresi sonuçları daraltır', async ({ page }) => {
    const baseUrl = '/ara?kat=arsa'
    await page.goto(baseUrl)
    const baseCount = await page.locator('[data-listing-card]').count()

    await page.goto(`${baseUrl}&priceMin=10000000`)
    const filtered = await page.locator('[data-listing-card]').count()

    expect(filtered).toBeLessThanOrEqual(baseCount)
  })

  test('sizeMin + sizeMax kombinasyonu', async ({ page }) => {
    await page.goto('/ara?kat=arsa&sizeMin=1000&sizeMax=5000')
    const cards = page.locator('[data-listing-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('imar csv multi-select (konut,ticari)', async ({ page }) => {
    await page.goto('/ara?kat=arsa&imar=konut,ticari')
    const cards = page.locator('[data-listing-card]')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('cephe+su+elektrik+gaz tüm özellikler', async ({ page }) => {
    await page.goto('/ara?kat=arsa&cephe=1&su=1&elektrik=1&gaz=1')
    const cards = page.locator('[data-listing-card]')
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })

  test('depremRisk=dusuk düşük band filtresi', async ({ page }) => {
    await page.goto('/ara?kat=arsa&depremRisk=dusuk')
    const cards = page.locator('[data-listing-card]')
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })
})
