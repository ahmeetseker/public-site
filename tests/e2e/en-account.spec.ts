// Wave F5.A — /en/hesabim/* parity + ProfileForm close-the-loop.
//
// Asserts:
//   1. /en/hesabim/ renders with lang=en
//   2. all 5 sub-pages return < 400
//   3. ProfileForm writes to arsam.buyer-profile.v1 on submit and shows the
//      English toast ('Profile updated ✓').
//
// AuthGuard redirects unauthenticated visitors to /giris — we seed the demo
// cookie before each test so the pages render. We also pre-clear the buyer
// profile slice so the save-flow assertion is deterministic.
import { test, expect } from '@playwright/test'

test.describe('/en/hesabim parity', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'arsam_buyer_demo',
        value: '1',
        path: '/',
        domain: 'localhost',
      },
    ])
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.buyer-profile.v1')
      } catch {}
    })
  })

  test('overview page renders in EN', async ({ page }) => {
    const res = await page.goto('/en/hesabim/')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page).toHaveURL(/\/en\/hesabim\/?/)
  })

  test('all 5 sub-pages reachable', async ({ page }) => {
    for (const slug of ['', 'favori', 'aramalar', 'mesajlar', 'profil']) {
      const res = await page.goto(`/en/hesabim/${slug}`)
      expect(res?.status(), `/en/hesabim/${slug}`).toBeLessThan(400)
    }
  })

  test('profil form updates localStorage', async ({ page }) => {
    await page.goto('/en/hesabim/profil')
    const form = page.getByTestId('profile-form')
    await expect(form).toBeVisible()
    // The form is client:idle — wait for hydration marker before interacting.
    await expect(form).toHaveAttribute('data-mounted', 'true')

    await form.getByTestId('profile-name').fill('Ada Lovelace')
    await form.getByTestId('profile-email').fill('ada@example.com')
    await form.getByTestId('profile-phone').fill('+905551234567')
    await form.getByTestId('profile-save').click()

    await expect(page.getByTestId('profile-toast')).toContainText(/Profile updated/)

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('arsam.buyer-profile.v1'),
    )
    expect(stored).toBeTruthy()
    expect(stored).toContain('Ada Lovelace')
    expect(stored).toContain('ada@example.com')
  })
})
