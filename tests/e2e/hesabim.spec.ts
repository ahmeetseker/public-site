import { expect, test } from '@playwright/test'

/**
 * Wave F3 / Agent-F3E — /hesabim/* React islands E2E.
 *
 * Public-site is SSG with no backend; the buyer dashboard persists its state
 * client-side under three localStorage keys:
 *   arsam.favorites.v1
 *   arsam.savedSearches.v1
 *   arsam.profile.v1
 *
 * These specs seed each key via `context.addInitScript()` (runs before any
 * page script, including the React island's hydration) and then asserts the
 * rendered island reflects that state. Conversely, they trigger UI actions
 * and assert localStorage was updated.
 *
 * No /ara favorite-toggle UI exists yet (Wave F4 will add it), so the
 * "add favorite from /ara → see in /hesabim/favori" flow is exercised by
 * writing to localStorage on the /ara origin and then navigating — which is
 * exactly what a future /ara favorite button will do.
 */

const FAVORITES_KEY = 'arsam.favorites.v1'
const SAVED_SEARCHES_KEY = 'arsam.savedSearches.v1'
const PROFILE_KEY = 'arsam.profile.v1'

test.describe('/hesabim/* — buyer account dashboard (Wave F3)', () => {
  test.beforeEach(async ({ context }) => {
    // AuthGuard.astro redirects /hesabim/* visitors without the demo cookie to
    // /giris. Seed it before any navigation so our specs land on the real page.
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
        window.localStorage.removeItem('arsam.favorites.v1')
        window.localStorage.removeItem('arsam.savedSearches.v1')
        window.localStorage.removeItem('arsam.profile.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('favori: seeded ids render as cards + remove updates count', async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ([key, ids]) => {
        try {
          window.localStorage.setItem(key as string, JSON.stringify(ids))
        } catch {
          /* ignore */
        }
      },
      [FAVORITES_KEY, ['28.AY.0142', '09.AL.0061']],
    )

    await page.goto('/hesabim/favori')

    const list = page.locator('[data-favorites-list]')
    await expect(list).toBeVisible({ timeout: 5000 })
    await expect(list).toHaveAttribute('data-count', '2')

    const removeBtn = page.locator('[data-favorite-remove="28.AY.0142"]')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    await expect(list).toHaveAttribute('data-count', '1')

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      FAVORITES_KEY,
    )
    expect(stored).toContain('09.AL.0061')
    expect(stored).not.toContain('28.AY.0142')
  })

  test('favori: empty state shows CTA to /ara', async ({ page }) => {
    await page.goto('/hesabim/favori')
    const empty = page.locator('[data-favorites-empty]')
    await expect(empty).toBeVisible({ timeout: 5000 })
    await expect(empty).toContainText('Henüz favori arsa yok')
  })

  test('aramalar: seeded saved searches render with matching count', async ({
    page,
    context,
  }) => {
    const entry = {
      id: 's_test_1',
      q: 'Ayvalık',
      filters: { tip: 'Tümü' },
      savedAt: new Date().toISOString(),
      label: 'Ayvalık · test',
    }
    await context.addInitScript(
      ([key, payload]) => {
        try {
          window.localStorage.setItem(key as string, JSON.stringify(payload))
        } catch {
          /* ignore */
        }
      },
      [SAVED_SEARCHES_KEY, [entry]],
    )

    await page.goto('/hesabim/aramalar')

    const list = page.locator('[data-saved-searches-list]')
    await expect(list).toBeVisible({ timeout: 5000 })
    await expect(list).toHaveAttribute('data-count', '1')

    const row = page.locator('[data-saved-search="s_test_1"]')
    await expect(row).toBeVisible()
    await expect(row).toContainText('Ayvalık · test')

    await page.locator('[data-saved-search-delete="s_test_1"]').click()
    const empty = page.locator('[data-saved-searches-empty]')
    await expect(empty).toBeVisible()
  })

  test('aramalar: empty state shows CTA to /ara', async ({ page }) => {
    await page.goto('/hesabim/aramalar')
    const empty = page.locator('[data-saved-searches-empty]')
    await expect(empty).toBeVisible({ timeout: 5000 })
  })

  test('profil: filling form updates progress bar + persists', async ({
    page,
  }) => {
    await page.goto('/hesabim/profil')

    const form = page.locator('[data-profile-form]')
    await expect(form).toBeVisible({ timeout: 5000 })

    // Wait for hydration.
    await expect(form).toHaveAttribute('data-mounted', 'true')

    const percentBadge = page.locator('[data-profile-percent]').first()
    await expect(percentBadge).toHaveAttribute('data-profile-percent', /\d+/)

    await page.locator('[data-profile-name]').fill('Demo Test')
    await page.locator('[data-profile-phone]').fill('+90 555 000 00 00')
    await page.locator('[data-profile-email]').fill('test@arsam.net')
    await page.locator('[data-profile-region="ayvalik"]').click()

    // Each filled field is worth 20% (5 tracked). With contactPref default 'email'
    // already counted, filling 3 + 1 region → at least 100%.
    await expect(percentBadge).toHaveAttribute('data-profile-percent', '100')

    await page.locator('[data-profile-save]').click()

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      PROFILE_KEY,
    )
    expect(stored).toContain('Demo Test')
    expect(stored).toContain('test@arsam.net')
    expect(stored).toContain('ayvalik')
  })

  test('profil: delete dialog confirm clears all localStorage and navigates home', async ({
    page,
  }) => {
    await page.goto('/hesabim/profil')

    // Seed values *after* navigation (and after the outer beforeEach init
    // script has run) so they're not wiped on the post-delete redirect.
    await page.evaluate(() => {
      window.localStorage.setItem('arsam.favorites.v1', JSON.stringify(['28.AY.0142']))
      window.localStorage.setItem(
        'arsam.savedSearches.v1',
        JSON.stringify([
          { id: 's_x', q: 'x', filters: {}, savedAt: new Date().toISOString() },
        ]),
      )
    })

    const trigger = page.locator('[data-delete-account-trigger]')
    await expect(trigger).toBeVisible({ timeout: 5000 })
    await trigger.click()

    const dialog = page.locator('[data-delete-account-dialog]')
    await expect(dialog).toBeVisible()

    // Click "Sil" — handler calls clearAll() *synchronously* before the
    // window.location.href assignment kicks in. Read localStorage *before*
    // the navigation completes so the assertion is deterministic regardless
    // of how the new page (which runs its own init script with our outer
    // beforeEach's removeItem calls) interacts with it.
    const cleared = await page.evaluate(() => {
      const btn = document.querySelector('[data-delete-account-confirm]') as HTMLButtonElement | null
      btn?.click()
      return {
        fav: window.localStorage.getItem('arsam.favorites.v1'),
        searches: window.localStorage.getItem('arsam.savedSearches.v1'),
        profile: window.localStorage.getItem('arsam.profile.v1'),
      }
    })
    expect(cleared.fav).toBeNull()
    expect(cleared.searches).toBeNull()
    expect(cleared.profile).toBeNull()

    await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 })
  })

  test('index hub: stats island shows live counts from localStorage', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'arsam.favorites.v1',
          JSON.stringify(['a', 'b', 'c']),
        )
        window.localStorage.setItem(
          'arsam.savedSearches.v1',
          JSON.stringify([
            { id: 's1', q: 'x', filters: {}, savedAt: new Date().toISOString() },
          ]),
        )
      } catch {
        /* ignore */
      }
    })

    await page.goto('/hesabim')

    const stats = page.locator('[data-account-stats]')
    await expect(stats).toBeVisible({ timeout: 5000 })
    await expect(stats).toHaveAttribute('data-mounted', 'true')

    await expect(page.locator('[data-account-stat="Favori arsa"]')).toContainText('3')
    await expect(page.locator('[data-account-stat="Kayıtlı arama"]')).toContainText('1')
  })

  test('mesajlar: clicking a sidebar row switches the thread inline', async ({
    page,
  }) => {
    // Wave F9.B replaced the inline MessagesList island with MessagesView —
    // updated selectors target the new island. Seeded threads: thr-001..003.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.messages.v1')
      } catch {
        /* ignore */
      }
    })
    await page.goto('/hesabim/mesajlar')

    const island = page.locator('[data-testid="messages-view"]')
    await expect(island).toBeVisible({ timeout: 5000 })

    // Default: thr-003 active (most-recent activity per seed).
    await expect(
      page.locator('[data-testid="message-thread"]'),
    ).toHaveAttribute('data-thread-id', 'thr-003')

    await page
      .locator('[data-testid="messages-thread-row"][data-thread-id="thr-002"]')
      .click()
    await expect(
      page.locator('[data-testid="message-thread"]'),
    ).toHaveAttribute('data-thread-id', 'thr-002')
  })
})
