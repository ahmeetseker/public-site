import { expect, test } from '@playwright/test'

/**
 * Wave F4 / Agent-F4A — /ilan-ver interactive wizard E2E.
 *
 * The /ilan-ver wizard is a 4-step React island that persists draft state
 * under `arsam.ilan-draft.v1`. These specs:
 *   1. Land on /ilan-ver/1, fill step 1, advance, fill step 2, go back, assert
 *      step 1 values are preserved.
 *   2. Walk all 4 steps end-to-end → preview → publish → tesekkurler renders
 *      a ref number that matches the `?id=AT-…` URL param.
 *
 * The wizard mounts with `client:load`, so we wait on
 * `[data-mounted="true"]` rather than relying on a brittle `waitForTimeout`.
 */

const DRAFT_KEY = 'arsam.ilan-draft.v1'

test.describe('/ilan-ver wizard — Wave F4', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('arsam.ilan-draft.v1')
        window.localStorage.removeItem('arsam:ilan-ver:state')
      } catch {
        /* ignore */
      }
    })
  })

  test('step 1 → step 2 → back preserves step 1 state', async ({ page }) => {
    await page.goto('/ilan-ver/1')
    const wizard = page.locator('[data-ilan-wizard]')
    await expect(wizard).toHaveAttribute('data-mounted', 'true')

    // Fill step 1.
    await page.locator('[data-field="il"]').selectOption('İzmir')
    await page.locator('[data-field="ilce"]').fill('Urla · Bademler')
    await page.locator('[data-field="tip"][data-value="imarli"]').click()

    // Next.
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/2(\/)?$/)

    // Fill step 2 partially.
    await page.locator('[data-field="alan"]').fill('1240')

    // Back to step 1.
    await page.locator('[data-wizard-prev]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/1(\/)?$/)
    const wizard1Back = page.locator('[data-ilan-wizard]')
    await expect(wizard1Back).toHaveAttribute('data-mounted', 'true')

    // Step 1 state preserved.
    await expect(page.locator('[data-field="il"]')).toHaveValue('İzmir')
    await expect(page.locator('[data-field="ilce"]')).toHaveValue('Urla · Bademler')
    await expect(page.locator('[data-field="tip"][data-value="imarli"]')).toHaveAttribute(
      'data-active',
      'true',
    )

    // localStorage carries the same.
    const draft = await page.evaluate((key) => {
      return JSON.parse(window.localStorage.getItem(key) || '{}')
    }, DRAFT_KEY)
    expect(draft.il).toBe('İzmir')
    expect(draft.ilce).toBe('Urla · Bademler')
    expect(draft.tip).toBe('imarli')
  })

  test('full flow: 4 steps → preview → publish → tesekkurler shows ref', async ({ page }) => {
    await page.goto('/ilan-ver/1')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    // Step 1
    await page.locator('[data-field="il"]').selectOption('Muğla')
    await page.locator('[data-field="ilce"]').fill('Datça · Hızırşah')
    await page.locator('[data-field="tip"][data-value="zeytinlik"]').click()
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/2/)

    // Step 2
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="alan"]').fill('3200')
    await page.locator('[data-field="imar"]').selectOption('tarim')
    await page.locator('[data-field="tapu"][data-value="mustakil"]').click()
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/3/)

    // Step 3
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="fiyat"]').fill('5400000')
    await page
      .locator('[data-field="aciklama"]')
      .fill('Datça yarımadasında, deniz manzaralı, 120 yaşında zeytin ağaçları. Yola cepheli.')
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/4/)

    // Step 4
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    await page.locator('[data-field="ad"]').fill('Ayşe Yılmaz')
    await page.locator('[data-field="telefon"]').fill('+90 532 111 22 33')
    await page.locator('[data-field="kvkk"]').check()
    await page.locator('[data-wizard-next]').click()
    await expect(page).toHaveURL(/\/ilan-ver\/onizleme/)

    // Preview
    const preview = page.locator('[data-ilan-onizleme]')
    await expect(preview).toHaveAttribute('data-mounted', 'true')
    await expect(preview).toHaveAttribute('data-can-submit', 'true')
    await expect(preview).toContainText('3.200 m²')
    await expect(preview).toContainText('Datça')

    // Publish.
    await page.locator('[data-ilan-publish]').click()
    await page.waitForURL(/\/ilan-ver\/tesekkurler\?id=AT-\d{4}-\d{4}/)

    // Tesekkurler renders the ref from the URL.
    const success = page.locator('[data-ilan-success]')
    await expect(success).toHaveAttribute('data-mounted', 'true')
    const refAttr = await success.getAttribute('data-ref')
    expect(refAttr).toMatch(/^AT-\d{4}-\d{4}$/)
    const refText = await page.locator('[data-ref-value]').textContent()
    expect(refText?.trim()).toBe(refAttr)

    // Draft cleared after publish.
    const cleared = await page.evaluate((key) => window.localStorage.getItem(key), DRAFT_KEY)
    expect(cleared).toBeNull()
  })

  test('next button disabled (cannot advance) until step 1 valid', async ({ page }) => {
    await page.goto('/ilan-ver/1')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    const nextBtn = page.locator('[data-wizard-next]')
    await expect(nextBtn).toHaveAttribute('data-can-advance', 'false')

    // Click the disabled-by-state Next — should NOT navigate, errors appear.
    await nextBtn.click()
    await expect(page).toHaveURL(/\/ilan-ver\/1/)
    await expect(page.locator('[data-error="il"]')).toBeVisible()
    await expect(page.locator('[data-error="ilce"]')).toBeVisible()
    await expect(page.locator('[data-error="tip"]')).toBeVisible()
  })
})
