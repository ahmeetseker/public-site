import { expect, test } from '@playwright/test'

/**
 * Wave F8.D — Newsletter (footer form + 10s modal + /abonelik-onay).
 *
 * Coverage
 *   - Footer NewsletterForm submits, writes arsam.newsletter.v1, toast shown.
 *   - Invalid email surfaces an inline error and writes nothing.
 *   - SignupModal appears ~100ms after first visit (window.__newsletterModalDelay
 *     override), and is suppressed on re-visits via arsam.newsletter-modal-seen.v1.
 *   - SignupModal does NOT appear when an active subscription already exists.
 *   - /abonelik-onay?token=mock-XXX confirms the subscription (status='confirmed').
 *   - /abonelik-onay?action=unsubscribe marks the subscription as unsubscribed.
 */

const SUBSCRIPTION_KEY = 'arsam.newsletter.v1'
const MODAL_SEEN_KEY = 'arsam.newsletter-modal-seen.v1'

test.describe('Newsletter footer form (Wave F8.D)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.newsletter.v1')
        window.localStorage.removeItem('arsam.newsletter-modal-seen.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('valid email → toast + localStorage record', async ({ page }) => {
    await page.goto('/')

    // The footer form is `client:visible` — scroll the footer into view so
    // hydration kicks in before we interact with the form.
    await page.locator('[data-site-footer]').scrollIntoViewIfNeeded()
    const form = page.locator('[data-testid="newsletter-form"][data-variant="footer"]')
    await expect(form).toBeVisible({ timeout: 5000 })

    await form.locator('[data-testid="newsletter-email"]').fill('hello@arsam.net')
    await form.locator('[data-testid="newsletter-submit"]').click()

    const toast = form.locator('[data-testid="newsletter-toast"]')
    await expect(toast).toBeVisible({ timeout: 3000 })

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SUBSCRIPTION_KEY)
    expect(stored).toContain('hello@arsam.net')
    expect(stored).toContain('"status":"pending"')
  })

  test('invalid email → inline error, nothing stored', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-site-footer]').scrollIntoViewIfNeeded()
    const form = page.locator('[data-testid="newsletter-form"][data-variant="footer"]')
    await expect(form).toBeVisible({ timeout: 5000 })

    await form.locator('[data-testid="newsletter-email"]').fill('not-an-email')
    await form.locator('[data-testid="newsletter-submit"]').click()

    await expect(form.locator('[data-testid="newsletter-error"]')).toBeVisible()
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SUBSCRIPTION_KEY)
    expect(stored).toBeNull()
  })
})

test.describe('Newsletter SignupModal (Wave F8.D)', () => {
  test('appears after delay, dismiss sets modal-seen flag (no reshow)', async ({
    page,
    context,
  }) => {
    // Only clear once at the start of the test — sessionStorage survives
    // reload so the dismiss flag set by the user is honored on the second
    // visit. (addInitScript runs on every navigation.)
    await context.addInitScript(() => {
      const w = window as unknown as { __newsletterModalDelay?: number }
      w.__newsletterModalDelay = 150
      try {
        if (!window.sessionStorage.getItem('__nl_test_primed__')) {
          window.localStorage.removeItem('arsam.newsletter.v1')
          window.localStorage.removeItem('arsam.newsletter-modal-seen.v1')
          window.sessionStorage.setItem('__nl_test_primed__', '1')
        }
      } catch {
        /* ignore */
      }
    })

    await page.goto('/')

    const modal = page.locator('[data-testid="newsletter-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await modal.locator('[data-testid="newsletter-modal-dismiss"]').click()
    await expect(modal).toHaveCount(0)

    const seen = await page.evaluate((key) => window.localStorage.getItem(key), MODAL_SEEN_KEY)
    expect(seen).toBe('1')

    // Reload — modal must not re-appear (init script no longer clears storage).
    await page.reload()
    await page.waitForTimeout(400)
    await expect(page.locator('[data-testid="newsletter-modal"]')).toHaveCount(0)
  })

  test('does NOT appear when an active subscription already exists', async ({ page, context }) => {
    await context.addInitScript(() => {
      const w = window as unknown as { __newsletterModalDelay?: number }
      w.__newsletterModalDelay = 150
      try {
        window.localStorage.removeItem('arsam.newsletter-modal-seen.v1')
      } catch {
        /* ignore */
      }
      const record = {
        email: 'already@arsam.net',
        status: 'confirmed',
        subscribedAt: Date.now() - 10_000,
        confirmedAt: Date.now() - 1_000,
      }
      window.localStorage.setItem('arsam.newsletter.v1', JSON.stringify(record))
    })

    await page.goto('/')
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="newsletter-modal"]')).toHaveCount(0)
  })
})

test.describe('/abonelik-onay confirmation page (Wave F8.D)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.newsletter.v1')
        window.localStorage.removeItem('arsam.newsletter-modal-seen.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('?token=valid confirms the subscription', async ({ page, context }) => {
    // Seed a pending subscription + compute its mock token.
    await context.addInitScript(() => {
      const record = {
        email: 'seed@arsam.net',
        status: 'pending',
        subscribedAt: 1_700_000_000_000,
      }
      window.localStorage.setItem('arsam.newsletter.v1', JSON.stringify(record))
    })

    // Compute token client-side to match lib/newsletter mockToken().
    const token = await page.evaluate(() => {
      const normalized = 'seed@arsam.net'
      let hash = 0
      for (let i = 0; i < normalized.length; i++) {
        hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
      }
      return `mock-${hash.toString(36)}`
    })

    await page.goto(`/abonelik-onay?token=${token}`)

    const status = page.locator('[data-testid="newsletter-confirm-status"]')
    await expect(status).toHaveAttribute('data-action', 'confirmed', { timeout: 5000 })

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SUBSCRIPTION_KEY)
    expect(stored).toContain('"status":"confirmed"')
  })

  test('?action=unsubscribe marks the subscription unsubscribed', async ({ page, context }) => {
    await context.addInitScript(() => {
      const record = {
        email: 'bye@arsam.net',
        status: 'confirmed',
        subscribedAt: 1_700_000_000_000,
        confirmedAt: 1_700_000_001_000,
      }
      window.localStorage.setItem('arsam.newsletter.v1', JSON.stringify(record))
    })

    await page.goto('/abonelik-onay?action=unsubscribe')

    const status = page.locator('[data-testid="newsletter-confirm-status"]')
    await expect(status).toHaveAttribute('data-action', 'unsubscribed', { timeout: 5000 })

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), SUBSCRIPTION_KEY)
    expect(stored).toContain('"status":"unsubscribed"')
  })
})
