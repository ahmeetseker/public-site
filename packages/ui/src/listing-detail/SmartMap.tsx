/**
 * SmartMap — `/ilan/[slug]` C bölümü (Wave F37 / Faz 2 / F37.2).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 1840-1919 ("14 katmanlı akıllı
 * harita"). 15 katman (parsel sınırı, 1/1000 imar planı, tarım sınıfı, SİT
 * alanı, orman vasfı, kıyı kenar çizgisi, dere yatağı, sel/taşkın, heyelan
 * riski, diri fay hattı, PGA bandı, altyapı, toplu taşıma, çevre projeleri,
 * POI). Sol layer toggle paneli + orta SVG harita canvas + alt mode butonları
 * + zoom controls.
 *
 * Liquid Glass tema portu — mockup'taki sıcak natürel paletten Liquid Glass
 * neutral tema'ya. SVG harita tile'lar tema-token tabanlı (background-tint
 * için bg-card opacity, fay/parsel/cephe için sabit semantic renk korunur).
 *
 * Leaflet kullanılmıyor (basit SVG yeterli — bu mock harita, gerçek tile
 * server gerekmiyor). Astro public-site SSR için sub-path'ten import edilecek
 * (`@landx/ui/listing-detail`) — top barrel'da DEĞİL (leaflet sorunu yok ama
 * spec gereği ayrı sub-path).
 */
import { useState } from 'react'
import { useListingExtended } from '@landx/data'
import { cn } from '../lib/cn'

// ─── Layer tanımları ─────────────────────────────────────────────────────────

/** 15 katman id'si — mockup'taki sıraya bire bir uyumlu. */
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
  /** Layer dot rengi (legend için). Tema-bağımsız, semantic. */
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

/** Mockup'ta default-on olan 4 layer (parsel, imar, tarım, fay). */
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

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SmartMapProps {
  listingId: string
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SmartMap({ listingId, className }: SmartMapProps) {
  const { data: ext } = useListingExtended(listingId)
  const [active, setActive] = useState<Set<LayerId>>(() => new Set(DEFAULT_ACTIVE))
  const [mode, setMode] = useState<MapMode>('uydu')

  function toggle(id: LayerId) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Parsel etiketi — extended yüklendiyse ada/parsel ve yüzölçümü göster
  const adaParsel = ext ? `${ext.ada} / ${ext.parsel}` : '— / —'
  const yuzolcumu = ext
    ? `${ext.yuzolcumu.tapu.toLocaleString('tr-TR')} m²`
    : ''
  const cepheLabel = ext?.cephe ? `cephe ${ext.cephe.uzunluk} m` : null

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
                            <path d="M1.5 4l1.5 1.5L6.5 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
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

        {/* Orta SVG canvas */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-foreground/[0.04]">
          <svg
            viewBox="0 0 800 450"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
            role="img"
            aria-label="Akıllı harita — parsel ve katmanlar"
          >
            {/* Background base */}
            <rect width="800" height="450" className="fill-foreground/5" />

            {/* İmar plan tint zones (background katman) */}
            {active.has('imar') && (
              <g opacity="0.55">
                <polygon
                  points="60,40 380,30 395,300 80,330"
                  className="fill-amber-300/40 dark:fill-amber-400/25"
                />
                <polygon
                  points="395,30 750,40 740,330 400,300"
                  className="fill-lime-300/40 dark:fill-lime-400/25"
                />
                <polygon
                  points="80,330 740,330 730,420 90,420"
                  className="fill-sky-300/40 dark:fill-sky-400/25"
                />
              </g>
            )}

            {/* Tarım sınıfı (yeşil tint sağ blok) */}
            {active.has('tarim') && (
              <polygon
                points="395,30 750,40 740,330 400,300"
                className="fill-lime-600/15 stroke-lime-700/40"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* SİT alanı */}
            {active.has('sit') && (
              <polygon
                points="500,80 700,70 690,250 510,260"
                className="fill-violet-500/15 stroke-violet-500/60"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            )}

            {/* Orman vasfı */}
            {active.has('orman') && (
              <g className="fill-emerald-900/20">
                <circle cx="100" cy="100" r="18" />
                <circle cx="140" cy="80" r="14" />
                <circle cx="120" cy="130" r="12" />
                <circle cx="170" cy="115" r="10" />
              </g>
            )}

            {/* Kıyı kenar çizgisi */}
            {active.has('kiyi') && (
              <path
                d="M 0 410 Q 200 395 400 410 T 800 405"
                fill="none"
                className="stroke-cyan-500"
                strokeWidth="2"
                strokeDasharray="2 4"
                opacity="0.85"
              />
            )}

            {/* Dere yatağı */}
            {active.has('dere') && (
              <path
                d="M 60 60 Q 180 200 280 280 T 500 420"
                fill="none"
                className="stroke-cyan-700"
                strokeWidth="2.5"
                opacity="0.7"
              />
            )}

            {/* Sel zonu */}
            {active.has('sel') && (
              <polygon
                points="50,300 200,290 220,420 60,430"
                className="fill-blue-500/15 stroke-blue-500/60"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            )}

            {/* Heyelan zonu */}
            {active.has('heyelan') && (
              <polygon
                points="600,250 770,240 760,360 610,370"
                className="fill-orange-500/15 stroke-orange-500/60"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            )}

            {/* PGA bandı */}
            {active.has('pga') && (
              <g opacity="0.4">
                <line x1="0" y1="180" x2="800" y2="180" className="stroke-rose-400" strokeWidth="1.5" strokeDasharray="2 6" />
                <line x1="0" y1="240" x2="800" y2="240" className="stroke-rose-500" strokeWidth="1.5" strokeDasharray="2 6" />
                <text x="730" y="174" className="fill-rose-500" fontSize="9" fontFamily="monospace">0.32g</text>
                <text x="730" y="234" className="fill-rose-600" fontSize="9" fontFamily="monospace">0.42g</text>
              </g>
            )}

            {/* Roads (her zaman açık görünür — base layer) */}
            <line x1="0" y1="330" x2="800" y2="335" className="stroke-foreground/40" strokeWidth="5" opacity="0.65" />
            <line x1="395" y1="0" x2="400" y2="450" className="stroke-foreground/30" strokeWidth="3" opacity="0.5" />

            {/* Altyapı (su/elektrik mock noktaları) */}
            {active.has('altyapi') && (
              <g className="fill-zinc-500" opacity="0.7">
                <rect x="380" y="320" width="6" height="6" />
                <rect x="240" y="328" width="6" height="6" />
                <rect x="540" y="333" width="6" height="6" />
              </g>
            )}

            {/* Toplu taşıma noktaları */}
            {active.has('toplu') && (
              <g className="fill-fuchsia-500">
                <circle cx="160" cy="332" r="4" />
                <circle cx="600" cy="338" r="4" />
                <text x="160" y="320" textAnchor="middle" fontSize="9" fontFamily="monospace" className="fill-fuchsia-600">durak</text>
              </g>
            )}

            {/* Çevre projeleri (planlı YHT) */}
            {active.has('cevre') && (
              <g>
                <path
                  d="M 30 220 L 770 215"
                  fill="none"
                  className="stroke-yellow-500"
                  strokeWidth="2"
                  strokeDasharray="10 4"
                  opacity="0.7"
                />
                <text x="40" y="212" fontSize="10" fontFamily="monospace" className="fill-yellow-600">
                  Planlı YHT · 2027
                </text>
              </g>
            )}

            {/* POI noktaları */}
            {active.has('poi') && (
              <g className="fill-pink-500">
                <circle cx="180" cy="380" r="3.5" />
                <circle cx="450" cy="370" r="3.5" />
                <circle cx="650" cy="385" r="3.5" />
              </g>
            )}

            {/* Diri fay hattı */}
            {active.has('fay') && (
              <>
                <path
                  d="M 0 130 Q 220 160 380 110 T 800 140"
                  fill="none"
                  className="stroke-rose-600"
                  strokeWidth="2"
                  strokeDasharray="8 5"
                  opacity="0.85"
                />
                <text
                  x="580"
                  y="118"
                  fontSize="11"
                  fontFamily="monospace"
                  className="fill-rose-700 dark:fill-rose-400"
                >
                  DAFZ · 4.2 km
                </text>
              </>
            )}

            {/* Parsel polygon (vurgu — her zaman görünür) */}
            {active.has('parsel') && (
              <>
                <polygon
                  points="260,150 380,140 395,260 280,270"
                  className="fill-emerald-700/25 stroke-emerald-700"
                  strokeWidth="3"
                />
                <text
                  x="328"
                  y="200"
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="monospace"
                  fontWeight="500"
                  className="fill-emerald-800 dark:fill-emerald-300"
                >
                  {adaParsel}
                </text>
                {yuzolcumu && (
                  <text
                    x="328"
                    y="218"
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    className="fill-emerald-800 dark:fill-emerald-300"
                  >
                    {yuzolcumu}
                  </text>
                )}
              </>
            )}

            {/* Cephe çizgisi (parsel'in alt kenarı, paslı turuncu) */}
            {active.has('parsel') && cepheLabel && (
              <>
                <line
                  x1="280"
                  y1="270"
                  x2="395"
                  y2="260"
                  className="stroke-orange-700"
                  strokeWidth="2.5"
                />
                <text
                  x="338"
                  y="290"
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="500"
                  className="fill-orange-700 dark:fill-orange-400"
                >
                  {cepheLabel}
                </text>
              </>
            )}

            {/* Compass (sağ üst) */}
            <g transform="translate(720,80)" className="fill-foreground">
              <circle r="22" className="fill-card stroke-foreground/60" strokeWidth="1" />
              <path d="M 0,-16 L 4,0 L 0,16 L -4,0 Z" />
              <text
                y="-26"
                textAnchor="middle"
                fontSize="10"
                fontStyle="italic"
                className="fill-foreground"
                fontFamily="serif"
              >
                K
              </text>
            </g>

            {/* Scale bar (sol alt) */}
            <g transform="translate(40,400)" className="fill-foreground stroke-foreground">
              <line x1="0" y1="0" x2="80" y2="0" strokeWidth="2" />
              <line x1="0" y1="-4" x2="0" y2="4" strokeWidth="2" />
              <line x1="80" y1="-4" x2="80" y2="4" strokeWidth="2" />
              <text
                x="40"
                y="18"
                fontFamily="monospace"
                fontSize="10"
                textAnchor="middle"
              >
                100 m
              </text>
            </g>
          </svg>

          {/* Map mode buttons (alt orta) */}
          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card/85 p-1 backdrop-blur"
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

          {/* Zoom controls (alt sağ) */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-xl border border-border/70 bg-card/85 p-1 backdrop-blur">
            <ZoomBtn label="Yakınlaştır" symbol="+" />
            <ZoomBtn label="Uzaklaştır" symbol="−" />
            <ZoomBtn label="Tam ekran" symbol="⤢" />
          </div>
        </div>
      </div>
    </section>
  )
}

function ZoomBtn({ label, symbol }: { label: string; symbol: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-foreground transition-colors hover:bg-foreground/10"
    >
      {symbol}
    </button>
  )
}
