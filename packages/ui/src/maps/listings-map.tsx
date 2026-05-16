import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { cn } from '../lib/cn'

export interface MapListing {
  id: string
  title: string
  district: string
  city: string
  type: string
  status: 'Aktif' | 'Pasif' | 'Taslak'
  price: number
  size: number
  lat?: number
  lng?: number
}

export interface ListingsMapProps {
  listings: MapListing[]
  onMarkerClick?: (id: string) => void
  className?: string
  height?: number | string
  /** Türkiye Ege kıyısı default bbox center */
  fallbackCenter?: [number, number]
  fallbackZoom?: number
}

function makePinIcon(status: MapListing['status'], label: string): L.DivIcon {
  return L.divIcon({
    className: 'landx-marker',
    html: `<div class="landx-marker-pin" data-status="${status}"><span>${label}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap()
  useEffect(() => {
    const withCoords = listings.filter(
      (l): l is MapListing & { lat: number; lng: number } =>
        typeof l.lat === 'number' && typeof l.lng === 'number',
    )
    if (withCoords.length === 0) return
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 12, { animate: true })
      return
    }
    const bounds = L.latLngBounds(withCoords.map((l) => [l.lat, l.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, animate: true })
  }, [listings, map])
  return null
}

function PriceFormat(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `₺${m.toFixed(m < 10 ? 1 : 0)}M`
  }
  if (amount >= 1_000) return `₺${Math.round(amount / 1_000)}K`
  return `₺${amount}`
}

export function ListingsMap({
  listings,
  onMarkerClick,
  className,
  height = 480,
  fallbackCenter = [38.5, 27.3],
  fallbackZoom = 7,
}: ListingsMapProps) {
  const withCoords = useMemo(
    () =>
      listings.filter(
        (l): l is MapListing & { lat: number; lng: number } =>
          typeof l.lat === 'number' && typeof l.lng === 'number',
      ),
    [listings],
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
      style={{ height }}
    >
      <MapContainer
        center={fallbackCenter}
        zoom={fallbackZoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitBounds listings={withCoords} />
        {withCoords.map((l, i) => {
          const label = String(i + 1)
          return (
            <Marker
              key={l.id}
              position={[l.lat, l.lng]}
              icon={makePinIcon(l.status, label)}
              eventHandlers={{
                click: () => onMarkerClick?.(l.id),
              }}
            >
              <Popup>
                <div className="p-3">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {l.id} · {l.type}
                  </div>
                  <h4 className="mb-1.5 font-serif text-[14px] font-medium leading-snug">
                    {l.title}
                  </h4>
                  <div className="mb-2 text-[12px] text-muted-foreground">
                    {l.district}, {l.city}
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2">
                    <span className="font-serif text-[15px] font-medium">
                      {PriceFormat(l.price)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {l.size.toLocaleString('tr-TR')} m²
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {withCoords.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-card/85 text-center">
          <div className="max-w-xs">
            <div className="mb-1 font-serif text-lg">Koordinat yok</div>
            <p className="text-sm text-muted-foreground">
              Bu filtreyle eşleşen ilanların hiçbirinde harita koordinatı yok.
            </p>
          </div>
        </div>
      )}

      {/* Legend overlay */}
      {withCoords.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-1.5 rounded-lg border border-border bg-card/95 px-2.5 py-1.5 text-[10px] backdrop-blur">
          <Legend color="bg-emerald-500" label="Aktif" />
          <Legend color="bg-amber-500" label="Taslak" />
          <Legend color="bg-stone-500" label="Pasif" />
          <span className="ml-1.5 border-l border-border pl-1.5 font-mono tabular-nums text-muted-foreground">
            {withCoords.length} ilan
          </span>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      {label}
    </span>
  )
}
