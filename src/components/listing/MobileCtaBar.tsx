/**
 * MobileCtaBar — F37 Faz 4.0.
 *
 * Mobil <1024px: ekranın altında sticky 64px CTA bar. 3 buton: Teklif ver,
 * Mesaj, Ara. Listing detay sayfasının en altına `client:idle` ile mount edilir.
 *
 * Desktop ≥1024px: render edilmez (md:hidden).
 */
import { type ReactElement } from 'react'

export interface MobileCtaBarProps {
  listingId: string
  phoneNumber?: string
  /** Make-an-offer dialog'unu açar — F37 Faz 4.B'de InteractionPanel ile bağlanır. */
  onOfferClick?: () => void
  onMessageClick?: () => void
}

export function MobileCtaBar({
  listingId,
  phoneNumber,
  onOfferClick,
  onMessageClick,
}: MobileCtaBarProps): ReactElement {
  return (
    <div
      role="region"
      aria-label="İlan etkileşim kısayolları"
      className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden"
    >
      <button
        type="button"
        onClick={onOfferClick}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background"
        data-listing-id={listingId}
      >
        Teklif
      </button>
      <button
        type="button"
        onClick={onMessageClick}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium"
      >
        Mesaj
      </button>
      <a
        href={phoneNumber ? `tel:${phoneNumber}` : '#iletisim'}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium"
      >
        Ara
      </a>
    </div>
  )
}

export default MobileCtaBar
