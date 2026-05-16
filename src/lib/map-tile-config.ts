/**
 * Tile-layer config for Leaflet, gated by env var.
 *
 * `PUBLIC_MAPTILER_KEY` set → MapTiler Cloud Streets v2 raster (maxZoom 22).
 * Empty / missing key → graceful fallback to raw OpenStreetMap (maxZoom 18).
 *
 * Centralising this means a future swap (self-host tileserver-gl, Mapbox, …)
 * is a one-file change rather than a 3-component refactor.
 */
export interface TileConfig {
  url: string
  attribution: string
  maxZoom: number
}

export function getTileConfig(): TileConfig {
  const raw = import.meta.env.PUBLIC_MAPTILER_KEY
  const key = typeof raw === 'string' ? raw.trim() : ''
  if (key.length > 0) {
    return {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
      attribution:
        '© <a href="https://www.maptiler.com/">MapTiler</a> ' +
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 22,
    }
  }
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }
}
