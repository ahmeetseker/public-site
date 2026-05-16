// Wave F7.D — /hesabim/destek ticket system.
//
// Asserts the buyer can:
//   1. land on an empty state ("Henüz destek talebiniz yok")
//   2. open the CreateTicketDialog, fill in the form, submit, and see the
//      ticket appear with status "Açık"
//   3. open the ticket detail modal and remove the ticket via the Sil action
//      (handler.accept() bypasses the window.confirm dialog)
//   4. render the English version with localized labels
//
// AuthGuard redirects unauthenticated visitors to /giris — we seed the demo
// cookie before each test so the pages render. We also pre-clear
// arsam.support-tickets.v1 so each spec starts with a deterministic state.
import { test, expect } from '@playwright/test'

const TICKETS_KEY = 'arsam.support-tickets.v1'

test.describe('/hesabim/destek — F7.D ticket system', () => {
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
        window.localStorage.removeItem('arsam.support-tickets.v1')
      } catch {
        /* ignore */
      }
    })
  })

  test('empty state renders + CTA opens dialog', async ({ page }) => {
    await page.goto('/hesabim/destek')

    const empty = page.locator('[data-support-empty]')
    await expect(empty).toBeVisible({ timeout: 5000 })
    await expect(empty).toContainText('Henüz destek talebiniz yok')

    await page.locator('[data-support-empty-cta]').click()
    await expect(page.locator('[data-create-ticket-dialog]')).toBeVisible()
  })

  test('create + appear + detail + remove flow', async ({ page }) => {
    await page.goto('/hesabim/destek')

    // Open dialog from the top-right CTA (also works via empty-state CTA).
    await page.locator('[data-support-new-cta]').click()
    const dialog = page.locator('[data-create-ticket-dialog]')
    await expect(dialog).toBeVisible()

    // Select kategori = "ilan", fill konu + mesaj.
    await page.locator('[data-ticket-category="ilan"]').click()
    await page.locator('[data-ticket-subject]').fill('İlan yayınlanmıyor')
    await page
      .locator('[data-ticket-message]')
      .fill('İlanımı yayınlamaya çalışıyorum ama hata alıyorum. Yardım edebilir misiniz?')

    await page.locator('[data-ticket-submit]').click()

    // Dialog closes; ticket appears in the list.
    await expect(dialog).toBeHidden({ timeout: 3000 })
    const list = page.locator('[data-support-tickets-list]')
    await expect(list).toBeVisible()
    const item = list.locator('[data-support-ticket]').first()
    await expect(item).toContainText('İlan yayınlanmıyor')
    await expect(item.locator('[data-support-status-badge]')).toHaveAttribute(
      'data-support-status-badge',
      'open',
    )
    await expect(item.locator('[data-support-status-badge]')).toContainText('Açık')

    // localStorage should reflect the new ticket.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      TICKETS_KEY,
    )
    expect(stored).toContain('İlan yayınlanmıyor')
    expect(stored).toMatch(/SUP-\d{4}-\d{3}/)

    // Open detail modal.
    const openBtn = item.locator('[data-support-ticket-open]')
    await openBtn.click()
    const detail = page.locator('[data-support-ticket-detail]')
    await expect(detail).toBeVisible()
    await expect(detail).toContainText('İlan yayınlanmıyor')

    // Remove via Sil — auto-accept the native confirm dialog.
    page.once('dialog', (d) => d.accept())
    await page.locator('[data-support-ticket-remove]').click()

    await expect(page.locator('[data-support-empty]')).toBeVisible()
  })

  test('EN page renders English labels', async ({ page }) => {
    const res = await page.goto('/en/hesabim/destek')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('[data-support-empty]')).toContainText(
      'No support tickets yet',
    )
    await expect(page.locator('[data-support-new-cta]')).toContainText(
      'New ticket',
    )
  })
})
