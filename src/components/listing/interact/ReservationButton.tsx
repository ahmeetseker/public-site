import { useState, type ReactElement } from 'react'

export interface ReservationButtonProps {
  listingId: string
  reservationFee: number
}

export function ReservationButton({
  listingId,
  reservationFee,
}: ReservationButtonProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border py-3 text-sm font-medium"
        data-listing-id={listingId}
      >
        Kaparoyla rezerv et — ₺{reservationFee.toLocaleString('tr-TR')}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            {confirmed ? (
              <div className="py-8 text-center">
                <div className="font-serif text-xl mb-2">Rezerv tamam ✓</div>
                <p className="text-sm text-muted-foreground">
                  İlan 7 gün boyunca senin adına ayrıldı. KYC ve ödeme akışı e-postanla devam ediyor.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-lg mb-3">Kaparoyla rezerve et</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  ₺{reservationFee.toLocaleString('tr-TR')} kaparo ile bu ilan 7 gün senin için ayrılır.
                  Ödeme akışı KYC sonrası başlar.
                </p>
                <ul className="mb-4 space-y-1 text-xs text-muted-foreground">
                  <li>✓ 7 gün ayrılma</li>
                  <li>✓ KYC tamamla → ödeme onayı</li>
                  <li>✓ Cayma 24 saat ücretsiz</li>
                </ul>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-border py-2 text-sm">
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmed(true)}
                    className="flex-1 rounded-xl bg-foreground py-2 text-sm font-medium text-background"
                  >
                    Rezerv et
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ReservationButton
