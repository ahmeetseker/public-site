import { expect, test } from '@playwright/test'

/**
 * Wave F6.A — MapPicker modal E2E (Step 2 of /ilan-ver).
 *
 * Leaflet is rendered into a tile-fed canvas; we don't assert tile content
 * but we DO assert:
 *   • clicking "Haritada seç" opens the dialog (`data-map-picker`)
 *   • clicking on the map drops a pin → coords surfaced, Confirm enabled
 *   • Confirm closes the modal AND writes lat/lng into the draft
 *   • Cancel leaves the draft unchanged
 */

const DRAFT_KEY = 'arsam.ilan-draft.v1'

test.describe('/ilan-ver Step 2 — MapPicker (Wave F6.A)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((key) => {
      window.localStorage.removeItem(key)
      window.localStorage.setItem(
        key,
        JSON.stringify({
          il: 'İzmir',
          ilce: 'Urla',
          tip: 'imarli',
          alan: '',
          imar: '',
          tapu: '',
          lat: '',
          lng: '',
          fiyat: '',
          aciklama: '',
          etiketler: [],
          fotograflar: [
            { id: 1, label: '', filled: false },
            { id: 2, label: '', filled: false },
            { id: 3, label: '', filled: false },
          ],
          photos: [],
          ad: '',
          telefon: '',
          email: '',
          kvkk: false,
          lastStep: 2,
          updatedAt: new Date().toISOString(),
        }),
      )
    }, DRAFT_KEY)
  })

  test('opens picker, drops pin via map click, confirm writes coords', async ({ page }) => {
    await page.goto('/ilan-ver/2')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    // Open the picker.
    await page.locator('[data-map-open]').click()
    const picker = page.locator('[data-map-picker]')
    await expect(picker).toBeVisible()

    // Wait for Leaflet to settle (canvas ready). The map container fills the
    // flex parent; the data-map-picker-canvas div is what Leaflet hydrates.
    await expect(picker).toHaveAttribute('data-ready', 'true', { timeout: 15_000 })

    // Confirm should start disabled (no pin yet).
    await expect(page.locator('[data-map-confirm]')).toHaveAttribute('data-can-confirm', 'false')

    // Click on the map canvas — Leaflet translates the click into latlng.
    const canvas = page.locator('[data-map-picker-canvas]')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('map canvas has no bounding box')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    // Pin now exists → confirm enabled + coords visible.
    await expect(page.locator('[data-map-confirm]')).toHaveAttribute('data-can-confirm', 'true', {
      timeout: 5_000,
    })
    await expect(page.locator('[data-map-picker-coords]')).toBeVisible()

    await page.locator('[data-map-confirm]').click()

    // Picker closes; lat/lng populated in the form inputs.
    await expect(picker).toHaveCount(0)
    const latVal = await page.locator('[data-field="lat"]').inputValue()
    const lngVal = await page.locator('[data-field="lng"]').inputValue()
    expect(latVal).not.toBe('')
    expect(lngVal).not.toBe('')
    expect(Number.isFinite(Number(latVal))).toBe(true)
    expect(Number.isFinite(Number(lngVal))).toBe(true)

    // Persisted to draft.
    const draft = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      DRAFT_KEY,
    )
    expect(draft.lat).toBe(latVal)
    expect(draft.lng).toBe(lngVal)
  })

  test('cancel leaves draft lat/lng untouched', async ({ page }) => {
    await page.goto('/ilan-ver/2')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    await page.locator('[data-map-open]').click()
    const picker = page.locator('[data-map-picker]')
    await expect(picker).toBeVisible()
    await expect(picker).toHaveAttribute('data-ready', 'true', { timeout: 15_000 })

    // Drop a pin (would be the "discarded" choice).
    const canvas = page.locator('[data-map-picker-canvas]')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('map canvas has no bounding box')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 3)
    await expect(page.locator('[data-map-confirm]')).toHaveAttribute('data-can-confirm', 'true', {
      timeout: 5_000,
    })

    await page.locator('[data-map-cancel]').click()
    await expect(picker).toHaveCount(0)

    // Draft lat/lng still empty.
    expect(await page.locator('[data-field="lat"]').inputValue()).toBe('')
    expect(await page.locator('[data-field="lng"]').inputValue()).toBe('')
    const draft = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      DRAFT_KEY,
    )
    expect(draft.lat).toBe('')
    expect(draft.lng).toBe('')
  })
})
