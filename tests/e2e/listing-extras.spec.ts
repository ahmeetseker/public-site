// F24.A — Listing extras (virtual tour / floor plan / video) E2E.
//
// `getListingExtras` is deterministic on `listing.id` (Wave F24.0), so we
// hardcode known slugs per feature instead of probing every page. If the
// hashing buckets ever change, regenerate these by running:
//
//   pnpm --filter @landx/public-site exec tsx -e "..."
//   (see Wave F24.A retrospective in docs/parallel-agent-prompt-template)
//
// Slugs verified against the F24.A landed buckets:
//   • 28.AY.0142 — Cunda → NO extras (placeholder + no tabs)
//   • 10.AY.0207 — Ayvalık → hasVirtualTour
//   • 48.DT.0028 — Datça   → hasFloorPlan
//   • 09.AL.0061 — Alaçatı → hasVideo

import { test, expect } from '@playwright/test'

const SLUG_NO_EXTRAS = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'
const SLUG_VIRTUAL_TOUR = 'ayvalik-sarimsakli-580-agacli-zeytinlik-10.AY.0207'
const SLUG_FLOOR_PLAN = 'datca-merkez-villa-imarli-2-150-m-48.DT.0028'
const SLUG_VIDEO = 'alacati-bag-evi-imarli-asfalta-sifir-09.AL.0061'

test.describe('Listing extras', () => {
  test('listings without extras hide the tabs and still expose the placeholder CTA', async ({
    page,
  }) => {
    await page.goto(`/ilan/${SLUG_NO_EXTRAS}`)
    // No tabs section.
    await expect(page.getByTestId('listing-extras')).toHaveCount(0)
    // F6.B placeholder CTA still present (interest-capture preserved).
    await expect(page.getByTestId('virtual-tour-trigger')).toBeVisible()
  })

  test('virtual tour panel mounts Pannellum viewer', async ({ page }) => {
    await page.goto(`/ilan/${SLUG_VIRTUAL_TOUR}`)
    const section = page.getByTestId('listing-extras')
    await expect(section).toBeVisible()
    // Tour tab is the only / first active tab → panel visible.
    const tourTab = page.getByTestId('extras-tab-tour')
    await expect(tourTab).toBeVisible()
    await expect(tourTab).toHaveAttribute('aria-selected', 'true')
    const panel = page.getByTestId('extras-panel-tour')
    await expect(panel).toBeVisible()
    // Pannellum may take a tick to inject canvas — the host element with
    // role="application" must render either way.
    await expect(page.getByTestId('virtual-tour-viewer')).toBeVisible()
    await expect(page.getByTestId('virtual-tour-viewer')).toHaveAttribute(
      'role',
      'application',
    )
  })

  test('floor plan opens lightbox with zoom controls + Esc closes', async ({ page }) => {
    await page.goto(`/ilan/${SLUG_FLOOR_PLAN}`)
    const trigger = page.getByTestId('floor-plan-trigger')
    await trigger.scrollIntoViewIfNeeded()
    await expect(trigger).toBeVisible()
    await trigger.click()
    const modal = page.getByTestId('floor-plan-modal')
    await expect(modal).toBeVisible()
    await expect(modal).toHaveAttribute('role', 'dialog')
    // Zoom in twice → label updates.
    await page.getByTestId('floor-plan-zoom-in').click()
    await page.getByTestId('floor-plan-zoom-in').click()
    await expect(modal.locator('[aria-live="polite"]').first()).toContainText('150%')
    // Esc closes.
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()
  })

  test('video walkthrough renders a lazy youtube-nocookie iframe', async ({
    page,
  }) => {
    await page.goto(`/ilan/${SLUG_VIDEO}`)
    const tab = page.getByTestId('extras-tab-video')
    await expect(tab).toBeVisible()
    const iframe = page.getByTestId('video-walkthrough-iframe')
    await expect(iframe).toHaveAttribute('loading', 'lazy')
    await expect(iframe).toHaveAttribute(
      'src',
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    )
  })
})
