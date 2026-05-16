// Wave F8.B — Notification center (bell + inbox + /hesabim/bildirimler).
//
// Covers:
//   1. Bell renders with a red badge showing unread count (3 from the spec
//      §5 seed: ntf-001, ntf-002, ntf-005).
//   2. Clicking the bell opens the dropdown; clicking a notification flips
//      it to read and decrements the badge.
//   3. /hesabim/bildirimler renders the inbox; filter chips slice the list;
//      "Tümünü okundu say" clears unread.
//   4. EN page renders English labels.
//
// AuthGuard redirects unauthenticated visitors to /giris — we seed the demo
// cookie before each test so /hesabim/bildirimler renders. We pre-clear
// `arsam.notifications.v1` so each spec starts deterministic, letting the
// island seed itself fresh.
import { test, expect } from '@playwright/test'

const NOTIFICATIONS_KEY = 'arsam.notifications.v1'

test.describe('F8.B — Notification center', () => {
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
        window.localStorage.removeItem('arsam.notifications.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('bell shows unread badge with seeded count', async ({ page }) => {
    await page.goto('/')

    const badge = page.locator('[data-testid="notification-badge"]')
    await expect(badge).toBeVisible({ timeout: 5000 })
    await expect(badge).toHaveText('3')

    // Storage was seeded by the bell island.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      NOTIFICATIONS_KEY,
    )
    expect(stored).toContain('ntf-001')
    expect(stored).toContain('ntf-005')
  })

  test('clicking bell opens dropdown + click item marks read', async ({ page }) => {
    await page.goto('/')

    // Wait for the badge to confirm the island mounted + seeded.
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible({
      timeout: 5000,
    })

    await page.locator('[data-testid="notification-bell"]').click()
    const menu = page.locator('[data-testid="notification-menu"]')
    await expect(menu).toBeVisible()
    await expect(menu.locator('[data-testid="notification-item"]')).toHaveCount(5)

    // Click the first unread item — should mark read + decrement badge.
    // We strip the href first so the click doesn't actually navigate (the
    // markAsRead happens synchronously inside the onClick handler regardless).
    const firstUnread = menu
      .locator('[data-testid="notification-item"][data-notification-read="false"]')
      .first()
    await expect(firstUnread).toBeVisible()
    await firstUnread.evaluate((el) => el.removeAttribute('href'))
    await firstUnread.click({ noWaitAfter: true })

    // Badge decremented by 1 (3 → 2). Wait for the React state to flush.
    await expect(page.locator('[data-testid="notification-badge"]')).toHaveText('2')
  })

  test('inbox page filter chips + mark-all-read empties unread', async ({ page }) => {
    await page.goto('/hesabim/bildirimler')

    const inbox = page.locator('[data-testid="notification-inbox"]')
    await expect(inbox).toBeVisible({ timeout: 5000 })

    // 5 seeded rows visible under "all".
    await expect(
      page.locator('[data-testid="notification-row"]'),
    ).toHaveCount(5)

    // Unread filter → 3 rows (ntf-001, ntf-002, ntf-005).
    await page.locator('[data-testid="notification-filter-unread"]').click()
    await expect(page.locator('[data-testid="notification-row"]')).toHaveCount(3)
    await expect(
      page.locator(
        '[data-testid="notification-row"][data-notification-read="false"]',
      ),
    ).toHaveCount(3)

    // Read filter → 2 rows (ntf-003, ntf-004).
    await page.locator('[data-testid="notification-filter-read"]').click()
    await expect(page.locator('[data-testid="notification-row"]')).toHaveCount(2)

    // Back to all + mark-all-read.
    await page.locator('[data-testid="notification-filter-all"]').click()
    await page.locator('[data-testid="notification-mark-all-read"]').click()
    await expect(
      page.locator(
        '[data-testid="notification-row"][data-notification-read="false"]',
      ),
    ).toHaveCount(0)

    // Filter unread → empty state.
    await page.locator('[data-testid="notification-filter-unread"]').click()
    await expect(page.locator('[data-testid="notification-inbox-empty"]')).toBeVisible()
  })

  test('EN page renders English labels', async ({ page }) => {
    const res = await page.goto('/en/hesabim/bildirimler')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('[data-testid="notification-mark-all-read"]')).toContainText(
      'Mark all as read',
    )
    await expect(page.locator('[data-testid="notification-filter-all"]')).toContainText('All')
    await expect(page.locator('[data-testid="notification-filter-unread"]')).toContainText(
      'Unread',
    )
  })
})
