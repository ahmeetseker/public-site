/**
 * FavoriteToggle — per-listing-card heart button (React island, client:idle).
 *
 * Wave F4 / Agent-F4B. Closes the loop on F3E's /hesabim/favori page by
 * letting the user *write* to `arsam.favorites.v1` from /ara result cards.
 *
 * Visual: small circular button overlaid top-LEFT of the card (CompareToggle
 * sits top-right, so we don't collide). Token-only colors:
 *   - Favorited:   bg-foreground/[0.12] text-foreground (filled heart)
 *   - Unfavorited: bg-card/80           text-foreground/60 (outline heart)
 *
 * Subscribes to `arsam:favorites-changed` and the cross-tab `storage` event so
 * multiple toggles on the same page (e.g. /hesabim/favori → /ara back-nav)
 * stay in sync.
 *
 * Hit target: 44×44 on mobile, 36×36 on md+ (Apple/Google touch guideline).
 * aria-label flips between "Favori ekle" / "Favorilerden çıkar".
 */
import { useCallback, useEffect, useState } from 'react'
import {
  EVENT_FAVORITES_CHANGED,
  getFavorites,
  toggleFavorite,
} from '../../lib/account-store'

export interface Props {
  id: string
  /** Optional human label for screen readers (defaults to id). */
  label?: string
}

export default function FavoriteToggle({ id, label }: Props) {
  const [favorited, setFavorited] = useState<boolean>(false)
  const [hydrated, setHydrated] = useState<boolean>(false)

  useEffect(() => {
    const sync = () => {
      setFavorited(getFavorites().includes(id))
    }
    sync()
    setHydrated(true)
    window.addEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_FAVORITES_CHANGED, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [id])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      // Card itself is an <a>; prevent its navigation.
      e.preventDefault()
      e.stopPropagation()
      const now = toggleFavorite(id)
      setFavorited(now)
    },
    [id],
  )

  const human = label ?? id
  const a11yLabel = favorited
    ? `${human} arsasını favorilerden çıkar`
    : `${human} arsasını favorilere ekle`

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={favorited}
      aria-label={a11yLabel}
      onClick={onClick}
      disabled={!hydrated}
      data-favorite-toggle={id}
      data-state={favorited ? 'on' : 'off'}
      className={[
        // Position: top-LEFT to avoid CompareToggle (top-RIGHT, z-30).
        'absolute left-2 top-2 z-30 inline-flex items-center justify-center rounded-full border backdrop-blur transition',
        // Hit target: 44×44 mobile, 36×36 md+.
        'h-11 w-11 md:h-9 md:w-9',
        favorited
          ? 'border-foreground/30 bg-foreground/[0.12] text-foreground shadow-sm'
          : 'border-border bg-card/80 text-foreground/60 hover:border-foreground/40 hover:text-foreground',
      ].join(' ')}
    >
      {/* Inline SVG heart — fill toggles based on `favorited` so we don't
          ship an icon font for one shape. Token-driven `currentColor`. */}
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
