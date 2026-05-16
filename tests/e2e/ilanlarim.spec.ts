// Playwright: /hesabim/ilanlarim close-the-loop (Wave F5.E).
//
// AuthGuard requires the `arsam_buyer_demo` cookie; we seed it in beforeEach.
import { test, expect } from '@playwright/test'

test.describe('/hesabim/ilanlarim close-the-loop', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'arsam_buyer_demo',
        value: '1',
        domain: 'localhost',
        path: '/',
      },
    ])
  })

  test('empty state when no listings', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.ilanlarim.v1')
      } catch {
        /* ignore */
      }
    })
    await page.goto('/hesabim/ilanlarim')
    await expect(page.getByTestId('published-empty')).toBeVisible()
  })

  test('seeded entry appears in list (TR)', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        const entry = {
          ref: 'AR-TEST-001',
          title: 'Test Arsa',
          district: 'Datça',
          city: 'Muğla',
          price: 1000000,
          area: 800,
          zoning: 'Konut',
          status: 'aktif',
          createdAt: Date.now(),
        }
        window.localStorage.setItem(
          'arsam.ilanlarim.v1',
          JSON.stringify([entry]),
        )
      } catch {
        /* ignore */
      }
    })
    await page.goto('/hesabim/ilanlarim')
    await expect(page.getByTestId('published-AR-TEST-001')).toBeVisible()
    await expect(page.getByText('Test Arsa')).toBeVisible()
  })

  test('delete flow removes entry', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        const entry = {
          ref: 'AR-TEST-002',
          title: 'X',
          district: 'D',
          city: 'C',
          price: 1,
          area: 1,
          status: 'aktif',
          createdAt: Date.now(),
        }
        window.localStorage.setItem(
          'arsam.ilanlarim.v1',
          JSON.stringify([entry]),
        )
      } catch {
        /* ignore */
      }
    })
    await page.goto('/hesabim/ilanlarim')
    await expect(page.getByTestId('published-AR-TEST-002')).toBeVisible()
    await page.getByTestId('del-AR-TEST-002').click()
    await page.getByTestId('confirm-del-AR-TEST-002').click()
    await expect(page.getByTestId('published-empty')).toBeVisible()
  })

  test('EN page renders English copy', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.ilanlarim.v1')
      } catch {
        /* ignore */
      }
    })
    await page.goto('/en/hesabim/ilanlarim')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByTestId('published-empty')).toContainText(
      /haven't published/i,
    )
  })
})
