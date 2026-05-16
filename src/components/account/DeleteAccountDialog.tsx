/**
 * DeleteAccountDialog — /hesabim/profil confirm dialog (React island, client:idle).
 *
 * Wave F3 / Agent-F3E.
 *
 * Clicking "Hesabımı sil" opens a centered modal. "İptal" is focused by
 * default (safer per spec) and "Sil" is subtle (no red). Confirming calls
 * `clearAll()` which wipes all three localStorage keys + dispatches change
 * events for sibling islands, then navigates to "/".
 */
import { useEffect, useRef, useState } from 'react'
import { clearAll } from '../../lib/account-store'

export default function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function confirmDelete() {
    clearAll()
    setOpen(false)
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5"
      data-delete-account=""
    >
      <div className="pb-3">
        <h2 className="font-serif text-lg tracking-tight">Hesabımı sil</h2>
        <p className="text-xs text-muted-foreground">
          Tüm favori, kayıtlı arama ve profil verilerin tarayıcıdan kalıcı
          olarak silinir.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-delete-account-trigger=""
        className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
      >
        Hesabımı sil
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          data-delete-account-dialog=""
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
          >
            <h3
              id="delete-account-title"
              className="font-serif text-xl tracking-tight"
            >
              Hesabını silmek istediğine emin misin?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bu işlem geri alınamaz. Favori arsaların, kayıtlı aramaların ve
              profil bilgilerin bu tarayıcıdan kaldırılır.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                data-delete-account-cancel=""
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                data-delete-account-confirm=""
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
