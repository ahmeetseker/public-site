// Wave F9.D — Region map view island.
//
// Wraps F4.B's MapView with:
//   - a "Haritada göster" toggle (default collapsed so the Leaflet chunk
//     only loads if the visitor actually wants to see the map)
//   - the region centroid + zoom 9 as the initial framing
//   - region-filtered listings only
//
// MapView itself does the dynamic Leaflet import — we just gate it behind
// an explicit user action.
import { useMemo, useState } from 'react'
import type { Listing } from '@landx/data'
import MapView from '../map/MapView'
import { REGION_CENTROIDS } from '../../lib/bolge-neighbors'

type Locale = 'tr' | 'en'

export interface RegionMapViewProps {
  /** Region slug — used to look up centroid. */
  slug: string
  /** Region display name — used in heading. */
  regionName: string
  /** City — fallback for centroid when slug isn't in the centroid table. */
  city: string
  listings: Listing[]
  locale?: Locale
  /** i18n strings injected from Astro (keeps the island i18n-stateless). */
  copy: {
    title: string
    toggleShow: string
    toggleHide: string
    emptyMap: string
  }
}

// City fallback centroids (mirrors lib/bolge-neighbors.ts; duplicated here to
// avoid pulling a non-exported map across the boundary).
const CITY_FALLBACKS: Record<string, [number, number]> = {
  Balıkesir: [39.6484, 27.8826],
  İzmir: [38.4192, 27.1287],
  Muğla: [37.2153, 28.3636],
  Aydın: [37.8560, 27.8416],
}

function pickCenter(slug: string, city: string): [number, number] {
  const c = REGION_CENTROIDS[slug]
  if (c) return [c.lat, c.lng]
  const cityFallback = CITY_FALLBACKS[city]
  if (cityFallback) return cityFallback
  return [39.0, 35.0]
}

export default function RegionMapView({
  slug,
  regionName,
  city,
  listings,
  copy,
}: RegionMapViewProps) {
  const [open, setOpen] = useState(false)
  const center = useMemo(() => pickCenter(slug, city), [slug, city])
  const mappable = useMemo(
    () => listings.filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number'),
    [listings],
  )

  return (
    <section
      data-region-map=""
      data-region-slug={slug}
      className="mx-auto max-w-[1280px] px-4 py-6 md:py-8"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            BÖLGE HARİTASI
          </div>
          <h2 className="mt-2 font-serif text-2xl font-normal tracking-tight md:text-3xl">
            {copy.title.replace('{region}', regionName)}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid="region-map-toggle"
          aria-expanded={open}
          aria-controls="region-map-container"
          className="rounded-full border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition hover:bg-accent hover:text-accent-foreground"
        >
          {open ? copy.toggleHide : copy.toggleShow}
        </button>
      </div>

      {open && (
        <div
          id="region-map-container"
          data-testid="region-map-container"
          className="mt-4 h-[420px] overflow-hidden rounded-2xl border border-border bg-card"
        >
          {mappable.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {copy.emptyMap}
            </div>
          ) : (
            <MapView listings={mappable} initialCenter={center} initialZoom={9} />
          )}
        </div>
      )}
    </section>
  )
}
