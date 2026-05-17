/**
 * SmartMap — `/ilan/[slug]` C bölümü.
 *
 * Gerçek Leaflet harita + `@landx/data/getParcelGeometry`'den gelen deterministic
 * mock overlay'ler. SVG mockup (eski) → Leaflet raster (yeni).
 *
 * SSR güvenliği: `leaflet` ve `leaflet/dist/leaflet.css` modül seviyesinde
 * DEĞİL, `useEffect` içinde dinamik import edilir (MapView paterni). Sayfa
 * `client:visible` ile yüklense bile SSR'de window erişimi tetiklenmez.
 *
 * Tile mode:
 *   - yol: OpenStreetMap raster
 *   - uydu: Esri World Imagery
 *   - hibrit: Esri World Imagery + Esri Reference (etiket overlay)
 *
 * Katman overlay'leri: parsel polygon, cephe, yol, diri fay, dere, kıyı,
 * imar zonları, tarım, SİT, orman, sel, heyelan, PGA bandı, altyapı, toplu
 * taşıma, çevre projeleri, POI. Her toggle Leaflet layerGroup'a ekler/kaldırır.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { getParcelGeometry, type ParcelGeometry } from '@landx/data'
import { cn } from '../lib/cn'

// ─── Layer tanımları ─────────────────────────────────────────────────────────

type LayerId =
  | 'parsel'
  | 'imar'
  | 'tarim'
  | 'sit'
  | 'orman'
  | 'kiyi'
  | 'dere'
  | 'sel'
  | 'heyelan'
  | 'fay'
  | 'pga'
  | 'altyapi'
  | 'toplu'
  | 'cevre'
  | 'poi'

interface LayerDef {
  id: LayerId
  label: string
  dotColor: string
}

const LAYERS: readonly LayerDef[] = [
  { id: 'parsel', label: 'Parsel sınırı', dotColor: 'bg-emerald-700' },
  { id: 'imar', label: '1/1000 imar planı', dotColor: 'bg-amber-500' },
  { id: 'tarim', label: 'Tarım sınıfı', dotColor: 'bg-lime-600' },
  { id: 'sit', label: 'SİT alanı', dotColor: 'bg-violet-500' },
  { id: 'orman', label: 'Orman vasfı', dotColor: 'bg-emerald-900' },
  { id: 'kiyi', label: 'Kıyı kenar çizgisi', dotColor: 'bg-cyan-500' },
  { id: 'dere', label: 'Dere yatağı', dotColor: 'bg-cyan-700' },
  { id: 'sel', label: 'Sel / taşkın', dotColor: 'bg-blue-500' },
  { id: 'heyelan', label: 'Heyelan riski', dotColor: 'bg-orange-500' },
  { id: 'fay', label: 'Diri fay hattı', dotColor: 'bg-rose-600' },
  { id: 'pga', label: 'PGA bandı', dotColor: 'bg-rose-400' },
  { id: 'altyapi', label: 'Altyapı', dotColor: 'bg-zinc-500' },
  { id: 'toplu', label: 'Toplu taşıma', dotColor: 'bg-fuchsia-500' },
  { id: 'cevre', label: 'Çevre projeleri', dotColor: 'bg-yellow-500' },
  { id: 'poi', label: 'POI', dotColor: 'bg-pink-500' },
] as const

const DEFAULT_ACTIVE: ReadonlySet<LayerId> = new Set([
  'parsel',
  'imar',
  'tarim',
  'fay',
])

type MapMode = 'yol' | 'uydu' | 'hibrit'

const MODE_LABELS: Record<MapMode, string> = {
  yol: 'Yol',
  uydu: 'Uydu',
  hibrit: 'Hibrit',
}

const TILE_LAYERS: Record<MapMode, { url: string; attribution: string; maxZoom: number }> = {
  yol: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
  uydu: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery',
    maxZoom: 19,
  },
  hibrit: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery',
    maxZoom: 19,
  },
}

const HIBRIT_REFERENCE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SmartMapProps {
  listingId: string
  className?: string
}

// ─── Overlay builders (Leaflet imperatif) ────────────────────────────────────
//
// `L` parametresi dinamik import'tan geliyor — module-level tip yok.
// Her builder, layerGroup'a eklenebilir Leaflet primitif(ler)i döndürür.

interface OverlayBundle {
  /** Layer eklemek için her ID karşılığı 1+ Leaflet layer döndüren factory. */
  [layerId: string]: () => any[]
}

function buildOverlays(L: any, geo: ParcelGeometry): OverlayBundle {
  return {
    parsel: () => {
      const polygon = L.polygon(geo.parsel, {
        color: '#047857',
        weight: 3,
        fillColor: '#10b981',
        fillOpacity: 0.18,
      })
      const tooltip = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'smartmap-parsel-label',
      }).setContent(
        `<div style="text-align:center;font-family:ui-monospace,SF Mono,monospace;color:#065f46">
           <div style="font-size:13px;font-weight:600">${escapeHtml(geo.parselLabel.adaParsel)}</div>
           <div style="font-size:11px;margin-top:2px">${escapeHtml(geo.parselLabel.yuzolcumu)}</div>
         </div>`,
      )
      const cepheLine = geo.cephe
        ? L.polyline(geo.cephe, { color: '#c2410c', weight: 4, opacity: 0.9 })
        : null
      const cepheTip =
        geo.cephe && geo.parselLabel.cepheLabel
          ? L.marker(midpoint(geo.cephe), {
              icon: L.divIcon({
                className: 'smartmap-cephe-label',
                html: `<span style="background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:6px;font-family:ui-monospace,SF Mono,monospace;font-size:11px;color:#c2410c;white-space:nowrap">${escapeHtml(
                  geo.parselLabel.cepheLabel,
                )}</span>`,
                iconSize: [80, 20],
                iconAnchor: [40, 24],
              }),
              interactive: false,
            })
          : null
      const yolLine = L.polyline(geo.yol, {
        color: '#1f2937',
        weight: 5,
        opacity: 0.6,
        dashArray: '0',
      })
      polygon.bindTooltip(tooltip)
      const out = [polygon, yolLine]
      if (cepheLine) out.push(cepheLine)
      if (cepheTip) out.push(cepheTip)
      return out
    },
    imar: () => {
      const colors = ['#fbbf24', '#84cc16', '#38bdf8']
      return geo.imarZones.map((poly, i) =>
        L.polygon(poly, {
          color: colors[i % colors.length],
          weight: 0,
          fillColor: colors[i % colors.length],
          fillOpacity: 0.18,
          interactive: false,
        }),
      )
    },
    tarim: () => [
      L.polygon(geo.tarimZone, {
        color: '#65a30d',
        weight: 1,
        dashArray: '4 3',
        fillColor: '#84cc16',
        fillOpacity: 0.12,
        interactive: false,
      }),
    ],
    sit: () => [
      L.polygon(geo.sitZone, {
        color: '#8b5cf6',
        weight: 1.5,
        dashArray: '6 4',
        fillColor: '#a78bfa',
        fillOpacity: 0.18,
        interactive: false,
      }),
    ],
    orman: () =>
      geo.ormanClusters.map((c) =>
        L.circle(c.center, {
          radius: c.radius,
          color: '#065f46',
          weight: 0,
          fillColor: '#064e3b',
          fillOpacity: 0.32,
          interactive: false,
        }),
      ),
    kiyi: () => {
      if (!geo.kiyi) return []
      return [
        L.polyline(geo.kiyi, {
          color: '#06b6d4',
          weight: 2,
          dashArray: '2 5',
          opacity: 0.85,
          interactive: false,
        }),
      ]
    },
    dere: () => [
      L.polyline(geo.dere, {
        color: '#0e7490',
        weight: 2.5,
        opacity: 0.75,
        interactive: false,
      }),
    ],
    sel: () => [
      L.polygon(geo.selZone, {
        color: '#3b82f6',
        weight: 1,
        dashArray: '4 3',
        fillColor: '#60a5fa',
        fillOpacity: 0.18,
        interactive: false,
      }),
    ],
    heyelan: () => [
      L.polygon(geo.heyelanZone, {
        color: '#f97316',
        weight: 1,
        dashArray: '4 3',
        fillColor: '#fb923c',
        fillOpacity: 0.18,
        interactive: false,
      }),
    ],
    fay: () => {
      const line = L.polyline(geo.fay.line, {
        color: '#e11d48',
        weight: 2.5,
        dashArray: '8 5',
        opacity: 0.9,
        interactive: false,
      })
      const labelPos = geo.fay.line[Math.floor(geo.fay.line.length * 0.65)]
      const label = L.marker(labelPos, {
        icon: L.divIcon({
          className: 'smartmap-fay-label',
          html: `<span style="background:rgba(255,255,255,0.92);padding:2px 6px;border-radius:6px;font-family:ui-monospace,SF Mono,monospace;font-size:11px;color:#be123c;white-space:nowrap">${escapeHtml(
            geo.fay.label,
          )}</span>`,
          iconSize: [110, 20],
          iconAnchor: [55, -8],
        }),
        interactive: false,
      })
      return [line, label]
    },
    pga: () =>
      geo.pgaBands.flatMap((b) => {
        const line = L.polyline(b.line, {
          color: '#fb7185',
          weight: 1.5,
          dashArray: '2 6',
          opacity: 0.55,
          interactive: false,
        })
        const label = L.marker(b.line[b.line.length - 1], {
          icon: L.divIcon({
            className: 'smartmap-pga-label',
            html: `<span style="background:rgba(255,255,255,0.85);padding:1px 4px;border-radius:4px;font-family:ui-monospace,SF Mono,monospace;font-size:10px;color:#be123c">${escapeHtml(
              b.label,
            )}</span>`,
            iconSize: [40, 16],
            iconAnchor: [-4, 8],
          }),
          interactive: false,
        })
        return [line, label]
      }),
    altyapi: () =>
      geo.altyapi.map((p) =>
        L.circleMarker(p.point, {
          radius: 4,
          color: '#52525b',
          weight: 2,
          fillColor: '#a1a1aa',
          fillOpacity: 0.9,
        }).bindTooltip(escapeHtml(p.label)),
      ),
    toplu: () =>
      geo.toplu.map((p) =>
        L.circleMarker(p.point, {
          radius: 5,
          color: '#a21caf',
          weight: 2,
          fillColor: '#d946ef',
          fillOpacity: 0.9,
        }).bindTooltip(escapeHtml(p.label)),
      ),
    cevre: () =>
      geo.cevreProjects.flatMap((p) => {
        const line = L.polyline(p.line, {
          color: '#eab308',
          weight: 2,
          dashArray: '10 4',
          opacity: 0.8,
          interactive: false,
        })
        const label = L.marker(p.line[0], {
          icon: L.divIcon({
            className: 'smartmap-cevre-label',
            html: `<span style="background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:6px;font-family:ui-monospace,SF Mono,monospace;font-size:10px;color:#a16207;white-space:nowrap">${escapeHtml(
              p.label,
            )}</span>`,
            iconSize: [120, 18],
            iconAnchor: [-6, 18],
          }),
          interactive: false,
        })
        return [line, label]
      }),
    poi: () =>
      geo.poi.map((p) =>
        L.circleMarker(p.point, {
          radius: 4,
          color: '#be185d',
          weight: 2,
          fillColor: '#ec4899',
          fillOpacity: 0.95,
        }).bindTooltip(escapeHtml(p.label)),
      ),
  }
}

function midpoint(line: [number, number][]): [number, number] {
  const a = line[0]
  const b = line[line.length - 1]
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SmartMap({ listingId, className }: SmartMapProps) {
  const geo = useMemo(() => getParcelGeometry(listingId), [listingId])
  const [active, setActive] = useState<Set<LayerId>>(() => new Set(DEFAULT_ACTIVE))
  const [mode, setMode] = useState<MapMode>('hibrit')
  const [ready, setReady] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const baseTileRef = useRef<any>(null)
  const labelTileRef = useRef<any>(null)
  const overlayGroupRef = useRef<any>(null)
  const overlayBuildersRef = useRef<OverlayBundle | null>(null)

  function toggle(id: LayerId) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Map init (once per geo) ──
  useEffect(() => {
    if (!geo || !containerRef.current) return
    let cancelled = false
    const node = containerRef.current

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !node) return

      // Reset icon URLs (`/public/leaflet/*` mevcut)
      try {
        // @ts-expect-error — internal Leaflet field
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })
      } catch {
        /* noop */
      }

      const map = L.map(node, {
        center: geo!.center,
        zoom: geo!.zoom,
        zoomControl: false,
        attributionControl: true,
      })
      // Attribution sol alta — kendi zoom kontrolümüzle çakışmasın.
      map.attributionControl?.setPosition('bottomleft')
      mapRef.current = map

      // Initial tile
      const cfg = TILE_LAYERS[mode]
      baseTileRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      }).addTo(map)
      if (mode === 'hibrit') {
        labelTileRef.current = L.tileLayer(HIBRIT_REFERENCE_URL, {
          attribution: '© Esri Reference',
          maxZoom: 19,
        }).addTo(map)
      }

      // Overlay group
      overlayGroupRef.current = L.layerGroup().addTo(map)
      overlayBuildersRef.current = buildOverlays(L, geo!)
      // Initial layers — z-order'lı
      drawLayers(active)

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
      baseTileRef.current = null
      labelTileRef.current = null
      overlayGroupRef.current = null
      overlayBuildersRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo])

  // ── Mode change ──
  useEffect(() => {
    if (!ready || !mapRef.current) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapRef.current) return
      const cfg = TILE_LAYERS[mode]
      if (baseTileRef.current) {
        mapRef.current.removeLayer(baseTileRef.current)
      }
      baseTileRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      }).addTo(mapRef.current)
      if (labelTileRef.current) {
        mapRef.current.removeLayer(labelTileRef.current)
        labelTileRef.current = null
      }
      if (mode === 'hibrit') {
        labelTileRef.current = L.tileLayer(HIBRIT_REFERENCE_URL, {
          attribution: '© Esri Reference',
          maxZoom: 19,
        }).addTo(mapRef.current)
      }
      // Base layer altta kalsın
      baseTileRef.current.bringToBack?.()
    })()
    return () => {
      cancelled = true
    }
  }, [mode, ready])

  // ── Layer toggle change ──
  useEffect(() => {
    if (!ready) return
    drawLayers(active)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ready])

  /** Aktif katmanları sabit z-order'da çiz. Daha sonra eklenen Leaflet'te
   *  daha üstte kalır → imar zonları en altta, marker'lar en üstte. */
  function drawLayers(activeSet: Set<LayerId>) {
    if (!overlayGroupRef.current || !overlayBuildersRef.current) return
    overlayGroupRef.current.clearLayers()
    const order: LayerId[] = [
      // Background fills (en altta)
      'imar',
      'tarim',
      'sit',
      'sel',
      'heyelan',
      'orman',
      // Lines (orta)
      'pga',
      'kiyi',
      'dere',
      'cevre',
      'fay',
      // Parsel (üstte, etiket görünür kalsın)
      'parsel',
      // POI markers (en üstte)
      'altyapi',
      'toplu',
      'poi',
    ]
    for (const id of order) {
      if (!activeSet.has(id)) continue
      const factory = overlayBuildersRef.current[id]
      if (!factory) continue
      for (const layer of factory()) overlayGroupRef.current.addLayer(layer)
    }
  }

  function zoom(delta: number) {
    if (!mapRef.current) return
    mapRef.current.setZoom(mapRef.current.getZoom() + delta)
  }
  function resetView() {
    if (!mapRef.current || !geo) return
    // Drill-down: parselin merkezinde z18'e yakınlaş.
    mapRef.current.setView(geo.center, 18, { animate: true })
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
      aria-labelledby="smart-map-heading"
    >
      <header className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            C — bölüm · harita
          </p>
          <h2
            id="smart-map-heading"
            className="font-serif text-2xl leading-tight"
          >
            14 katmanlı <em className="font-serif italic">akıllı harita</em>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            TKGM parsel sınırı, belediye 1/1000 imar planı, AFAD diri fay, DSİ
            taşkın hattı, Tarım Bakanlığı toprak sınıfı, SİT/orman/kıyı şerhleri
            tek harita üzerinde.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sol layer paneli */}
        <div className="border-b border-border/60 bg-foreground/[0.02] px-3 py-3 md:sticky md:top-0 md:max-h-[460px] md:overflow-auto md:border-b-0 md:border-r">
          <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Katmanlar
          </h3>
          <ul className="space-y-1">
            {LAYERS.map((layer) => {
              const on = active.has(layer.id)
              return (
                <li key={layer.id}>
                  <button
                    type="button"
                    onClick={() => toggle(layer.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                      'hover:bg-foreground/[0.04]',
                      on
                        ? 'bg-foreground/[0.06] text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex h-3 w-3 items-center justify-center rounded-full border border-foreground/20',
                          on
                            ? 'border-foreground/40 bg-foreground/80'
                            : 'bg-transparent',
                        )}
                        aria-hidden
                      >
                        {on && (
                          <svg
                            viewBox="0 0 8 8"
                            className="h-2 w-2 fill-background"
                            aria-hidden
                          >
                            <path
                              d="M1.5 4l1.5 1.5L6.5 2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{layer.label}</span>
                    </span>
                    <span
                      className={cn('h-2 w-2 rounded-full', layer.dotColor)}
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Leaflet canvas */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-foreground/[0.04]">
          {!geo && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground">
              Bu ilanın koordinat verisi yok.
            </div>
          )}
          <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full"
            aria-label="Akıllı harita — parsel ve katmanlar"
            role="application"
          />

          {/* Map mode buttons */}
          <div
            className="pointer-events-auto absolute bottom-3 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card/85 p-1 backdrop-blur"
            role="tablist"
            aria-label="Harita görünümü"
          >
            {(Object.keys(MODE_LABELS) as MapMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  mode === m
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="pointer-events-auto absolute bottom-3 right-3 z-[400] flex flex-col gap-1 rounded-xl border border-border/70 bg-card/85 p-1 backdrop-blur">
            <ZoomBtn label="Yakınlaştır" symbol="+" onClick={() => zoom(1)} />
            <ZoomBtn label="Uzaklaştır" symbol="−" onClick={() => zoom(-1)} />
            <ZoomBtn label="Parsele odaklan" symbol="⤢" onClick={resetView} />
          </div>
        </div>
      </div>
    </section>
  )
}

function ZoomBtn({
  label,
  symbol,
  onClick,
}: {
  label: string
  symbol: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-foreground transition-colors hover:bg-foreground/10"
    >
      {symbol}
    </button>
  )
}
