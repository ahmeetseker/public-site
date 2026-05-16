import { test, expect } from '@playwright/test'

test.describe('404 page', () => {
  test('unknown TR path returns 404 with markup', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist-12345')
    expect(res?.status()).toBe(404)
    await expect(page.getByTestId('error-404')).toBeVisible()
    await expect(page.getByText('Bu sayfayı bulamadık')).toBeVisible()
  })

  test('unknown EN path renders English 404', async ({ page }) => {
    const res = await page.goto('/en/this-does-not-exist-12345')
    expect(res?.status()).toBe(404)
    await expect(page.getByText("We couldn't find that page")).toBeVisible()
  })
})

test.describe('500 page (static smoke)', () => {
  test('500.astro renders when navigated directly', async ({ page }) => {
    await page.goto('/500')
    await expect(page.getByTestId('error-500')).toBeVisible()
  })
})
