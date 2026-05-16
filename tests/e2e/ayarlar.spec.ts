import { expect, test } from '@playwright/test'

/**
 * Wave F7.C — /hesabim/ayarlar (4 collapsible sections + KVKK m.11).
 *
 * Covers the localStorage-only SettingsForm React island:
 *   - All 4 sections render and the first (Bildirimler) is open by default.
 *   - Toggling a notification debounces (~500ms) → autosave toast appears and
 *     `arsam.settings.v1` is updated with the new boolean.
 *   - Switching language EN → URL prefix `/en` applied (and back).
 *   - "Veri indir (KVKK m.11)" triggers an actual download.
 *   - "Hesabımı sil" requires both the acknowledgement checkbox AND the
 *     literal "SİL" text before the confirm button enables, then clears
 *     every `arsam.*.v1` key and redirects to `/`.
 *
 * All `/hesabim/*` routes need the demo cookie (AuthGuard.astro).
 */

const SETTINGS_KEY = 'arsam.settings.v1'
const FAVORITES_KEY = 'arsam.favorites.v1'

test.describe('/hesabim/ayarlar — Wave F7.C', () => {
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
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && /^arsam\..+\.v\d+$/.test(k)) keys.push(k)
        }
        for (const k of keys) localStorage.removeItem(k)
      } catch {
        /* ignore */
      }
    })
  })

  test('4 collapsible sections render; first open by default', async ({ page }) => {
    await page.goto('/hesabim/ayarlar')

    const form = page.locator('[data-settings-form]')
    await expect(form).toBeVisible({ timeout: 5000 })
    await expect(form).toHaveAttribute('data-mounted', 'true')

    await expect(page.locator('[data-settings-section="notifications"]')).toBeVisible()
    await expect(page.locator('[data-settings-section="language"]')).toBeVisible()
    await expect(page.locator('[data-settings-section="privacy"]')).toBeVisible()
    await expect(page.locator('[data-settings-section="account"]')).toBeVisible()

    await expect(page.locator('[data-settings-section="notifications"]')).toHaveAttribute(
      'data-open',
      'true',
    )
    await expect(page.locator('[data-settings-section="language"]')).toHaveAttribute(
      'data-open',
      'false',
    )

    // Expand language section.
    await page.locator('[data-settings-toggle="language"]').click()
    await expect(page.locator('[data-settings-section="language"]')).toHaveAttribute(
      'data-open',
      'true',
    )
  })

  test('toggling a notification autosaves + updates localStorage', async ({ page }) => {
    await page.goto('/hesabim/ayarlar')

    const form = page.locator('[data-settings-form]')
    await expect(form).toHaveAttribute('data-mounted', 'true')

    // Default is true — toggling should make it false.
    const cell = page.locator('[data-settings-notif="newMessage.email"]')
    await expect(cell).toBeChecked()
    await cell.uncheck()

    // Toast appears after the 500ms debounce.
    const toast = page.locator('[data-settings-toast]')
    await expect(toast).toBeVisible({ timeout: 2000 })

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      SETTINGS_KEY,
    )
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.notifications.newMessage.email).toBe(false)
    // Deep-merge sanity — sibling channels for the same row stay true.
    expect(parsed.notifications.newMessage.sms).toBe(true)
    expect(parsed.notifications.newMessage.push).toBe(true)
    // Sibling rows untouched.
    expect(parsed.notifications.newListing.email).toBe(true)
  })

  test('changing language EN redirects to /en/hesabim/ayarlar', async ({ page }) => {
    await page.goto('/hesabim/ayarlar')
    await expect(page.locator('[data-settings-form]')).toHaveAttribute('data-mounted', 'true')

    // Open the Language section.
    await page.locator('[data-settings-toggle="language"]').click()

    await page.locator('[data-settings-language]').selectOption('en')
    await page.waitForURL((url) => url.pathname === '/en/hesabim/ayarlar', { timeout: 5000 })
    await expect(page.locator('[data-settings-form]')).toBeVisible({ timeout: 5000 })
  })

  test('KVKK m.11 data export triggers JSON file download', async ({ page }) => {
    await page.goto('/hesabim/ayarlar')
    await expect(page.locator('[data-settings-form]')).toHaveAttribute('data-mounted', 'true')

    // Seed a known arsam key so the payload has content.
    await page.evaluate(
      ([k]) => window.localStorage.setItem(k, JSON.stringify(['lst-1'])),
      [FAVORITES_KEY],
    )

    // Open Account section, click "Veri indir".
    await page.locator('[data-settings-toggle="account"]').click()

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 })
    await page.locator('[data-settings-export]').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^arsam-veri-\d{4}-\d{2}-\d{2}\.json$/)
  })

  test('delete account requires ack + "SİL" then clears arsam keys and redirects', async ({
    page,
  }) => {
    await page.goto('/hesabim/ayarlar')
    await expect(page.locator('[data-settings-form]')).toHaveAttribute('data-mounted', 'true')

    // Seed two arsam keys so we can prove they're cleared.
    await page.evaluate(() => {
      window.localStorage.setItem('arsam.favorites.v1', JSON.stringify(['x']))
      window.localStorage.setItem('arsam.savedSearches.v1', JSON.stringify([]))
      // Non-arsam key — should survive.
      window.localStorage.setItem('theme', 'dark')
    })

    await page.locator('[data-settings-toggle="account"]').click()
    await page.locator('[data-settings-delete]').click()

    const dialog = page.locator('[data-settings-delete-dialog]')
    await expect(dialog).toBeVisible()

    const confirmBtn = page.locator('[data-settings-delete-confirm]')
    await expect(confirmBtn).toBeDisabled()

    await page.locator('[data-settings-delete-ack]').check()
    await expect(confirmBtn).toBeDisabled() // still needs the typed word

    await page.locator('[data-settings-delete-input]').fill('SİL')
    await expect(confirmBtn).toBeEnabled()

    // Confirm synchronously and capture the cleared state before the navigation
    // resets the page context.
    const cleared = await page.evaluate(() => {
      const btn = document.querySelector(
        '[data-settings-delete-confirm]',
      ) as HTMLButtonElement | null
      btn?.click()
      return {
        favorites: window.localStorage.getItem('arsam.favorites.v1'),
        savedSearches: window.localStorage.getItem('arsam.savedSearches.v1'),
        settings: window.localStorage.getItem('arsam.settings.v1'),
        theme: window.localStorage.getItem('theme'),
      }
    })

    expect(cleared.favorites).toBeNull()
    expect(cleared.savedSearches).toBeNull()
    expect(cleared.settings).toBeNull()
    expect(cleared.theme).toBe('dark')

    await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 })
  })
})
