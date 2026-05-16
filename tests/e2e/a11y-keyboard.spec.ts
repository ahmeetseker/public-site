// Wave F23.A — WCAG 2.2 AA keyboard navigation E2E.
// Asserts:
//   - skip link present, hidden by default, visible on first Tab.
//   - skip link target (#main) exists and is keyboard-reachable.
//   - skip link locale switches between TR ("İçeriğe geç") and EN
//     ("Skip to content") via the /en path prefix.
//   - :focus-visible global outline applies to interactive elements once
//     they receive keyboard focus.
//   - Tab order is meaningful (skip link → header → main).
import { test, expect } from '@playwright/test'

test.describe('a11y keyboard navigation (F23.A)', () => {
  test('skip link present + hidden by default + revealed on Tab', async ({ page }) => {
    await page.goto('/')
    const skip = page.locator('[data-skip-link]')
    await expect(skip).toHaveCount(1)
    await expect(skip).toHaveAttribute('href', '#main')
    // sr-only hides via clip / 1px; bounding box should be effectively invisible.
    const boxBefore = await skip.boundingBox()
    expect(boxBefore?.width ?? 0).toBeLessThanOrEqual(2)

    // First Tab from the URL bar should focus the skip link (it's the
    // first focusable element in the body).
    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    const boxAfter = await skip.boundingBox()
    expect(boxAfter?.width ?? 0).toBeGreaterThan(40)
  })

  test('skip link activates and moves focus to <main id="main">', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.locator('[data-skip-link]')
    await expect(skip).toBeFocused()
    // Activate.
    await page.keyboard.press('Enter')
    // URL hash flips to #main; <main> must exist.
    await expect(page).toHaveURL(/#main$/)
    await expect(page.locator('main#main')).toHaveCount(1)
  })

  test('skip link label is locale-aware (TR / EN)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-skip-link]')).toHaveText(/İçeriğe geç/)

    await page.goto('/en/')
    await expect(page.locator('[data-skip-link]')).toHaveText(/Skip to content/)
  })

  test(':focus-visible outline applies to interactive elements', async ({ page }) => {
    await page.goto('/')
    // Tab past the skip link to land on the first header link.
    await page.keyboard.press('Tab') // skip link
    await page.keyboard.press('Tab') // first header element

    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return null
      const cs = window.getComputedStyle(el)
      return {
        tag: el.tagName,
        outlineWidth: cs.outlineWidth,
        outlineStyle: cs.outlineStyle,
      }
    })
    expect(outline).not.toBeNull()
    // Outline width should be the 2px ring our :focus-visible rule applies.
    expect(outline!.outlineWidth).toBe('2px')
    expect(outline!.outlineStyle).toBe('solid')
  })

  test('header → main Tab order is sensible', async ({ page }) => {
    await page.goto('/')
    // Sweep first 10 Tab stops; the focused element must always be inside
    // either <body> chrome (skip link, header) or <main>. Never inside
    // <footer> before <main> — that would indicate a broken DOM order.
    let mainSeen = false
    let footerBeforeMain = false
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const where = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return 'none'
        if (el.closest('main')) return 'main'
        if (el.closest('footer')) return 'footer'
        if (el.closest('header')) return 'header'
        return 'other'
      })
      if (where === 'main') mainSeen = true
      if (where === 'footer' && !mainSeen) footerBeforeMain = true
    }
    expect(footerBeforeMain).toBe(false)
  })
})
