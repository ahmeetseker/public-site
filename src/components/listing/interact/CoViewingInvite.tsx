import { useState, type ReactElement } from 'react'

export interface CoViewingInviteProps {
  listingId: string
}

export function CoViewingInvite({ listingId }: CoViewingInviteProps): ReactElement {
  const [sent, setSent] = useState(false)
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-2">Uzaktan birlikte gez</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Broker'a video çağrı daveti gönder, ilanı birlikte gezin.
      </p>
      <button
        type="button"
        disabled={sent}
        onClick={() => setSent(true)}
        className="w-full rounded-xl border border-border py-2 text-sm disabled:bg-emerald-50 dark:disabled:bg-emerald-950/30"
        data-listing-id={listingId}
      >
        {sent ? 'Davet gönderildi ✓ — yanıt bekleniyor' : 'Co-view daveti gönder'}
      </button>
    </article>
  )
}

export default CoViewingInvite
