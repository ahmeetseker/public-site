import { test, expect } from '@playwright/test'

/**
 * Wave F9.C — /ofis/[slug] portfolio + agent + opening hours + contact form.
 *
 * Verifies:
 *   - 4 new sections render on a known office detail page (Atölye Ayvalık).
 *   - Portfolio gallery shows up to 6 cards + "See all" CTA links to /ara?ofis=.
 *   - Agent roster renders 3 cards with KVKK-safe tel: and mailto: links.
 *   - Opening hours grid shows 7 days; the live badge resolves to open or closed.
 *   - Contact form blocks submit without KVKK consent, then succeeds with a
 *     toast and persists to `arsam.office-contacts.v1`.
 */

const OFFICE_SLUG = 'atolye-emlak-ayvalik'

test.describe('/ofis/[slug] page deepening (Wave F9.C)', () => {
  test('renders portfolio gallery with cards + see-all CTA', async ({ page }) => {
    await page.goto(`/ofis/${OFFICE_SLUG}`)

    const section = page.locator('[data-office-portfolio-gallery]')
    await expect(section).toBeVisible({ timeout: 5_000 })

    const cards = section.locator('[data-portfolio-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(6)

    const seeAll = section.locator('[data-portfolio-see-all]')
    await expect(seeAll).toHaveAttribute('href', `/ara?ofis=${OFFICE_SLUG}`)
  })

  test('renders agent list with 3 cards and KVKK-safe contact links', async ({ page }) => {
    await page.goto(`/ofis/${OFFICE_SLUG}`)

    const agents = page.locator('[data-office-agents]')
    await expect(agents).toBeVisible({ timeout: 5_000 })

    const cards = agents.locator('[data-office-agent-card]')
    await expect(cards).toHaveCount(3)

    // Every card has a tel: and a mailto: link
    const phones = agents.locator('[data-agent-phone]')
    const mails = agents.locator('[data-agent-email]')
    await expect(phones).toHaveCount(3)
    await expect(mails).toHaveCount(3)

    const firstPhoneHref = await phones.first().getAttribute('href')
    const firstMailHref = await mails.first().getAttribute('href')
    expect(firstPhoneHref).toMatch(/^tel:\+/)
    expect(firstMailHref).toMatch(/^mailto:/)
  })

  test('renders 7-day opening hours grid with a live status badge', async ({ page }) => {
    await page.goto(`/ofis/${OFFICE_SLUG}`)

    const hours = page.locator('[data-office-hours]')
    await expect(hours).toBeVisible({ timeout: 5_000 })

    const rows = hours.locator('[data-office-hours-row]')
    await expect(rows).toHaveCount(7)

    // The badge becomes available after hydration; either "open" or "closed".
    const badge = hours.locator('[data-office-hours-badge]')
    await expect(badge).toBeVisible({ timeout: 5_000 })
    const variant = await badge.getAttribute('data-office-hours-badge')
    expect(['open', 'closed']).toContain(variant)
  })

  test('contact form rejects submission without KVKK consent then accepts with it', async ({ page }) => {
    await page.goto(`/ofis/${OFFICE_SLUG}`)

    // Clear any prior localStorage entries from a previous run
    await page.evaluate(() => window.localStorage.removeItem('arsam.office-contacts.v1'))

    const form = page.locator('[data-office-contact-form]')
    await expect(form).toBeVisible({ timeout: 5_000 })

    // Fill required fields but leave KVKK unchecked
    await form.locator('[data-contact-input="name"]').fill('Test Kullanıcı')
    await form.locator('[data-contact-input="phone"]').fill('+90 555 111 22 33')
    await form.locator('[data-contact-input="email"]').fill('test@example.com')
    await form.locator('[data-contact-input="message"]').fill('Merhaba, ilan hakkında bilgi alabilir miyim?')

    await form.locator('[data-contact-submit]').click()
    await expect(form.locator('[data-contact-error="kvkk"]')).toBeVisible()

    // Now consent and submit
    await form.locator('[data-contact-input="kvkk"]').check()
    await form.locator('[data-contact-submit]').click()

    const toast = page.locator('[data-contact-toast]')
    await expect(toast).toBeVisible({ timeout: 3_000 })

    // localStorage payload should hold our entry
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('arsam.office-contacts.v1'),
    )
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBeGreaterThan(0)
    const last = parsed[parsed.length - 1]
    expect(last.name).toBe('Test Kullanıcı')
    expect(last.kvkkAccepted).toBe(true)
  })

  test('office map section renders address and lazy-loads Leaflet container', async ({ page }) => {
    await page.goto(`/ofis/${OFFICE_SLUG}`)
    const mapSection = page.locator('[data-office-map]')
    await expect(mapSection).toBeVisible({ timeout: 5_000 })

    // Scroll into view to trigger client:visible hydration
    await mapSection.scrollIntoViewIfNeeded()

    // Either the canvas shell or its empty state must be present
    const canvas = mapSection.locator('[data-office-map-canvas]')
    await expect(canvas).toBeVisible({ timeout: 5_000 })
  })
})
