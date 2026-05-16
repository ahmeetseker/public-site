import { test, expect } from '@playwright/test'

const SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'

test.describe('Listing M bölüm — AI Yatırım', () => {
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

  test('Yatirim section attached', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    const sec = page.locator('section#yatirim')
    await expect(sec).toBeAttached()
  })

  test('PriceForecastChart 12 ay başlığı görünür', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.locator('section#yatirim').scrollIntoViewIfNeeded()
    await expect(page.getByText(/12 ay fiyat tahmini/i)).toBeVisible({ timeout: 5000 })
  })

  test('RoiCalculator slider mount', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.locator('section#yatirim').scrollIntoViewIfNeeded()
    const slider = page.locator('input[type="range"]').first()
    await expect(slider).toBeVisible({ timeout: 5000 })
  })

  test('TaxBreakdownCard toplam tablosu', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.locator('section#yatirim').scrollIntoViewIfNeeded()
    await expect(page.getByText(/Tapu harcı/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Toplam/i).first()).toBeVisible()
  })

  test('NegotiationCoach accordion açılır', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#yatirim')
    await section.scrollIntoViewIfNeeded()
    const coach = section.getByRole('button', { name: /AI müzakere koçu/i })
    await expect(coach).toBeVisible({ timeout: 8000 })
    // Retry click until React onClick handler is wired.
    await expect(async () => {
      await coach.click({ timeout: 1000 })
      await expect(section.getByText(/Önerilen teklif/i)).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
  })
})
