// Wave F9.B — /hesabim/mesajlar real-time mock.
//
// Covers:
//   1. MessagesView mounts, seeds 3 threads, list visible.
//   2. Sending a user message appends a bubble + read receipt starts at
//      "İletildi" (delivered).
//   3. Attachment dialog: URL paste → validation → preview → chip in composer.
//   4. Emoji picker: open grid → insert at cursor.
//   5. Office reply arrives within ~10s after user send (typing → reply).
//   6. Read-receipt: opening thr-001 (1 unread seeded) clears its badge
//      after the receipt delay.
//   7. EN page renders English chrome.
//
// We pre-clear `arsam.messages.v1` and set the demo cookie before each test.
import { test, expect } from '@playwright/test'

const MESSAGES_KEY = 'arsam.messages.v1'

test.describe('F9.B — Messages real-time mock', () => {
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
        window.localStorage.removeItem('arsam.messages.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('view mounts, seeds 3 threads, list visible', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')

    const view = page.locator('[data-testid="messages-view"]')
    await expect(view).toBeVisible({ timeout: 5000 })

    const rows = page.locator('[data-testid="messages-thread-row"]')
    await expect(rows).toHaveCount(3)

    // Seeded in localStorage.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      MESSAGES_KEY,
    )
    expect(stored).toContain('thr-001')
    expect(stored).toContain('thr-002')
    expect(stored).toContain('thr-003')
  })

  test('send user message → bubble appears with delivered receipt', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })

    // First thread (newest = thr-003) auto-selected.
    const ta = page.locator('[data-testid="composer-textarea"]')
    await ta.fill('Test mesajım F9.B')
    await page.locator('[data-testid="composer-send"]').click()

    const lastRow = page
      .locator('[data-testid="message-row"][data-message-from="me"]')
      .last()
    await expect(lastRow).toContainText('Test mesajım F9.B')
    // Delivered (✓) initially — not yet read.
    await expect(
      lastRow.locator('[data-testid="message-receipt"]'),
    ).toHaveAttribute('data-receipt', 'delivered')
  })

  test('attachment dialog validates URL + adds chip to composer', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })

    await page.locator('[data-testid="composer-attach-toggle"]').click()
    const dialog = page.locator('[data-testid="attachment-dialog"]')
    await expect(dialog).toBeVisible()

    // Invalid URL → submit disabled.
    await dialog
      .locator('[data-testid="attachment-url-input"]')
      .fill('not-a-url')
    await expect(dialog.locator('[data-testid="attachment-submit"]')).toBeDisabled()

    // Valid image URL → preview + enabled submit.
    await dialog
      .locator('[data-testid="attachment-url-input"]')
      .fill('https://example.com/photo.png')
    await expect(
      dialog.locator('[data-testid="attachment-preview-image"]'),
    ).toBeVisible()
    await dialog.locator('[data-testid="attachment-submit"]').click()

    // Chip rendered in composer.
    await expect(
      page.locator('[data-testid="composer-attachment-chip"]'),
    ).toHaveCount(1)
    await expect(
      page.locator('[data-testid="composer-attachment-chip"]'),
    ).toContainText('photo.png')
  })

  test('emoji picker opens + inserts emoji into textarea', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })

    await page.locator('[data-testid="composer-textarea"]').fill('hi ')
    await page.locator('[data-testid="composer-emoji-toggle"]').click()
    const picker = page.locator('[data-testid="emoji-picker"]')
    await expect(picker).toBeVisible()

    // 32 cells.
    await expect(picker.locator('[data-testid="emoji-cell"]')).toHaveCount(32)

    // Click the first cell (😊).
    await picker.locator('[data-testid="emoji-cell"]').first().click()
    await expect(page.locator('[data-testid="composer-textarea"]')).toHaveValue(
      /hi .*😊/,
    )
  })

  test('office reply arrives within 10s after user send', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })

    const beforeCount = await page
      .locator('[data-testid="message-row"][data-message-from="office"]')
      .count()

    await page.locator('[data-testid="composer-textarea"]').fill('Hızlı reply testi')
    await page.locator('[data-testid="composer-send"]').click()

    // Office reply scheduled at 2-5s + 2s = 4-7s; allow 10s budget.
    await expect(async () => {
      const count = await page
        .locator('[data-testid="message-row"][data-message-from="office"]')
        .count()
      expect(count).toBeGreaterThan(beforeCount)
    }).toPass({ timeout: 10_000 })
  })

  test('opening thr-001 clears its unread badge after receipt delay', async ({ page }) => {
    await page.goto('/hesabim/mesajlar')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })

    // thr-001 is seeded with unreadCount=1; auto-select picks thr-003 first
    // (most recent activity). Click thr-001 explicitly.
    const target = page.locator(
      '[data-testid="messages-thread-row"][data-thread-id="thr-001"]',
    )
    await target.click()

    // Wait beyond the 3s readReceipt delay.
    await expect(target.locator('[data-testid="messages-thread-unread-badge"]')).toHaveCount(
      0,
      { timeout: 6_000 },
    )
  })

  test('EN page renders English chrome', async ({ page }) => {
    const res = await page.goto('/en/hesabim/mesajlar')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('[data-testid="messages-view"]')).toBeVisible({
      timeout: 5000,
    })
    await expect(
      page.locator('[data-testid="composer-send"]'),
    ).toContainText('Send')
    await expect(
      page.locator('[data-testid="composer-attach-toggle"]'),
    ).toContainText('Attach')
  })
})
