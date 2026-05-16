import { test, expect } from '@playwright/test'

const SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'

test.describe('Listing N bölüm — Etkileşim', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        // Suppress newsletter signup modal (1st-visit popup intercepts clicks).
        window.localStorage.setItem('arsam.newsletter-modal-seen.v1', '1')
        // Suppress onboarding tour modal (schema: arsam.onboarding.v1).
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
        // Dismiss cookie-consent banner so it doesn't intercept clicks.
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

  test('Etkilesim section attached', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    const sec = page.locator('section#etkilesim')
    await expect(sec).toBeAttached()
  })

  test('Make-an-offer dialog açılır, teklif gönderilir', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#etkilesim')
    await section.scrollIntoViewIfNeeded()
    const offerBtn = section.getByRole('button', { name: 'Teklif ver', exact: true }).first()
    await expect(offerBtn).toBeVisible({ timeout: 8000 })
    // Retry click until React onClick handler is wired (handles SSR/hydration race).
    await expect(async () => {
      await offerBtn.click({ timeout: 1000 })
      await expect(page.getByRole('dialog', { name: /Teklif formu/i })).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
    const dialog = page.getByRole('dialog', { name: /Teklif formu/i })
    await dialog.getByRole('button', { name: 'Teklif gönder', exact: true }).click()
    await expect(page.getByText(/Teklifin iletildi/i)).toBeVisible({ timeout: 5000 })
  })

  test('Rezervasyon button → onay flow', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#etkilesim')
    await section.scrollIntoViewIfNeeded()
    const resBtn = section.getByRole('button', { name: /Kaparoyla rezerv/i })
    await expect(resBtn).toBeVisible({ timeout: 8000 })
    await expect(async () => {
      await resBtn.click({ timeout: 1000 })
      await expect(page.getByRole('dialog').filter({ hasText: /7 gün senin için ayrılır/i })).toBeVisible({
        timeout: 1000,
      })
    }).toPass({ timeout: 10000 })
    const dialog = page.getByRole('dialog').filter({ hasText: /7 gün senin için ayrılır/i })
    await dialog.getByRole('button', { name: 'Rezerv et', exact: true }).click()
    await expect(page.getByText(/Rezerv tamam/i)).toBeVisible({ timeout: 5000 })
  })

  test('Co-view daveti gönder', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#etkilesim')
    await section.scrollIntoViewIfNeeded()
    const coBtn = section.getByRole('button', { name: /Co-view daveti gönder/i })
    await expect(coBtn).toBeVisible({ timeout: 8000 })
    await expect(async () => {
      await coBtn.click({ timeout: 1000 })
      await expect(section.getByRole('button', { name: /Davet gönderildi/i })).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
  })

  test('PriceDrop abone ol', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.waitForLoadState('networkidle')
    const section = page.locator('section#etkilesim')
    await section.scrollIntoViewIfNeeded()
    const subBtn = section.getByRole('button', { name: 'Abone ol', exact: true })
    await expect(subBtn).toBeVisible({ timeout: 8000 })
    await expect(async () => {
      await subBtn.click({ timeout: 1000 })
      await expect(section.getByRole('button', { name: /Aboneliği kapat/i })).toBeVisible({ timeout: 1000 })
    }).toPass({ timeout: 10000 })
  })
})
