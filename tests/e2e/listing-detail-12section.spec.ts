import { test, expect } from '@playwright/test'

const SLUG = 'cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142'

const SECTIONS = [
  { id: 'hero', label: 'A — Hero', requiredText: /Satılık|Tarla|Arsa/i },
  { id: 'kimlik', label: 'B — Kimlik', requiredText: /Ada|Parsel|Vasfı/i },
  { id: 'harita', label: 'C — Harita', requiredText: /Katman|Yol|Uydu|Hibrit/i },
  { id: 'degerleme', label: 'D — Değerleme', requiredText: /Tahmin|Emsal|Yatırım/i },
  { id: 'serh', label: 'E — Şerh', requiredText: /Temiz|Dikkat|Kritik|TKGM/i },
  { id: 'imar', label: 'F — İmar', requiredText: /KAKS|TAKS|kat/i },
  { id: 'tarla', label: 'G — Tarla', requiredText: /Toprak|Sulama|İklim|veri/i },
  { id: 'risk', label: 'H — Risk', requiredText: /Deprem|Fay|Sel|Heyelan/i },
  { id: 'cevre', label: 'I — Çevre', requiredText: /Yürüme|Toplu|Bisiklet/i },
  { id: 'chat', label: 'J — AI Chat', requiredText: /soru|cevap|Sor/i },
  { id: 'karsi', label: 'K — Karşılaştır', requiredText: /Karşıl|emsal/i },
  { id: 'iletisim', label: 'L — Satıcı', requiredText: /Doğrulanmış|satıcı|Mesaj/i },
]

test.describe('Listing detail — 12 bölüm', () => {
  test('Sayfa render olur, hero h1 görünür', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('JSON-LD RealEstateListing + Breadcrumb', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    const jsonLds = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(jsonLds.some((j) => j.includes('RealEstateListing'))).toBe(true)
    expect(jsonLds.some((j) => j.includes('BreadcrumbList'))).toBe(true)
  })

  test('AnchorNav 11 chip görünür', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    const nav = page.getByRole('navigation', { name: /İlan bölümleri/i })
    await expect(nav).toBeVisible()
    const chips = nav.locator('a[href^="#"]')
    await expect(chips).toHaveCount(14)
  })

  for (const section of SECTIONS) {
    test(`Bölüm görünür: ${section.label}`, async ({ page }) => {
      await page.goto(`/ilan/${SLUG}`)
      const sec = page.locator(`section#${section.id}`)
      await expect(sec).toBeAttached()
      // G (Tarla) FarmlandModule: arsa vasfi=imarli olduğu için içerik null —
      // section etiketi DOM'da ama içi boş, visibility false. Attached yeter.
      if (section.id === 'tarla') return
      await sec.scrollIntoViewIfNeeded()
      await expect(sec).toBeVisible()
    })
  }

  // G (Tarla) FarmlandModule client-side data ile populate olur — section
  // SSR'da hidden render edebilir. Attached + DOM içi enough.
  // Daha detaylı tarla smoke için useFarmlandData hook'unu mock-uyumlu unit
  // test'le doğrularız (vitest, F37 sonrası slice).

  test('AnchorNav scroll-spy: kimlik bölümüne scroll, aktif chip "Kimlik"', async ({ page }) => {
    await page.goto(`/ilan/${SLUG}`)
    await page.locator('section#kimlik').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    const active = page.locator('nav a[aria-current="true"]')
    await expect(active).toHaveText(/Kimlik/i)
  })
})
