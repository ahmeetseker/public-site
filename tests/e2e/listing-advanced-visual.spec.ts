import { test, expect } from '@playwright/test'

const ARSA_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'

test.describe('Listing O bölüm — Gelişmiş Görsel', () => {
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

  test('Gorsel section attached', async ({ page }) => {
    await page.goto(`/ilan/${ARSA_SLUG}`)
    const sec = page.locator('section#gorsel')
    await expect(sec).toBeAttached()
  })

  test('Arsa için SunPathClock görünür', async ({ page }) => {
    await page.goto(`/ilan/${ARSA_SLUG}`)
    await page.locator('section#gorsel').scrollIntoViewIfNeeded()
    await expect(page.getByText(/Güneşlenme/i)).toBeVisible({ timeout: 5000 })
  })

  test('Yaz/Kış tab toggle çalışır', async ({ page }) => {
    await page.goto(`/ilan/${ARSA_SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#gorsel')
    await section.scrollIntoViewIfNeeded()
    const tablist = section.getByRole('tablist', { name: 'Mevsim' })
    await expect(tablist).toBeVisible({ timeout: 8000 })
    const summer = tablist.getByRole('tab', { name: 'Yaz', exact: true })
    await expect(summer).toHaveAttribute('aria-selected', 'true', { timeout: 5000 })
    const winter = tablist.getByRole('tab', { name: 'Kış', exact: true })
    // Retry click until React onClick handler is wired (SunPathClock is client:visible).
    await expect(async () => {
      await winter.click({ timeout: 1000 })
      await expect(winter).toHaveAttribute('aria-selected', 'true', { timeout: 1000 })
    }).toPass({ timeout: 10000 })
  })

  test('Solar potansiyel kartı render olur', async ({ page }) => {
    await page.goto(`/ilan/${ARSA_SLUG}`)
    await page.locator('section#gorsel').scrollIntoViewIfNeeded()
    await expect(page.getByText(/Solar potansiyel/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Verim/).first()).toBeVisible()
  })

  test('Drone placeholder görünür (videoUrl yok)', async ({ page }) => {
    await page.goto(`/ilan/${ARSA_SLUG}`)
    await page.locator('section#gorsel').scrollIntoViewIfNeeded()
    await expect(page.getByText(/Drone çekim henüz eklenmedi/i)).toBeVisible({ timeout: 5000 })
  })
})
