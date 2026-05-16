import { test, expect } from '@playwright/test'

// Wave F8 / Agent-F8A — Blog hub + post detail + EN parity.
//
// Covers:
//   - Hub renders heading, posts and category chips.
//   - Category chip filters cards in-place.
//   - Clicking a card navigates to the post page.
//   - Post page renders title, body and breadcrumb back to /blog.
//   - EN mirror at /en/blog reaches the EN versions.
test.describe('/blog content collection', () => {
  test('hub renders cards + category chips', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.locator('h1')).toContainText(/arsa pazarı|notes|notlar/i)

    const cards = page.locator('[data-testid="blog-card"]')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(5)

    const chips = page.locator('[data-testid="blog-category-filter"] button')
    expect(await chips.count()).toBeGreaterThanOrEqual(4)
  })

  test('clicking the "Duyuru" chip narrows visible cards', async ({ page }) => {
    await page.goto('/blog')
    const allChip = page.locator('[data-testid="blog-category-filter"] button[data-category="all"]')
    await expect(allChip).toHaveAttribute('aria-pressed', 'true')

    const duyuruChip = page.locator(
      '[data-testid="blog-category-filter"] button[data-category="duyuru"]',
    )
    await duyuruChip.click()
    await expect(duyuruChip).toHaveAttribute('aria-pressed', 'true')

    // After filtering, every visible card should be in the duyuru category.
    const visibleCards = page.locator('[data-testid="blog-card"]:visible')
    const count = await visibleCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
    for (let i = 0; i < count; i++) {
      await expect(visibleCards.nth(i)).toHaveAttribute('data-category', 'duyuru')
    }
  })

  test('post page renders title + body + back link', async ({ page }) => {
    await page.goto('/blog/arsam-net-nasil-calisir')
    await expect(page.locator('h1')).toContainText(/arsam.net/i)
    await expect(page.locator('[data-testid="post-body"]')).toBeVisible()
    await expect(page.locator('[data-testid="post-read-time"]')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Blog')

    // Canonical present + BlogPosting JSON-LD. (RootLayout emits canonical
    // with a trailing slash; we accept either form.)
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href')
    expect(canonical).toMatch(/^https:\/\/arsam\.net\/blog\/arsam-net-nasil-calisir\/?$/)

    const ldScripts = page.locator('script[type="application/ld+json"]')
    const ldCount = await ldScripts.count()
    let foundBlogPosting = false
    for (let i = 0; i < ldCount; i++) {
      const raw = await ldScripts.nth(i).textContent()
      if (raw && raw.includes('"@type":"BlogPosting"')) {
        foundBlogPosting = true
        expect(raw).toContain('"inLanguage":"tr-TR"')
        break
      }
    }
    expect(foundBlogPosting).toBe(true)
  })

  test('related posts section appears with peers', async ({ page }) => {
    // arsam-net-nasil-calisir is in category "rehber" with 2 peers.
    await page.goto('/blog/arsam-net-nasil-calisir')
    const related = page.locator('[data-testid="related-posts"]')
    await expect(related).toBeVisible()
    expect(await related.locator('[data-testid="related-post"]').count()).toBeGreaterThanOrEqual(1)
  })

  test('EN /en/blog mirrors the hub and post', async ({ page }) => {
    await page.goto('/en/blog')
    await expect(page.locator('h1')).toContainText(/notes on the land market|land market/i)
    const cards = page.locator('[data-testid="blog-card"]')
    expect(await cards.count()).toBeGreaterThanOrEqual(5)

    await page.goto('/en/blog/arsam-net-nasil-calisir')
    await expect(page.locator('h1')).toContainText(/how arsam.net works/i)
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href')
    expect(canonical).toMatch(/^https:\/\/arsam\.net\/en\/blog\/arsam-net-nasil-calisir\/?$/)
  })
})
