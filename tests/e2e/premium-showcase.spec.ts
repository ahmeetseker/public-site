import { test, expect } from '@playwright/test'

test.describe('Premium Showcase', () => {
  test.beforeEach(async ({ context }) => {
    // Dismiss the onboarding tour and cookie banner so they don't cover the
    // carousel center where the dots live.
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

  test('next arrow advances to slide 2', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toHaveAttribute('data-active-index', '0')
    await page.getByTestId('premium-showcase-next').click()
    await expect(carousel).toHaveAttribute('data-active-index', '1')
    const slide1 = carousel.locator('[data-slide-index="1"]')
    await expect(slide1).toHaveAttribute('data-active', 'true')
    const slide0 = carousel.locator('[data-slide-index="0"]')
    await expect(slide0).toHaveAttribute('data-active', 'false')
  })

  test('dots reflect and control active slide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    await expect(carousel).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 })

    const dots = carousel.getByTestId('premium-showcase-dots').locator('button')
    const count = await dots.count()
    if (count < 2) test.skip()

    // Initial dot is current.
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')

    // Click second dot — second slide becomes active.
    await dots.nth(1).click()
    await expect(carousel).toHaveAttribute('data-active-index', '1')
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'false')
  })

  test('inactive slides are hidden from assistive tech', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const carousel = page.getByTestId('premium-showcase')
    const slide0 = carousel.locator('[data-slide-index="0"]')
    const slide1 = carousel.locator('[data-slide-index="1"]')
    await expect(slide0).toHaveAttribute('aria-hidden', 'false')
    await expect(slide1).toHaveAttribute('aria-hidden', 'true')
  })
})
