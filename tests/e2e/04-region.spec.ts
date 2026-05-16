import { test, expect } from '@playwright/test'

test.describe('Region pages', () => {
  test('/bolge index lists regions', async ({ page }) => {
    await page.goto('/bolge')
    await expect(page.getByRole('link', { name: /Ayvalık/i }).first()).toBeVisible()
  })

  test('Çeşme region with FAQ', async ({ page }) => {
    await page.goto('/bolge/cesme')
    await expect(page.locator('h1')).toBeVisible()
    const summary = page.locator('summary').first()
    await expect(summary).toBeVisible()
  })
})
