import { expect, test } from '@playwright/test'

/**
 * Wave F6.A — /ilan-ver Step 3 photo upload E2E.
 *
 * Covers
 *  • Adding 3 valid photos through the file input → 3 grid tiles + counter.
 *  • Per-photo delete → grid shrinks + counter updates.
 *  • 9th upload rejected (8 max) → error visible, grid still 8.
 *  • Photo metadata persists into the draft (name/size — no blob).
 *
 * Why we don't add files via OS dialog: Playwright's `setInputFiles` accepts
 * an in-memory Buffer payload which jumps straight to the React change
 * handler — no real OS file picker is involved.
 */

const DRAFT_KEY = 'arsam.ilan-draft.v1'

function pngBuffer(): Buffer {
  // 1x1 transparent PNG — smallest valid file we can spread.
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZptKbsAAAAASUVORK5CYII=',
    'base64',
  )
}

test.describe('/ilan-ver Step 3 — FotoUpload (Wave F6.A)', () => {
  test.beforeEach(async ({ context }) => {
    // Pre-seed draft so step 3 is reachable without filling steps 1+2 via UI.
    await context.addInitScript((key) => {
      window.localStorage.removeItem(key)
      window.localStorage.setItem(
        key,
        JSON.stringify({
          il: 'İzmir',
          ilce: 'Urla',
          tip: 'imarli',
          alan: '1200',
          imar: 'konut',
          tapu: 'mustakil',
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
          lastStep: 3,
          updatedAt: new Date().toISOString(),
        }),
      )
    }, DRAFT_KEY)
  })

  test('adds 3 photos → grid renders 3 tiles, counter shows 3/8', async ({ page }) => {
    await page.goto('/ilan-ver/3')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')

    const uploader = page.locator('[data-foto-upload]')
    await expect(uploader).toBeVisible()

    const input = page.locator('[data-foto-input]')
    await input.setInputFiles([
      { name: 'foto-1.png', mimeType: 'image/png', buffer: pngBuffer() },
      { name: 'foto-2.png', mimeType: 'image/png', buffer: pngBuffer() },
      { name: 'foto-3.png', mimeType: 'image/png', buffer: pngBuffer() },
    ])

    const grid = page.locator('[data-foto-grid]')
    await expect(grid).toHaveAttribute('data-count', '3')
    await expect(grid.locator('[data-foto-tile]')).toHaveCount(3)
    await expect(uploader).toContainText('3 / 8')

    // Metadata persisted to draft.
    const draft = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      DRAFT_KEY,
    )
    expect(Array.isArray(draft.photos)).toBe(true)
    expect(draft.photos).toHaveLength(3)
    expect(draft.photos[0]).toHaveProperty('id')
    expect(draft.photos[0]).toHaveProperty('name', 'foto-1.png')
    expect(draft.photos[0]).toHaveProperty('size')
  })

  test('deleting one photo leaves the rest in order', async ({ page }) => {
    await page.goto('/ilan-ver/3')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    const input = page.locator('[data-foto-input]')
    await input.setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: pngBuffer() },
      { name: 'b.png', mimeType: 'image/png', buffer: pngBuffer() },
      { name: 'c.png', mimeType: 'image/png', buffer: pngBuffer() },
    ])
    const grid = page.locator('[data-foto-grid]')
    await expect(grid).toHaveAttribute('data-count', '3')

    // Delete middle photo.
    const tiles = grid.locator('[data-foto-tile]')
    const middle = tiles.nth(1)
    await middle.locator('[data-foto-remove]').click()

    await expect(grid).toHaveAttribute('data-count', '2')
    await expect(tiles).toHaveCount(2)

    const draft = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      DRAFT_KEY,
    )
    expect(draft.photos).toHaveLength(2)
    const names = draft.photos.map((p: { name: string }) => p.name)
    // Remaining names should be a.png + c.png (in original order).
    expect(names).toEqual(['a.png', 'c.png'])
  })

  test('9th photo rejected — grid stays at 8, error message visible', async ({ page }) => {
    await page.goto('/ilan-ver/3')
    await expect(page.locator('[data-ilan-wizard]')).toHaveAttribute('data-mounted', 'true')
    const input = page.locator('[data-foto-input]')

    const files = Array.from({ length: 9 }, (_, i) => ({
      name: `f-${i}.png`,
      mimeType: 'image/png',
      buffer: pngBuffer(),
    }))
    await input.setInputFiles(files)

    const grid = page.locator('[data-foto-grid]')
    await expect(grid).toHaveAttribute('data-count', '8')
    await expect(page.locator('[data-foto-error]')).toBeVisible()
  })
})
