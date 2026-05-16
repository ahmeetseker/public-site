import { test, expect } from '@playwright/test'

test.describe('Legal + SEO', () => {
  test('/kvkk renders', async ({ page }) => {
    await page.goto('/kvkk')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText(/KVKK/i).first()).toBeVisible()
  })

  test('/sitemap.xml is valid XML', async ({ request }) => {
    const r = await request.get('/sitemap.xml')
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toContain('xml')
    const body = await r.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('<loc>https://arsam.net/')
  })

  test('/robots.txt has sitemap reference', async ({ request }) => {
    const r = await request.get('/robots.txt')
    expect(r.status()).toBe(200)
    const body = await r.text()
    expect(body).toContain('Sitemap: https://arsam.net/sitemap.xml')
  })
})
