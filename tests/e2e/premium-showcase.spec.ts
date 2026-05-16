import { test, expect } from '@playwright/test'

test.describe('Premium Showcase', () => {
  test('renders showcase carousel with eyebrow and CTA on first slide', async ({ page }) => {
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()

    // First slide should be active by default.
    const firstSlide = carousel.locator('[data-slide-index="0"]')
    await expect(firstSlide).toHaveAttribute('data-active', 'true')
    await expect(firstSlide.getByText('VİTRİN İLAN')).toBeVisible()
    await expect(firstSlide.getByText(/İlanı incele/i)).toBeVisible()
  })

  test('first slide links to a listing detail page', async ({ page }) => {
    await page.goto('/')
    const link = page.getByTestId('premium-showcase')
      .locator('[data-slide-index="0"]')
      .getByTestId('premium-showcase-link')
    const href = await link.getAttribute('href')
    expect(href).toMatch(/^\/ilan\/[A-Za-z0-9.-]+$/)
  })

  test('respects prefers-reduced-motion (no auto-advance)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()
    const initial = await carousel.getAttribute('data-active-index')
    // Wait longer than default auto-play interval (5s) plus margin.
    await page.waitForTimeout(6500)
    const after = await carousel.getAttribute('data-active-index')
    expect(after).toBe(initial)
    await context.close()
  })

  test('EN homepage shows the English showcase label', async ({ page }) => {
    await page.goto('/en/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toBeVisible()
    const firstSlide = carousel.locator('[data-slide-index="0"]')
    await expect(firstSlide.getByText('FEATURED LISTING')).toBeVisible()
  })
})
