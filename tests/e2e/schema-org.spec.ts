// Wave F22.A — Schema.org coverage smoke. Walks every page type that we just
// wired up to the F22.0 builders (`realEstateListingSchema`,
// `localBusinessSchema`, `faqPageSchema`, `placeSchema`, `articleSchema`,
// `breadcrumbListSchema`) and asserts that the page emits at least one
// well-formed JSON-LD payload of the expected `@type`.
//
// We parse every `<script type="application/ld+json">` on the page and look
// for the type via `.some(...)` so the order of script tags is not load-
// bearing — this lets F22.B add more schemas later (Organization on the
// homepage, etc.) without breaking the test.
import { test, expect, type Page } from '@playwright/test'

async function collectLdTypes(page: Page): Promise<string[]> {
  const blobs = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(blobs.length).toBeGreaterThan(0)
  const types: string[] = []
  for (const blob of blobs) {
    if (!blob.trim()) continue
    const parsed = JSON.parse(blob) as { '@type'?: string } | Array<{ '@type'?: string }>
    if (Array.isArray(parsed)) {
      for (const node of parsed) {
        if (node['@type']) types.push(node['@type'])
      }
    } else if (parsed['@type']) {
      types.push(parsed['@type'])
    }
  }
  return types
}

test.describe('Schema.org coverage', () => {
  test('/ilan/<slug> emits RealEstateListing + offers', async ({ page }) => {
    await page.goto('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    const types = await collectLdTypes(page)
    expect(types).toContain('RealEstateListing')
    // BreadcrumbList is now emitted from the page frontmatter too.
    expect(types).toContain('BreadcrumbList')

    // Spot-check that the listing JSON-LD actually carries Offer fields —
    // missing `offers.price` is the #1 reason Google rejects RealEstateListing.
    const listingBlob = (await page
      .locator('script[type="application/ld+json"]')
      .allTextContents())
      .find((b) => b.includes('"RealEstateListing"'))!
    expect(listingBlob).toContain('"price"')
    expect(listingBlob).toContain('"TRY"')
  })

  test('/ofis/<slug> emits RealEstateAgent', async ({ page }) => {
    await page.goto('/ofis/atolye-emlak-ayvalik')
    const types = await collectLdTypes(page)
    expect(types).toContain('RealEstateAgent')
    expect(types).toContain('BreadcrumbList')
  })

  test('/yardim/<slug> emits Article', async ({ page }) => {
    await page.goto('/yardim/hesap-yonetimi')
    const types = await collectLdTypes(page)
    expect(types).toContain('Article')
    // The shared Breadcrumb component still renders alongside the article.
    expect(types).toContain('BreadcrumbList')
  })

  test('/bolge/<slug> emits Place + FAQPage', async ({ page }) => {
    await page.goto('/bolge/ayvalik')
    const types = await collectLdTypes(page)
    expect(types).toContain('Place')
    expect(types).toContain('FAQPage')
    expect(types).toContain('BreadcrumbList')
  })

  test('EN /en/ilan/<slug> still emits RealEstateListing', async ({ page }) => {
    await page.goto('/en/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    const types = await collectLdTypes(page)
    expect(types).toContain('RealEstateListing')
  })

  test('EN /en/bolge/<slug> still emits Place + FAQPage', async ({ page }) => {
    await page.goto('/en/bolge/ayvalik')
    const types = await collectLdTypes(page)
    expect(types).toContain('Place')
    expect(types).toContain('FAQPage')
  })

  test('every covered page exposes at least one JSON-LD script', async ({ page }) => {
    const paths = [
      '/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142',
      '/ofis/atolye-emlak-ayvalik',
      '/yardim/hesap-yonetimi',
      '/bolge/ayvalik',
    ]
    for (const path of paths) {
      await page.goto(path)
      const count = await page.locator('script[type="application/ld+json"]').count()
      expect(count, `expected JSON-LD on ${path}`).toBeGreaterThan(0)
    }
  })
})
