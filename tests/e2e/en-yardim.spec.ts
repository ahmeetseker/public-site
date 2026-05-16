import { test, expect } from '@playwright/test'

const SLUGS = [
  'hesap-yonetimi',
  'ilan-yayinla',
  'karsilastirma-rehberi',
  'kvkk-haklarim',
  'ofis-iletisim',
] as const

test.describe('/en/yardim/* parity', () => {
  for (const slug of SLUGS) {
    test(`/en/yardim/${slug} renders with English body`, async ({ page }) => {
      const res = await page.goto(`/en/yardim/${slug}`)
      expect(res?.status()).toBeLessThan(400)
      // RootLayout emits BCP-47 lang (e.g. "en-US") for /en/* pages.
      await expect(page.locator('html')).toHaveAttribute('lang', /^en(-[A-Z]{2})?$/)

      // Article body should be present and non-trivial.
      const body = await page.locator('article').first().textContent()
      expect(body).toBeTruthy()
      expect(body!.length).toBeGreaterThan(50)

      // Kicker label is in English on /en/yardim/<slug>.
      await expect(page.locator('article')).toContainText('HELP ARTICLE')

      // Canonical URL points at /en/yardim/<slug> (RootLayout + ArticleLayout
      // both emit a <link rel="canonical">; trailing-slash variant is fine).
      const canonicalHrefs = await page
        .locator('link[rel="canonical"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')))
      expect(canonicalHrefs.length).toBeGreaterThan(0)
      expect(
        canonicalHrefs.some(
          (h) => h === `https://arsam.net/en/yardim/${slug}` || h === `https://arsam.net/en/yardim/${slug}/`,
        ),
      ).toBe(true)
    })
  }

  test('Article JSON-LD declares inLanguage en-US', async ({ page }) => {
    await page.goto('/en/yardim/ilan-yayinla')
    const ldScripts = page.locator('script[type="application/ld+json"]')
    const count = await ldScripts.count()
    let foundArticle = false
    for (let i = 0; i < count; i++) {
      const raw = await ldScripts.nth(i).textContent()
      if (raw && raw.includes('"@type":"Article"')) {
        foundArticle = true
        expect(raw).toContain('"inLanguage":"en-US"')
        break
      }
    }
    expect(foundArticle).toBe(true)
  })
})
