// AraMapShell — Wave F4.B.2 orchestrator island for /ara.
//
// Owns the three-mode segmented control (list | split | map) and lazily
// mounts MapView + MapBottomSheet when the user opts into map / split.
// Must be hydrated with `client:only="react"` from Astro: MapView dynamic
// imports Leaflet which has no SSR support.
//
// Astro-rendered list is hidden via a body-level data attribute that this
// component sets (`document.body.dataset.viewMode`). `ara.astro` ships
// matching CSS rules to hide / constrain the `[data-ara-list]` wrapper.
//
// URL state lives in `useViewMode` (`?view=` param); `useFilteredListings`
// stays aligned via the `arsam:urlchange` CustomEvent the hook dispatches.
import { useEffect, useState } from 'react'
import { useViewMode } from '@/lib/use-view-mode'
import { useFilteredListings } from '@/lib/use-filtered-listings'
import ViewToggle from './ViewToggle'
import MapBottomSheet from './MapBottomSheet'
import MapView from './MapView'

export interface AraMapShellProps {
  locale?: 'tr' | 'en'
}

export default function AraMapShell({ locale = 'tr' }: AraMapShellProps) {
  const [mode, setMode] = useViewMode()
  const listings = useFilteredListings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Toggle a body data attribute so Astro-rendered list can hide in map mode
  // (and shrink to half-width in split mode on desktop).
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.dataset.viewMode = mode
    return () => {
      delete document.body.dataset.viewMode
    }
  }, [mode])

  // Reserve a small slot pre-hydration so layout doesn't jump when the
  // toggle pops in. data-ara-shell-placeholder is a CSS hook for /ara.astro.
  if (!mounted) {
    return <div className="mb-4 h-9" aria-hidden="true" data-ara-shell-placeholder />
  }

  return (
    <div data-ara-shell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <ViewToggle mode={mode} onChange={setMode} locale={locale} />
        {mode !== 'list' && (
          <span
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
            data-testid="map-result-count"
          >
            {listings.length} {locale === 'en' ? 'results' : 'sonuç'}
          </span>
        )}
      </div>

      {mode === 'map' && (
        <>
          <div
            className="h-[calc(100vh-280px)] min-h-[400px] overflow-hidden rounded-2xl border border-border"
            data-testid="map-shell"
          >
            <MapView listings={listings} />
          </div>
          <MapBottomSheet listings={listings} locale={locale} />
        </>
      )}

      {mode === 'split' && (
        <div
          className="hidden gap-4 md:grid md:grid-cols-[1fr_1fr]"
          data-testid="split-shell"
        >
          {/*
            Split mode note: the Astro-rendered list still owns the left
            column visually (CSS constrains its max-width to 50%). Refining
            this into a proper grid placement is a F4.B.2 follow-up — see
            plan §5.1 NOTE.
          */}
          <div className="text-xs text-muted-foreground">
            {locale === 'en'
              ? 'List shown in the page column'
              : 'Liste sayfa kolonunda görüntüleniyor'}
          </div>
          <div className="h-[calc(100vh-280px)] overflow-hidden rounded-2xl border border-border">
            <MapView listings={listings} />
          </div>
        </div>
      )}
    </div>
  )
}
