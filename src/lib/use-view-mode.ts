// use-view-mode — Wave F4.B.1
//
// Persists the /ara view mode (list | map | split) in the URL via the `view`
// query param. List is canonical (param omitted), map/split are explicit. The
// hook keeps state in sync with `popstate` so back/forward navigation just
// works; updates use `replaceState` so toggling between modes doesn't pollute
// the browser history stack.
//
// Split is desktop-only — the ViewToggle hides that option on mobile, but the
// hook still accepts `split` because deep links from a desktop user shared
// with a mobile peer should round-trip cleanly (the ara page can decide to
// downgrade `split` → `list` at render time on small viewports).
import { useEffect, useState } from 'react'

export type ViewMode = 'list' | 'map' | 'split'

const VALID: readonly ViewMode[] = ['list', 'map', 'split']

export function parseViewMode(sp: URLSearchParams): ViewMode {
  const raw = sp.get('view')
  if (raw && (VALID as readonly string[]).includes(raw)) return raw as ViewMode
  return 'list'
}

/**
 * Stays in sync with URL search params via two signals:
 * - native `popstate` (back/forward navigation)
 * - custom `arsam:urlchange` event (siblings that call history.replace/pushState
 *   should dispatch this event after mutating the URL)
 *
 * Mutations via `update()` are made with `history.replaceState` and emit the
 * `arsam:urlchange` CustomEvent so sibling hooks (e.g. useFilteredListings)
 * can stay aligned without a full popstate.
 */
export function useViewMode(): [ViewMode, (next: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    return parseViewMode(new URLSearchParams(window.location.search))
  })

  useEffect(() => {
    function onPop() {
      setMode(parseViewMode(new URLSearchParams(window.location.search)))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function update(next: ViewMode) {
    const url = new URL(window.location.href)
    if (next === 'list') url.searchParams.delete('view')
    else url.searchParams.set('view', next)
    window.history.replaceState({}, '', url.toString())
    // Notify sibling URL-state listeners (popstate doesn't fire for replaceState)
    window.dispatchEvent(new CustomEvent('arsam:urlchange'))
    setMode(next)
  }

  return [mode, update]
}
