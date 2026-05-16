// MapView — Leaflet 1.9 + markercluster, CSR-only.
// MUST be mounted with `client:only="react"` from Astro; will fail under SSR.
// Imports Leaflet via dynamic `import()` so the bundle becomes a lazy chunk
// (Leaflet + markercluster + CSS only ship when a user opens /ara?view=map).
//
// Marker icon URLs point at `/leaflet/*.png` (see public/leaflet/ — copied
// from node_modules/leaflet/dist/images at install). This works around the
// known Leaflet+Vite issue where `L.Icon.Default` resolves icon URLs via
// `require.resolve('leaflet/dist/images/...')`, which Vite cannot honour.
import { useEffect, useRef, useState } from 'react'
import type { Listing } from '@landx/data'
import { getTileConfig } from '../../lib/map-tile-config'

export interface MapViewProps {
  listings: Listing[]
  initialCenter?: [number, number]
  initialZoom?: number
}

const TURKEY_CENTER: [number, number] = [39.0, 35.0]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function popupHtml(listing: { id: string; title: string; district: string; city: string; price: number }): string {
  const price = new Intl.NumberFormat('tr-TR').format(listing.price) + ' ₺'
  const initial = escapeHtml(listing.title[0] ?? '·')
  return `
    <div class="w-56" data-testid="map-popup">
      <div class="flex items-center justify-center aspect-[4/3] overflow-hidden rounded-lg bg-stone-200 font-mono text-xl">${initial}</div>
      <h4 class="mt-2 line-clamp-2 text-xs font-medium">${escapeHtml(listing.title)}</h4>
      <p class="font-mono text-xs uppercase tracking-[0.12em] text-gray-500">${escapeHtml(listing.district)}, ${escapeHtml(listing.city)}</p>
      <p class="mt-1 text-xs font-medium">${price}</p>
      <a href="/ilan/${encodeURIComponent(listing.id)}" class="mt-2 inline-block rounded-full bg-black px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-white">Detaya git →</a>
    </div>
  `
}

export default function MapView({
  listings,
  initialCenter = TURKEY_CENTER,
  initialZoom = 6,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Leaflet types aren't loaded at module scope (dynamic import), so we keep
  // the map/cluster refs as `any` — narrow casts happen inside the effects.
  const mapRef = useRef<any | null>(null)
  const clusterRef = useRef<any | null>(null)
  // Snapshot initial view params so later prop changes don't tear down the map.
  // Note: subsequent renders ignore prop changes (this is "initial" not "current").
  const initialCenterRef = useRef(initialCenter)
  const initialZoomRef = useRef(initialZoom)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')
      await import('leaflet/dist/leaflet.css')
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

      if (cancelled || !containerRef.current) return

      // Fix Leaflet's default marker icon paths — Vite can't resolve the
      // require()-style URLs Leaflet ships with, so we point at the copies
      // we placed in /public/leaflet/ instead.
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })

      const map = L.map(containerRef.current).setView(initialCenterRef.current, initialZoomRef.current)
      mapRef.current = map
      const tile = getTileConfig()
      L.tileLayer(tile.url, {
        maxZoom: tile.maxZoom,
        attribution: tile.attribution,
      }).addTo(map)
      setMapReady(true)
    }
    init()
    return () => {
      cancelled = true
      setMapReady(false)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // init runs once per mount; initialCenter/initialZoom captured via refs

  useEffect(() => {
    if (!mapReady) return
    async function refresh() {
      if (!mapRef.current) return
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')

      if (clusterRef.current) {
        mapRef.current.removeLayer(clusterRef.current)
        clusterRef.current = null
      }
      const cluster = (L as any).markerClusterGroup()
      listings.forEach((listing) => {
        if (typeof listing.lat !== 'number' || typeof listing.lng !== 'number') return
        const marker = L.marker([listing.lat, listing.lng])
        marker.bindPopup(popupHtml(listing))
        cluster.addLayer(marker)
      })
      cluster.addTo(mapRef.current)
      clusterRef.current = cluster
    }
    refresh()
  }, [listings, mapReady])

  return <div ref={containerRef} className="h-full w-full" data-testid="map-container" />
}
