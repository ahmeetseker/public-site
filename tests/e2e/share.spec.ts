import { expect, test } from '@playwright/test'

// Faz 9.20 — KVKK-uyumlu paylaşım butonları smoke testi.
//
// Strateji:
//   1. Bilinen örnek listingdeki paylaş tetikleyicisini açar.
//   2. navigator.share native-mobil davranışı olduğu için chromium desktop'ta
//      doğrudan popover açılır.
//   3. "Bağlantıyı kopyala" tıklanır, toast görünür, clipboard kontrol edilir.
//   4. Üçüncü taraf <script> / <iframe> sızıntısı olmadığı doğrulanır.

test.describe('KVKK-uyumlu paylaşım butonları', () => {
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  })

  test('popover açılır, kopyala çalışır, toast görünür', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    const trigger = page.getByTestId('share-trigger')
    await expect(trigger).toBeVisible()

    await trigger.click()
    const popover = page.getByTestId('share-popover')
    await expect(popover).toBeVisible()

    // Intent linkleri doğru hostlara gidiyor mu?
    await expect(page.getByTestId('share-x')).toHaveAttribute(
      'href',
      /^https:\/\/twitter\.com\/intent\/tweet\?/,
    )
    await expect(page.getByTestId('share-whatsapp')).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\//,
    )
    await expect(page.getByTestId('share-facebook')).toHaveAttribute(
      'href',
      /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?/,
    )

    // "Bağlantıyı kopyala" → clipboard yazımı + toast.
    await page.getByTestId('share-copy').click()
    await expect(page.getByRole('status')).toContainText('Kopyalandı')

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardContent).toContain('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28')
  })

  test('üçüncü taraf SDK sızıntısı yok (KVKK)', async ({ page }) => {
    await page.goto('/ilan/cunda-denize-80m-yola-cephe-imarli-arsa-28.AY.0142')
    await page.getByTestId('share-trigger').click()
    await expect(page.getByTestId('share-popover')).toBeVisible()

    // Hiçbir Twitter / Facebook / WhatsApp script veya iframe yüklenmemeli.
    const scriptSrcs = await page.locator('script[src]').evaluateAll((els) =>
      els.map((el) => (el as HTMLScriptElement).src),
    )
    for (const src of scriptSrcs) {
      expect(src).not.toMatch(/(twitter|facebook|wa\.me|whatsapp)\./)
    }
    expect(await page.locator('iframe').count()).toBe(0)
  })
})
