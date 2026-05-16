import { test, expect } from '@playwright/test'

test.describe('Buyer auth (mock)', () => {
  test('/hesabim redirects to /giris when no cookie', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/hesabim/')
    await page.waitForURL(/\/giris/, { timeout: 3000 })
    await expect(page).toHaveURL(/\/giris/)
  })

  test('login sets cookie + redirects to /hesabim/', async ({ page, context }) => {
    await page.goto('/giris')
    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    if (await emailInput.count() > 0) {
      await emailInput.fill('demo@arsam.net')
    }
    const passInput = page.locator('input[type="password"]').first()
    if (await passInput.count() > 0) {
      await passInput.fill('parola-mock')
    }
    const submit = page.locator('button[type="submit"]').first()
    await submit.click()
    await page.waitForURL(/\/hesabim/, { timeout: 3000 })
    const cookies = await context.cookies()
    expect(cookies.find(c => c.name === 'arsam_buyer_demo')).toBeDefined()
  })
})
