/**
 * MapPicker — modal Leaflet map for selecting an arsa pin in /ilan-ver
 * Step 2 (Wave F6.A).
 *
 * Reuses the Leaflet lazy chunk introduced by F4.B (MapView). Mount with
 *   `<MapPicker client:only="react" … />`
 * so Leaflet ever loads under CSR — under SSR the dynamic import would crash
 * because Leaflet touches `document` at module init.
 *
 * Differences vs MapView (the cluster popup map):
 *   • Single marker (not clustered) — drag to reposition.
 *   • Click on the map drops a new marker at the click coords; the previous
 *     marker is removed.
 *   • Türkiye bounding box default (no listings to fly to).
 *   • Modal overlay with Confirm/Cancel CTAs returning { lat, lng } | null.
 *
 * `react-leaflet` is intentionally NOT used; the bundle wins come from staying
 * in the same chunk as MapView.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getTileConfig } from '../../lib/map-tile-config'

/** Türkiye bbox center (matches MapView.tsx). */
const TURKEY_CENTER: [number, number] = [39.0, 35.0]
const TURKEY_ZOOM = 6
const PIN_ZOOM = 12

const LABELS = {
  tr: {
    title: 'Haritada konumu seç',
    subtitle: 'Haritaya tıkla veya pin\'i sürükle. Hassas adres aramak için yakınlaş.',
    selected: 'Seçilen konum',
    none: 'Henüz konum seçilmedi',
    confirm: 'Onayla',
    cancel: 'İptal',
    closeAria: 'Haritayı kapat',
  },
  en: {
    title: 'Pick a location on the map',
    subtitle: 'Click on the map or drag the pin. Zoom in for a precise address.',
    selected: 'Selected location',
    none: 'No location selected yet',
    confirm: 'Confirm',
    cancel: 'Cancel',
    closeAria: 'Close map',
  },
} as const

export interface MapPickerProps {
  /** Pre-seeded lat (string from draft) — picker opens centered on this point. */
  initialLat?: string
  initialLng?: string
  onConfirm: (coord: { lat: number; lng: number }) => void
  onCancel: () => void
  locale?: 'tr' | 'en'
}

function parseCoord(s?: string): number | null {
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export default function MapPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
  locale = 'tr',
}: MapPickerProps) {
  const L = LABELS[locale]
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const leafletRef = useRef<any | null>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = parseCoord(initialLat)
    const lng = parseCoord(initialLng)
    if (lat != null && lng != null) return { lat, lng }
    return null
  })
  const [ready, setReady] = useState(false)

  // Init Leaflet once per mount. Mirrors MapView's lazy-chunk pattern.
  useEffect(() => {
    let cancelled = false
    async function init() {
      const LL = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current) return

      // Fix the icon URLs (same workaround as MapView).
      delete (LL.Icon.Default.prototype as any)._getIconUrl
      LL.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })

      const initial: [number, number] = pin ? [pin.lat, pin.lng] : TURKEY_CENTER
      const zoom = pin ? PIN_ZOOM : TURKEY_ZOOM
      const map = LL.map(containerRef.current).setView(initial, zoom)
      const tile = getTileConfig()
      LL.tileLayer(tile.url, {
        maxZoom: tile.maxZoom,
        attribution: tile.attribution,
      }).addTo(map)

      leafletRef.current = LL
      mapRef.current = map

      // Click → drop / move pin
      map.on('click', (e: any) => {
        const lat = e.latlng.lat
        const lng = e.latlng.lng
        placeMarker(lat, lng)
      })

      // Seed marker if we have an initial pin.
      if (pin) {
        placeMarker(pin.lat, pin.lng)
      }

      setReady(true)
    }
    init()
    return () => {
      cancelled = true
      setReady(false)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerRef.current = null
      leafletRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const placeMarker = useCallback((lat: number, lng: number) => {
    const LL = leafletRef.current
    const map = mapRef.current
    if (!LL || !map) return
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
      markerRef.current = null
    }
    const marker = LL.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', (e: any) => {
      const ll = e.target.getLatLng()
      setPin({ lat: ll.lat, lng: ll.lng })
    })
    markerRef.current = marker
    setPin({ lat, lng })
  }, [])

  // ── Modal a11y: lock body scroll + Escape closes. ────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  const fmt = (n: number) => n.toFixed(5)
  const numLocale = locale === 'en' ? 'en-US' : 'tr-TR'

  function confirm() {
    if (!pin) return
    onConfirm(pin)
  }

  return (
    <div
      data-map-picker=""
      data-ready={ready ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-picker-title"
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-background/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden border border-border bg-background shadow-xl sm:h-[min(80vh,640px)] sm:max-w-3xl sm:rounded-2xl"
        // Stop click propagation so clicking the dialog doesn't fall to the
        // backdrop (which is the same element here, but kept for clarity).
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="map-picker-title"
              className="font-serif text-xl font-normal tracking-tight"
            >
              {L.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{L.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={L.closeAria}
            data-map-close=""
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            ×
          </button>
        </header>

        <div ref={containerRef} data-map-picker-canvas="" className="min-h-[280px] flex-1" />

        <footer className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-mono text-xs text-muted-foreground">
            {pin ? (
              <span data-map-picker-coords="">
                <span className="uppercase tracking-[0.14em]">{L.selected}: </span>
                <span className="tabular-nums text-foreground">
                  {new Intl.NumberFormat(numLocale).format(Number(fmt(pin.lat)))},{' '}
                  {new Intl.NumberFormat(numLocale).format(Number(fmt(pin.lng)))}
                </span>
              </span>
            ) : (
              <span className="italic">{L.none}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              data-map-cancel=""
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {L.cancel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!pin}
              data-map-confirm=""
              data-can-confirm={pin ? 'true' : 'false'}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                pin
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'cursor-not-allowed bg-foreground/40 text-background'
              }`}
            >
              {L.confirm}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
