import { test, expect } from '@playwright/test'

/**
 * Wave F24.C — public-site island command palette.
 *
 * The palette is wired into RootLayout.astro via `<CommandPaletteMount
 * client:idle />`. cmd+/ (mac) / ctrl+/ (Windows/Linux) toggles a lazy
 * modal that ships its own focus trap (F23.0) + recent-search ribbon.
 */
test.describe('public-site command palette (F24.C)', () => {
  test('cmd+/ opens the palette and focuses the search input', async ({ page }) => {
    await page.goto('/')
    // Wait for the idle island to register its keydown listener.
    await page.waitForLoadState('domcontentloaded')
    await page.keyboard.press('ControlOrMeta+/')

    const dialog = page.getByRole('dialog', { name: 'Komut paleti' })
    await expect(dialog).toBeVisible()

    const input = page.getByTestId('command-palette-input')
    await expect(input).toBeFocused()
  })

  test('typing narrows results to a recognised section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.keyboard.press('ControlOrMeta+/')

    const input = page.getByTestId('command-palette-input')
    await expect(input).toBeFocused()
    await input.fill('ofis')

    // At minimum one of AKSİYONLAR / SAYFALAR / SONUÇLAR is rendered.
    await expect(
      page.getByText(/AKSİYONLAR|SAYFALAR|SONUÇLAR/).first(),
    ).toBeVisible()
  })

  test('Enter activates the highlighted item and closes the palette', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.keyboard.press('ControlOrMeta+/')

    const input = page.getByTestId('command-palette-input')
    await expect(input).toBeFocused()
    // First flat item is the first action (id="go-compare"); pressing Enter
    // should navigate away from "/" and close the dialog.
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Komut paleti' })).not.toBeVisible()
  })

  test('Escape closes the palette without navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.keyboard.press('ControlOrMeta+/')

    const dialog = page.getByRole('dialog', { name: 'Komut paleti' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    // Still on the homepage — no navigation triggered.
    await expect(page).toHaveURL(/\/$/)
  })
})
