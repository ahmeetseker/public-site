import { test, expect } from '@playwright/test'

const FREEZE_ANIM_CSS =
  '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'

// Pages screenshotted across every viewport project (desktop / mobile / tablet).
// Playwright project name is suffixed automatically into the snapshot dir.
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/ara', name: 'search' },
  {
    path: '/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142',
    name: 'listing-detail',
  },
  { path: '/ofis/atolye-emlak-ayvalik', name: 'office-detail' },
  { path: '/bolge', name: 'regions-index' },
  { path: '/bolge/cesme', name: 'region-detail' },
  { path: '/sss', name: 'faq' },
  { path: '/kvkk', name: 'kvkk' },
  { path: '/giris', name: 'login' },
] as const

test.describe('Visual regression', () => {
  for (const { path, name } of PAGES) {
    test(`screenshot: ${name} (${path})`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await page.addStyleTag({ content: FREEZE_ANIM_CSS })
      await expect(page).toHaveScreenshot(`public-${name}.png`, {
        fullPage: false,
      })
    })
  }
})
