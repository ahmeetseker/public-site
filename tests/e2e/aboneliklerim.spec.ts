// Wave F7.B — /hesabim/aboneliklerim plan UI + invoice history E2E.
//
// AuthGuard.astro redirects /hesabim/* visitors without the arsam_buyer_demo
// cookie to /giris. Seed the cookie before every test so the islands render.
// We also wipe arsam.subscription.v1 to keep upgrade-flow assertions
// deterministic.
import { expect, test } from '@playwright/test'

const SUBSCRIPTION_KEY = 'arsam.subscription.v1'

test.describe('/hesabim/aboneliklerim — Wave F7.B', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'arsam_buyer_demo',
        value: '1',
        domain: 'localhost',
        path: '/',
      },
    ])
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.subscription.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('renders 3 plan cards with Free as default current plan', async ({ page }) => {
    await page.goto('/hesabim/aboneliklerim')

    const island = page.locator('[data-subscription-island]')
    await expect(island).toBeVisible({ timeout: 5000 })
    await expect(island).toHaveAttribute('data-mounted', 'true')
    await expect(island).toHaveAttribute('data-current-plan', 'free')

    // All 3 tier cards present.
    await expect(page.locator('[data-plan-card="free"]')).toBeVisible()
    await expect(page.locator('[data-plan-card="pro"]')).toBeVisible()
    await expect(page.locator('[data-plan-card="premium"]')).toBeVisible()

    // Free card carries the "current" badge.
    const freeCard = page.locator('[data-plan-card="free"]')
    await expect(freeCard).toHaveAttribute('data-plan-current', 'true')
    await expect(freeCard.locator('[data-plan-current-badge]')).toBeVisible()

    // Pro & Premium show the Yükselt CTA, not the badge.
    await expect(page.locator('[data-plan-cta="pro"]')).toBeVisible()
    await expect(page.locator('[data-plan-cta="premium"]')).toBeVisible()
  })

  test('upgrade to Pro: confirm modal flow appends invoice + updates plan', async ({
    page,
  }) => {
    await page.goto('/hesabim/aboneliklerim')
    await expect(page.locator('[data-subscription-island]')).toHaveAttribute(
      'data-mounted',
      'true',
    )

    // Empty invoice history initially.
    const invoiceTable = page.locator('[data-invoice-history]')
    await expect(invoiceTable).toBeVisible()
    await expect(invoiceTable).toHaveAttribute('data-count', '0')
    await expect(page.locator('[data-invoice-history-empty]')).toBeVisible()

    // Click the Pro upgrade CTA — confirm modal opens.
    await page.locator('[data-plan-cta="pro"]').click()
    const dialog = page.locator('[data-subscription-confirm-dialog="pro"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/Pro/)

    // Confirm the upgrade.
    await page.locator('[data-subscription-confirm-ok]').click()

    // Plan updates to pro.
    await expect(page.locator('[data-subscription-island]')).toHaveAttribute(
      'data-current-plan',
      'pro',
    )
    const proCard = page.locator('[data-plan-card="pro"]')
    await expect(proCard).toHaveAttribute('data-plan-current', 'true')

    // Toast appears.
    await expect(page.locator('[data-subscription-toast]')).toContainText('Plan güncellendi')

    // Invoice history now has 1 entry.
    await expect(invoiceTable).toHaveAttribute('data-count', '1')

    // localStorage carries the change.
    const stored = await page.evaluate(
      (k) => window.localStorage.getItem(k),
      SUBSCRIPTION_KEY,
    )
    expect(stored).toBeTruthy()
    expect(stored).toContain('"currentPlan":"pro"')
    expect(stored).toMatch(/INV-\d{4}-\d{3}/)
  })

  test('cancel button in modal aborts the upgrade', async ({ page }) => {
    await page.goto('/hesabim/aboneliklerim')
    await expect(page.locator('[data-subscription-island]')).toHaveAttribute(
      'data-mounted',
      'true',
    )

    await page.locator('[data-plan-cta="premium"]').click()
    await expect(page.locator('[data-subscription-confirm-dialog="premium"]')).toBeVisible()

    await page.locator('[data-subscription-confirm-cancel]').click()
    await expect(page.locator('[data-subscription-confirm-dialog="premium"]')).toHaveCount(0)

    // No upgrade happened — still on free.
    await expect(page.locator('[data-subscription-island]')).toHaveAttribute(
      'data-current-plan',
      'free',
    )
    await expect(page.locator('[data-invoice-history]')).toHaveAttribute('data-count', '0')
  })

  test('EN page renders with English labels', async ({ page }) => {
    await page.goto('/en/hesabim/aboneliklerim')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')

    const island = page.locator('[data-subscription-island]')
    await expect(island).toBeVisible({ timeout: 5000 })
    await expect(island).toHaveAttribute('data-mounted', 'true')

    // English plan names and CTAs.
    await expect(page.locator('[data-plan-card="free"]')).toContainText('Free')
    await expect(page.locator('[data-plan-card="pro"]')).toContainText('Pro')
    await expect(page.locator('[data-plan-card="premium"]')).toContainText('Premium')
    await expect(page.locator('[data-plan-cta="pro"]')).toContainText('Upgrade')

    // Invoice history heading is in English.
    await expect(page.locator('[data-invoice-history]')).toContainText('Invoice history')
  })

  test('seeded subscription renders Pro as current and existing invoice', async ({
    page,
    context,
  }) => {
    const seed = {
      currentPlan: 'pro',
      renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      cancelledAt: null,
      invoiceHistory: [
        {
          id: 'INV-2026-001',
          plan: 'pro',
          amount: 29,
          paidAt: Date.UTC(2026, 4, 1),
          status: 'paid',
        },
      ],
    }
    await context.addInitScript(
      ([key, payload]) => {
        try {
          window.localStorage.setItem(key as string, JSON.stringify(payload))
        } catch {
          /* ignore */
        }
      },
      [SUBSCRIPTION_KEY, seed],
    )

    await page.goto('/hesabim/aboneliklerim')

    await expect(page.locator('[data-subscription-island]')).toHaveAttribute(
      'data-current-plan',
      'pro',
    )
    await expect(page.locator('[data-plan-card="pro"]')).toHaveAttribute(
      'data-plan-current',
      'true',
    )
    // Free CTA becomes a downgrade button.
    const freeCta = page.locator('[data-plan-cta="free"]')
    await expect(freeCta).toBeVisible()
    await expect(freeCta).toHaveAttribute('data-plan-direction', 'downgrade')

    // Invoice from seed renders.
    await expect(page.locator('[data-invoice-history]')).toHaveAttribute('data-count', '1')
    await expect(page.locator('[data-invoice-row="INV-2026-001"]')).toBeVisible()
  })
})
