import { expect, test } from '@playwright/test'

/**
 * Wave F8.C — Onboarding tour spec.
 *
 * The OnboardingTour island is mounted globally in RootLayout
 * (`<OnboardingTour client:idle />`). It schedules a 2-second timer on
 * first hydration; if `arsam.onboarding.v1` is null at that moment,
 * a 5-step modal carousel opens.
 *
 * Flows covered:
 *   1. First visit → modal appears after ~2s; Next x4 → Bitir → modal closes
 *      + persisted state has completed=true.
 *   2. Second visit (after completion) → modal does NOT appear.
 *   3. First visit → Skip → modal closes immediately, state marked completed
 *      so a follow-up visit also does NOT show the modal.
 */

const ONBOARDING_KEY = 'arsam.onboarding.v1'

test.describe('Onboarding tour (Wave F8.C)', () => {
  test.beforeEach(async ({ context }) => {
    // Wipe the onboarding flag so every test starts fresh.
    await context.addInitScript((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }, ONBOARDING_KEY)
  })

  test('first visit opens modal after 2s and Bitir finishes the tour', async ({ page }) => {
    await page.goto('/')

    // client:idle hydration + 2s setTimeout — allow generous budget on cold start.
    const modal = page.locator('[data-testid="onboarding-tour"]')
    await expect(modal).toBeVisible({ timeout: 15000 })
    await expect(modal).toHaveAttribute('data-step', '1')

    // Click Next four times to walk steps 1 → 5.
    for (let i = 0; i < 4; i++) {
      await page.locator('[data-testid="tour-next"]').click()
    }
    await expect(modal).toHaveAttribute('data-step', '5')

    const finish = page.locator('[data-testid="tour-finish"]')
    await expect(finish).toBeVisible()
    await finish.click()

    await expect(page.locator('[data-testid="onboarding-tour"]')).toHaveCount(0)

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      ONBOARDING_KEY,
    )
    expect(stored).toContain('"completed":true')
  })

  test('second visit does NOT auto-open the modal', async ({ page }) => {
    // Seed completed state so the 2s timer guard short-circuits.
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          completed: true,
          currentStep: 5,
          completedSteps: [1, 2, 3, 4, 5],
          startedAt: 1,
          finishedAt: 2,
        }),
      )
    }, ONBOARDING_KEY)

    await page.goto('/')

    // Wait past the 2s trigger window.
    await page.waitForTimeout(2500)
    await expect(page.locator('[data-testid="onboarding-tour"]')).toHaveCount(0)
  })

  test('Skip closes the modal and persists as completed', async ({ page }) => {
    await page.goto('/')

    const modal = page.locator('[data-testid="onboarding-tour"]')
    await expect(modal).toBeVisible({ timeout: 15000 })

    await page.locator('[data-testid="tour-skip"]').click()
    await expect(page.locator('[data-testid="onboarding-tour"]')).toHaveCount(0)

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      ONBOARDING_KEY,
    )
    expect(stored).toContain('"completed":true')
  })
})
