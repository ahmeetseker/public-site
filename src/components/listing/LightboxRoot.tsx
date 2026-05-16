// LightboxRoot — page-level mount that wires the [data-gallery] DOM tree to
// the LightboxModal. Lives outside the Astro <Gallery> so the modal can
// portal-style overlay the whole document without breaking SSR.
//
// Flow:
//   1. On mount, scan [data-gallery] for <img> elements and collect their
//      src/alt/index. We use currentSrc when set (so the lightbox picks the
//      already-decoded responsive variant where possible).
//   2. Attach a delegated click listener on the gallery root: any click that
//      bubbles up from [data-gallery-hero], [data-gallery-thumb], or
//      [data-gallery-open] opens the lightbox at that element's data-index.
//   3. The clicked element is remembered as the focus-return target so we can
//      restore keyboard context on close (a11y requirement).
//
// Once we've scanned the gallery, we sync the live count back into the
// reducer via `setTotal` so navigation (`next`/`prev`/`open`) can clamp
// correctly. The reducer still doesn't store the image list itself — only its
// length — which keeps it pure and avoids serialising HTMLImageElements.

import { useEffect, useReducer, useState } from 'react'
import {
  lightboxReducer,
  type LightboxImage,
  type LightboxState,
} from '@/lib/lightbox-reducer'
import LightboxModal from './LightboxModal'

const INITIAL: LightboxState = { open: false, index: 0, total: 0 }

export interface LightboxRootProps {
  /** UI locale for visible/aria strings. Defaults to 'tr'. */
  locale?: 'tr' | 'en'
}

export default function LightboxRoot({ locale = 'tr' }: LightboxRootProps = {}) {
  const [state, dispatch] = useReducer(lightboxReducer, INITIAL)
  const [images, setImages] = useState<LightboxImage[]>([])
  const [returnFocusEl, setReturnFocusEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-gallery]')
    if (!root) return
    const total = Number(root.dataset.imageCount ?? '0')
    if (total <= 1) return

    const collected: LightboxImage[] = []
    root.querySelectorAll<HTMLImageElement>('img').forEach((img, i) => {
      collected.push({
        src: img.currentSrc || img.src,
        alt: img.alt || `Görsel ${i + 1}`,
        index: i,
      })
    })
    setImages(collected)
    dispatch({ type: 'setTotal', total: collected.length })

    function onClick(e: Event) {
      const target = e.target as HTMLElement
      const trigger = target.closest<HTMLElement>(
        '[data-gallery-hero], [data-gallery-thumb], [data-gallery-open]',
      )
      if (!trigger) return
      e.preventDefault()
      const idx = Number(trigger.dataset.index ?? '0')
      setReturnFocusEl(trigger)
      dispatch({ type: 'open', index: Math.max(0, idx) })
    }

    function onKeydown(e: KeyboardEvent) {
      // Allow Enter/Space on focused thumbnails / hero to open the lightbox
      // for keyboard users. Native <button> already does this; figure tiles
      // are tabindex=0 so we need to wire it manually.
      if (e.key !== 'Enter' && e.key !== ' ') return
      const target = e.target as HTMLElement
      const trigger = target.closest<HTMLElement>(
        '[data-gallery-hero], [data-gallery-thumb]',
      )
      if (!trigger) return
      if (document.activeElement !== trigger) return
      e.preventDefault()
      const idx = Number(trigger.dataset.index ?? '0')
      setReturnFocusEl(trigger)
      dispatch({ type: 'open', index: Math.max(0, idx) })
    }

    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKeydown)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKeydown)
    }
  }, [])

  return (
    <LightboxModal
      state={state}
      dispatch={dispatch}
      images={images}
      returnFocusEl={returnFocusEl}
      locale={locale}
    />
  )
}
