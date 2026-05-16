import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('renders hero + search', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByPlaceholder(/İlçe|mahalle/i).first()).toBeVisible({ timeout: 3000 })
  })

  test('JSON-LD WebSite present', async ({ page }) => {
    await page.goto('/')
    const json = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(json).toContain('WebSite')
  })

  test('header nav links visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Arsa ara/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ofisler/i })).toBeVisible()
  })
})
