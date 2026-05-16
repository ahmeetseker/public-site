import { test, expect } from '@playwright/test'

// Wave F22.C — OG PNG endpoint smoke.
//
// Verifies the SSG-pre-rendered Satori PNGs ship at the expected URLs with
// the correct Content-Type. We don't pixel-compare (Satori renders are
// font-host stable, but anti-alias differences across CI hosts would
// produce noise) — instead we assert HTTP 200 + image/png + non-trivial
// body size.

const MARQUEE_SLUGS = ['anasayfa', 'ilan', 'ofis', 'bolge', 'yardim', 'blog']

test.describe('/og/*.png endpoints', () => {
  test('home.png is served as image/png', async ({ request, baseURL }) => {
    const res = await request.get(new URL('/og/home.png', baseURL!).toString())
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/image\/png/)
    const body = await res.body()
    expect(body.length).toBeGreaterThan(1000)
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect([...body.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })

  for (const slug of MARQUEE_SLUGS) {
    test(`/og/${slug}.png is served as image/png`, async ({ request, baseURL }) => {
      const res = await request.get(new URL(`/og/${slug}.png`, baseURL!).toString())
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toMatch(/image\/png/)
      const body = await res.body()
      expect(body.length).toBeGreaterThan(1000)
    })
  }

  test('RootLayout advertises og:image as image/png', async ({ page }) => {
    await page.goto('/')
    const ogType = page.locator('meta[property="og:image:type"]')
    await expect(ogType).toHaveAttribute('content', 'image/png')
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(ogImage).toMatch(/\/og\/anasayfa\.png$/)
  })
})
