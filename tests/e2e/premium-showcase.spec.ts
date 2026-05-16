import { test, expect } from '@playwright/test'

test.describe('Premium Showcase', () => {
  test('renders showcase card with eyebrow and CTA', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('premium-showcase')
    await expect(card).toBeVisible()
    await expect(card.getByText('VİTRİN İLAN')).toBeVisible()
    await expect(card.getByText(/İlanı incele/i)).toBeVisible()
  })

  test('card links to a listing detail page', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('premium-showcase')
    const href = await card.getAttribute('href')
    expect(href).toMatch(/^\/ilan\/[A-Za-z0-9.-]+$/)
  })

  test('respects prefers-reduced-motion (no metallic-displacement filter)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const bg = page.getByTestId('premium-showcase-bg')
    const filter = await bg.evaluate((el) => getComputedStyle(el).filter)
    expect(filter).not.toContain('metallic-displacement')
    await context.close()
  })

  test('EN homepage shows the English showcase label', async ({ page }) => {
    await page.goto('/en/')
    const card = page.getByTestId('premium-showcase')
    await expect(card).toBeVisible()
    await expect(card.getByText('FEATURED LISTING')).toBeVisible()
  })
})
