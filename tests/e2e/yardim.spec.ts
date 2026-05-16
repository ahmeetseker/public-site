import { test, expect } from '@playwright/test'

test.describe('/yardim help center', () => {
  test('hub shows category cards', async ({ page }) => {
    await page.goto('/yardim')
    await expect(page.locator('h1')).toContainText(/yardımcı/i)
    const cards = page.locator('[data-testid="help-categories"] > *')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(3)
  })

  test('clicking an article opens it with a breadcrumb', async ({ page }) => {
    await page.goto('/yardim')
    // First category card has an article list; click the first article link.
    const firstArticle = page
      .locator('[data-testid="help-categories"] a')
      .first()
    await firstArticle.click()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Yardım')
  })

  test('HelpSearch filters "ilan"', async ({ page }) => {
    await page.goto('/yardim')
    const input = page.getByRole('searchbox', { name: /yardım makalelerinde ara/i })
    await input.fill('ilan')
    const results = page.locator('[data-testid="help-search-results"]')
    await expect(results).toBeVisible()
    await expect(results).toContainText(/İlan nasıl yayınlanır\?/i)
  })

  test('sitemap includes /yardim routes', async ({ request }) => {
    const r = await request.get('/sitemap.xml')
    expect(r.status()).toBe(200)
    const body = await r.text()
    expect(body).toContain('https://arsam.net/yardim')
    expect(body).toContain('https://arsam.net/yardim/ilan-yayinla')
    expect(body).toContain('https://arsam.net/yardim/kvkk-haklarim')
  })

  test('article has canonical and Article JSON-LD', async ({ page }) => {
    await page.goto('/yardim/ilan-yayinla')
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBe('https://arsam.net/yardim/ilan-yayinla')
    const ldScripts = page.locator('script[type="application/ld+json"]')
    const count = await ldScripts.count()
    let foundArticle = false
    for (let i = 0; i < count; i++) {
      const raw = await ldScripts.nth(i).textContent()
      if (raw && raw.includes('"@type":"Article"')) {
        foundArticle = true
        expect(raw).toContain('"inLanguage":"tr-TR"')
        break
      }
    }
    expect(foundArticle).toBe(true)
  })
})
