// Wave F9.C — Office single-marker map.
// Reuses the F4.B MapView so the Leaflet chunk stays shared. We pass a
// one-item synthetic listing that carries the office's coordinates + the
// office name as title; MarkerCluster renders fine for n=1.
import { lazy, Suspense, useMemo } from 'react'
import type { Listing } from '@landx/data'
import { getOfficeCoords } from '@/lib/office-portfolio'

type Locale = 'tr' | 'en'

const MapView = lazy(() => import('@/components/map/MapView'))

const LABELS: Record<Locale, {
  eyebrow: string
  heading: string
  noCoords: string
  addressLabel: string
}> = {
  tr: {
    eyebrow: 'KONUM',
    heading: 'Bizi haritada görün',
    noCoords: 'Konum bilgisi henüz yok.',
    addressLabel: 'Adres',
  },
  en: {
    eyebrow: 'LOCATION',
    heading: 'Find us on the map',
    noCoords: 'Location data is not available yet.',
    addressLabel: 'Address',
  },
}

export interface OfficeMapProps {
  officeId: string
  officeName: string
  district: string
  city: string
  address: string
  locale: Locale
}

export default function OfficeMap({
  officeId,
  officeName,
  district,
  city,
  address,
  locale,
}: OfficeMapProps) {
  const coords = useMemo(() => getOfficeCoords(officeId), [officeId])
  const L = LABELS[locale]

  const syntheticListing: Listing | null = useMemo(() => {
    if (!coords) return null
    return {
      id: `office:${officeId}`,
      title: officeName,
      city,
      district,
      type: 'İmarlı',
      size: 0,
      price: 0,
      status: 'Aktif',
      views: 0,
      weeklyTrend: [],
      lastUpdate: new Date().toISOString(),
      tags: [],
      lat: coords.lat,
      lng: coords.lng,
    }
  }, [coords, officeId, officeName, city, district])

  return (
    <section
      aria-labelledby="ofis-map-title"
      data-office-map=""
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {L.eyebrow}
      </div>
      <h2
        id="ofis-map-title"
        className="mt-1 font-serif text-2xl font-normal tracking-tight md:text-3xl"
      >
        {L.heading}
      </h2>

      <div className="mt-3 text-sm text-muted-foreground">
        <span className="font-mono text-xs uppercase tracking-[0.18em]">
          {L.addressLabel}:
        </span>{' '}
        {address}
      </div>

      <div
        data-office-map-canvas=""
        className="mt-4 h-[320px] w-full overflow-hidden rounded-xl border border-border bg-foreground/[0.02]"
      >
        {coords && syntheticListing ? (
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-wide text-muted-foreground">
                …
              </div>
            }
          >
            <MapView
              listings={[syntheticListing]}
              initialCenter={[coords.lat, coords.lng]}
              initialZoom={13}
            />
          </Suspense>
        ) : (
          <div
            data-office-map-empty=""
            className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground"
          >
            {L.noCoords}
          </div>
        )}
      </div>
    </section>
  )
}
