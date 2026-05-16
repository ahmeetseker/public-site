import { test, expect } from '@playwright/test'

const FREEZE_ANIM_CSS =
  '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; animation: none !important; transition: none !important; }'

// F31.E — Mobile 375x667 (iPhone SE) baseline suite.
// Bu suite kritik mobile route'ları için screenshot baseline yaratır ve
// horizontal overflow regression'larını yakalar.
// Update baseline: `pnpm --filter public-site exec playwright test mobile-375 --update-snapshots`
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/giris', name: 'login' },
  { path: '/kayit', name: 'register' },
  { path: '/ilan-ver', name: 'listing-form-step1' },
] as const

test.describe('Mobile 375px baseline', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  for (const { path, name } of ROUTES) {
    test(`${name} @ 375x667 (${path})`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await page.addStyleTag({ content: FREEZE_ANIM_CSS })

      // 1) Baseline screenshot her zaman alınır (Wave 3 audit ham veri).
      await expect(page).toHaveScreenshot(`public-${name}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })

      // 2) Horizontal overflow regression gate — baseline'dan sonra check edilir
      // ki test fail olsa bile screenshot baseline güncel kalsın.
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(
        hasHorizontalOverflow,
        `${name}: 375px'de yatay scroll var (overflow detected)`,
      ).toBe(false)
    })
  }
})
