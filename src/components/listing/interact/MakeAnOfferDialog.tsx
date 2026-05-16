import { useState, type ReactElement } from 'react'

export interface MakeAnOfferDialogProps {
  listingId: string
  listedPrice: number
  minOfferPercent?: number
}

export function MakeAnOfferDialog({
  listingId,
  listedPrice,
  minOfferPercent = 80,
}: MakeAnOfferDialogProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [offer, setOffer] = useState(Math.round(listedPrice * 0.95))
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const minAccepted = Math.round((listedPrice * minOfferPercent) / 100)
  const isLow = offer < minAccepted

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setOpen(false)
    }, 2500)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background"
      >
        Teklif ver
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Teklif formu"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="font-serif text-xl mb-2">Teklifin iletildi ✓</div>
                <p className="text-sm text-muted-foreground">Satıcı 24 saat içinde geri dönecek.</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-lg mb-3">Teklif ver</h3>
                <label className="block mb-3">
                  <span className="text-xs text-muted-foreground">Teklif tutarı (TL)</span>
                  <input
                    type="number"
                    value={offer}
                    onChange={(e) => setOffer(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                    İlan fiyatı: ₺{listedPrice.toLocaleString('tr-TR')} · Min kabul: ₺{minAccepted.toLocaleString('tr-TR')}
                  </div>
                  {isLow && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Bu teklif minimum kabul sınırının altında — büyük olasılıkla reddedilecek.
                    </div>
                  )}
                </label>
                <label className="block mb-3">
                  <span className="text-xs text-muted-foreground">Not (opsiyonel)</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-sm"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 rounded-xl bg-foreground py-2 text-sm font-medium text-background"
                    data-listing-id={listingId}
                  >
                    Teklif gönder
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

export default MakeAnOfferDialog
