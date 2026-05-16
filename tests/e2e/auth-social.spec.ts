import { expect, test } from '@playwright/test'

/**
 * Wave F7.A — Social login mock + password reset flow.
 *
 * Scope:
 *   1. /giris + /kayit: SocialLoginButtons mounts 3 providers (Google / Apple /
 *      Facebook) above the email/password form; clicking any provider sets
 *      `arsam_buyer_demo` cookie and redirects to /hesabim (~600ms).
 *   2. EN parity: /en/giris + /en/kayit render the EN labels and redirect to
 *      /en/hesabim/.
 *   3. /sifre-sifirla: KVKK-safe response — submitting the form always shows
 *      the same neutral toast (no "email not found" leakage), records an
 *      attempt in localStorage `arsam.password-reset-attempts.v1`, and
 *      redirects to /giris after ~5s.
 *   4. Throttle: >3 attempts/hour for the same email → throttle alert visible.
 */

const RESET_KEY = 'arsam.password-reset-attempts.v1'

test.describe('Wave F7.A — Social login mock (/giris + /kayit)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.password-reset-attempts.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('/giris renders all 3 social providers above the form', async ({ page }) => {
    await page.goto('/giris')

    const wrapper = page.locator('[data-social-login]')
    await expect(wrapper).toBeVisible({ timeout: 5000 })

    await expect(page.locator('[data-social-provider="google"]')).toBeVisible()
    await expect(page.locator('[data-social-provider="apple"]')).toBeVisible()
    await expect(page.locator('[data-social-provider="facebook"]')).toBeVisible()
  })

  test('/kayit renders all 3 social providers above the form', async ({ page }) => {
    await page.goto('/kayit')

    await expect(page.locator('[data-social-provider="google"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-social-provider="apple"]')).toBeVisible()
    await expect(page.locator('[data-social-provider="facebook"]')).toBeVisible()
  })

  test('Clicking Google on /giris sets the demo cookie + shows toast + redirects', async ({
    page,
    context,
  }) => {
    await page.goto('/giris')

    const btn = page.locator('[data-social-provider="google"]')
    await expect(btn).toBeVisible({ timeout: 5000 })
    await btn.click()

    // Toast appears.
    await expect(page.locator('[data-social-toast]')).toBeVisible({ timeout: 2000 })

    // Redirect lands on /hesabim/.
    await page.waitForURL(/\/hesabim/, { timeout: 3000 })

    const cookies = await context.cookies()
    const buyerCookie = cookies.find((c) => c.name === 'arsam_buyer_demo')
    expect(buyerCookie).toBeDefined()
    expect(buyerCookie?.value).toMatch(/^social-/)
  })

  test('/en/giris renders English social button labels', async ({ page }) => {
    await page.goto('/en/giris')
    await expect(page.locator('[data-social-provider="google"]')).toContainText(/Google/i, {
      timeout: 5000,
    })
    // EN copy uses "Continue with" prefix.
    await expect(page.locator('[data-social-provider="google"]')).toContainText(/Continue with/i)
  })

  test('Clicking Apple on /en/kayit redirects to /en/hesabim/', async ({ page }) => {
    await page.goto('/en/kayit')
    const btn = page.locator('[data-social-provider="apple"]')
    await expect(btn).toBeVisible({ timeout: 5000 })
    await btn.click()
    await page.waitForURL(/\/en\/hesabim/, { timeout: 3000 })
  })

  test('"Şifremi unuttum" link on /giris points to /sifre-sifirla', async ({ page }) => {
    await page.goto('/giris')
    const link = page.locator('a[href="/sifre-sifirla"]')
    await expect(link).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Wave F7.A — /sifre-sifirla password reset (KVKK-safe)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.password-reset-attempts.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('Submitting form shows neutral toast + records attempt in localStorage', async ({
    page,
  }) => {
    await page.goto('/sifre-sifirla')

    await page.locator('#reset-email').fill('demo@arsam.net')
    await page.locator('button[type="submit"]').click()

    const toast = page.locator('[data-reset-toast]')
    await expect(toast).toBeVisible({ timeout: 2000 })
    await expect(toast).toHaveAttribute('data-state', 'visible')

    // KVKK-safe wording — must never reveal existence.
    const toastText = await toast.textContent()
    expect(toastText?.toLowerCase()).not.toContain('bulunamadı')
    expect(toastText?.toLowerCase()).not.toContain('not found')

    const stored = await page.evaluate((k) => window.localStorage.getItem(k), RESET_KEY)
    expect(stored).toContain('demo@arsam.net')
  })

  test('Form redirects to /giris after ~5s', async ({ page }) => {
    await page.goto('/sifre-sifirla')
    await page.locator('#reset-email').fill('redirect-test@arsam.net')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/giris/, { timeout: 7000 })
  })

  test('Throttle kicks in after 3 attempts/hour for same email', async ({ page }) => {
    await page.goto('/sifre-sifirla')

    // Pre-seed 3 recent attempts for the test email.
    await page.evaluate(
      ({ key, email }) => {
        const now = Date.now()
        const seed = [
          { email, ts: now - 1000 },
          { email, ts: now - 2000 },
          { email, ts: now - 3000 },
        ]
        window.localStorage.setItem(key, JSON.stringify(seed))
      },
      { key: RESET_KEY, email: 'throttle@arsam.net' },
    )

    await page.locator('#reset-email').fill('throttle@arsam.net')
    await page.locator('button[type="submit"]').click()

    const throttle = page.locator('[data-reset-throttle]')
    await expect(throttle).toBeVisible({ timeout: 2000 })

    // The KVKK toast should NOT appear when throttled (avoid double messaging).
    await expect(page.locator('[data-reset-toast]')).toBeHidden()
  })

  test('/en/sifre-sifirla renders EN labels and submit works', async ({ page }) => {
    await page.goto('/en/sifre-sifirla')

    const submit = page.locator('button[type="submit"]')
    await expect(submit).toContainText(/Send reset link|Reset/i, { timeout: 5000 })

    await page.locator('#reset-email').fill('en-user@arsam.net')
    await submit.click()

    await expect(page.locator('[data-reset-toast]')).toBeVisible({ timeout: 2000 })
  })
})
