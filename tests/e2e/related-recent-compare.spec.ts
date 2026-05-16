// Wave F24.B — multi-surface E2E covering:
//   1. SimilarListingsIsland renders score badge + reasons tooltip
//   2. RecentViewedSection empty-state + clear-all polish
//   3. Karşılaştır (`/karsilastir`) renders the 6-up CompareGrid with
//      DifferenceHighlight tints (emerald = best, rose = worst)
//
// Listing IDs are sourced from the deterministic mock seed
// (`packages/data/src/mock/listings.ts`). The first listing in the seed is
// `28.AY.0142` and the second `48.DT.0028` — both stable enough to drive the
// flow. Tests wipe `arsam.compare.v1` + `arsam.recent.v1` in beforeEach so
// state never bleeds between cases.

import { test, expect } from '@playwright/test'

const LISTING_SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'
const COMPARE_IDS = [
  '28.AY.0142',
  '48.DT.0028',
  '10.AY.0207',
  '09.AL.0061',
  '09.UR.0114',
  '10.AY.0218',
] as const

test.describe('F24.B — related listings score badge', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('SimilarListings surfaces a score badge with reasons tooltip', async ({
    page,
  }) => {
    await page.goto(`/ilan/${LISTING_SLUG}`)
    const sidebar = page.getByTestId('similar-listings')
    await sidebar.scrollIntoViewIfNeeded()
    await expect(sidebar).toBeVisible()

    const badges = page.getByTestId('similar-score')
    const badgeCount = await badges.count()
    expect(badgeCount).toBeGreaterThan(0)

    // Each badge shows a percentage and exposes the reasons via title=.
    const first = badges.first()
    await expect(first).toHaveText(/%\d{2,3}/)
    const title = await first.getAttribute('title')
    expect(title?.length ?? 0).toBeGreaterThan(0)

    // Score should be capped at 100 — sanity check the rendered text.
    const text = await first.textContent()
    const score = Number((text ?? '').replace('%', '').trim())
    expect(score).toBeGreaterThanOrEqual(30)
    expect(score).toBeLessThanOrEqual(100)
  })
})

test.describe('F24.B — recently-viewed polish', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.recent.v1')
        window.sessionStorage.removeItem('__recent_wiped__')
      } catch {
        /* ignore */
      }
    })
  })

  test('homepage section is hidden when no recent listings exist', async ({
    page,
  }) => {
    await page.goto('/')
    // Pre-hydration the island renders nothing; post-hydration with an empty
    // store it surfaces the empty state. We poll for either outcome via the
    // `data-recent-empty` flag.
    const section = page.locator('[data-testid="recent-section"]')
    await expect(section).toHaveCount(0, { timeout: 2000 }).catch(async () => {
      // If hydration mounted the empty state, accept that path instead.
      await expect(page.getByTestId('recent-empty')).toBeVisible()
    })
  })

  test('Clear-all button wipes the menu and surfaces empty state', async ({
    page,
  }) => {
    // Seed one viewed listing then visit /.
    await page.goto('/ara')
    await page.locator('a[href^="/ilan/"]').first().click()
    await page.waitForLoadState('networkidle')

    await page.goto('/')
    await page.getByTestId('recent-trigger').first().click()
    const menu = page.getByTestId('recent-menu')
    await expect(menu).toBeVisible()

    await page.getByTestId('recent-clear').click()
    await expect(menu).toContainText('Henüz')
  })
})

test.describe('F24.B — /karsilastir 6-up grid + DifferenceHighlight', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((ids) => {
      try {
        window.localStorage.setItem('arsam.compare.v1', JSON.stringify(ids))
      } catch {
        /* ignore */
      }
    }, COMPARE_IDS as unknown as string[])
  })

  test('renders 6 cards in the 6-up grid (xl:grid-cols-6)', async ({
    page,
  }) => {
    await page.goto(`/karsilastir?ids=${COMPARE_IDS.join(',')}`)
    const grid = page.getByTestId('compare-grid')
    await expect(grid).toBeVisible()
    await expect(grid).toHaveAttribute('data-compare-count', '6')
    const cards = page.getByTestId('compare-grid-card')
    await expect(cards).toHaveCount(6)
  })

  test('DifferenceHighlight tints best/worst price cells', async ({ page }) => {
    await page.goto(`/karsilastir?ids=${COMPARE_IDS.join(',')}`)
    const grid = page.getByTestId('compare-grid')
    await expect(grid).toBeVisible()

    // Price row: at least one "best" + one "worst" tint across the row.
    const priceCells = page.locator(
      '[data-testid="compare-grid-metric"][data-row-key="price"]',
    )
    await expect(priceCells).toHaveCount(6)
    const tints = await priceCells.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-diff-tint')),
    )
    expect(tints).toContain('best')
    expect(tints).toContain('worst')
  })
})
