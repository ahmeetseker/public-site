/**
 * Parcel geometry — deterministic mock GeoJSON-ish overlays for the SmartMap
 * island. Combines `Listing` (lat/lng + size), `ListingExtended` (cephe,
 * yuzolcumu) and `HazardScore` (fayMesafeKm, fayBolge) into ready-to-draw
 * polylines/polygons on a Leaflet map.
 *
 * Pure (no React/Leaflet deps) — `@landx/data` keeps the geometry math, the
 * UI package only consumes plain `[lat, lng]` tuples.
 */

import { LISTINGS_V2 } from '../mock/listings-extended-v2'
import { LISTING_EXTENDED } from '../mock/listing-extended'
import { HAZARD_SCORES } from '../mock/hazard-scores'

export type LatLng = [number, number]
export type Polygon = LatLng[]
export type Polyline = LatLng[]

export interface ParcelGeometry {
  /** Anchor — usually listing.lat/lng (parcel centroid). */
  center: LatLng
  /** Suggested initial zoom (parcel ~35-90m → z18). */
  zoom: number
  /** Parsel polygon (closed: first === last). */
  parsel: Polygon
  /** Parsel ön cephesi (yola bakan kenar). null = cephe verisi yok. */
  cephe: Polyline | null
  /** Komşu yol — parselin cephe kenarına paralel. */
  yol: Polyline
  /** Diri fay hattı (perpendiküler, fayMesafeKm uzakta). */
  fay: { line: Polyline; label: string; distanceKm: number }
  /** Dere yatağı (yakın çevreden geçen S-eğrisi). */
  dere: Polyline
  /** Kıyı — sadece coastal listing'ler için. */
  kiyi: Polyline | null
  /** 1/1000 imar planı renk bandı (parselin yakın çevresi 3 polygon). */
  imarZones: Polygon[]
  /** Tarım sınıfı (yakın çevre yeşil zone). */
  tarimZone: Polygon
  /** SİT alanı (parselin uzağında ufak alan). */
  sitZone: Polygon
  /** Orman vasfı (3-4 daire — ağaç kümesi mocku). */
  ormanClusters: { center: LatLng; radius: number }[]
  /** Sel/taşkın zonu. */
  selZone: Polygon
  /** Heyelan zonu. */
  heyelanZone: Polygon
  /** PGA bandı (2 yatay paralel çizgi label'lı). */
  pgaBands: { line: Polyline; label: string }[]
  /** Altyapı POI (3 nokta — su/elektrik). */
  altyapi: { point: LatLng; label: string }[]
  /** Toplu taşıma (1-2 durak). */
  toplu: { point: LatLng; label: string }[]
  /** Çevre projeleri — planlı YHT/yol mocku. */
  cevreProjects: { line: Polyline; label: string }[]
  /** POI noktaları (eczane/market/okul). */
  poi: { point: LatLng; label: string }[]
  /** Parsel etiketinin gösterileceği yer. */
  parselLabel: {
    position: LatLng
    adaParsel: string
    yuzolcumu: string
    cepheLabel: string | null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hash(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

/** Deterministic [0, 1) per (key, salt). */
function rand(key: string, salt: string): number {
  return (hash(`${key}::${salt}`) % 10_000) / 10_000
}

/** Deterministic [-1, 1] per (key, salt). */
function srand(key: string, salt: string): number {
  return rand(key, salt) * 2 - 1
}

/** Metre cinsinden offset → derece (lat, lng). */
function metersToLatLng(meters: number, atLat: number): { dLat: number; dLng: number } {
  const dLat = meters / 111_320
  const dLng = meters / (111_320 * Math.cos((atLat * Math.PI) / 180))
  return { dLat, dLng }
}

function offset(point: LatLng, mEast: number, mNorth: number): LatLng {
  const { dLat, dLng } = metersToLatLng(1, point[0])
  return [point[0] + dLat * mNorth, point[1] + dLng * mEast]
}

/** Coastal district keyword detection. */
const COASTAL_KEYWORDS = [
  'Cunda',
  'Sarımsaklı',
  'Datça',
  'Alaçatı',
  'Çeşme',
  'Bodrum',
  'Foça',
  'Marmaris',
  'Kuşadası',
  'Küçükköy',
  'Ayvalık',
] as const

function isCoastal(district: string): boolean {
  return COASTAL_KEYWORDS.some((k) => district.includes(k))
}

// ─── Geometry builders ───────────────────────────────────────────────────────

/**
 * Parsel polygon — kare/dikdörtgene yakın 4 köşe.
 * `cepheUzunlukM` verilirse alt kenar (ön cephe) bu uzunlukta olur,
 * yan kenar `size / cephe` ile hesaplanır.
 */
function buildParsel(
  center: LatLng,
  sizeM2: number,
  cepheUzunlukM: number | undefined,
  seed: string,
): { polygon: Polygon; cephe: Polyline | null; sideM: number } {
  // Aspect ratio: cephe verilmişse kullan, yoksa kareye yakın deterministic distort
  const cephe = cepheUzunlukM ?? Math.sqrt(sizeM2) * (0.9 + rand(seed, 'aspect') * 0.2)
  const yanM = sizeM2 / cephe
  // Rotation 0-90° (asıl açı önemli değil — mock)
  const rotDeg = rand(seed, 'rot') * 90
  const rotRad = (rotDeg * Math.PI) / 180
  // 4 köşe deterministic micro-distortion (±%4)
  const corners: LatLng[] = []
  const baseCorners: [number, number][] = [
    [-cephe / 2, -yanM / 2], // sw
    [cephe / 2, -yanM / 2], // se
    [cephe / 2, yanM / 2], // ne
    [-cephe / 2, yanM / 2], // nw
  ]
  for (let i = 0; i < 4; i++) {
    const [ex, ny] = baseCorners[i]
    // Rotate
    const rx = ex * Math.cos(rotRad) - ny * Math.sin(rotRad)
    const ry = ex * Math.sin(rotRad) + ny * Math.cos(rotRad)
    // Distort ±4% (deterministic)
    const jx = rx * (1 + srand(seed, `cx${i}`) * 0.04)
    const jy = ry * (1 + srand(seed, `cy${i}`) * 0.04)
    corners.push(offset(center, jx, jy))
  }
  const polygon: Polygon = [...corners, corners[0]]
  const cepheLine: Polyline = [corners[0], corners[1]]
  return { polygon, cephe: cepheLine, sideM: Math.max(cephe, yanM) }
}

function buildYol(parsel: Polygon, sideM: number, seed: string): Polyline {
  // Cephe kenarı = parsel[0] → parsel[1]. Yolu bu kenara paralel ~8m güney/doğusunda uzat.
  const a = parsel[0]
  const b = parsel[1]
  // Outward normal — basit hesap: cephe kenarına dik, 8m parsel dışına
  const mid: LatLng = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const center = parsel[2] // ne köşe — cephe normalinin tersi
  const dirLat = mid[0] - center[0]
  const dirLng = mid[1] - center[1]
  const len = Math.hypot(dirLat, dirLng)
  const { dLat, dLng } = metersToLatLng(8, mid[0])
  const normMag = Math.max(8, sideM * 1.5) // yol parseldan biraz daha uzun
  const start = offset(a, (-dLng * normMag * dirLng) / (len || 1) * 1000, (-dLat * normMag * dirLat) / (len || 1) * 1000)
  // Basitleştir: ön cepheyi 2x uzatılmış paralel
  const dx = b[1] - a[1]
  const dy = b[0] - a[0]
  const extend = 1.8 + rand(seed, 'yolEx') * 0.6
  const yolA: LatLng = [a[0] - dy * (extend - 1) - dLat * 1.2, a[1] - dx * (extend - 1) - dLng * 0.2]
  const yolB: LatLng = [b[0] + dy * (extend - 1) - dLat * 1.2, b[1] + dx * (extend - 1) - dLng * 0.2]
  // Suppress unused
  void start
  return [yolA, yolB]
}

function buildFay(
  center: LatLng,
  fayMesafeKm: number,
  bolge: string,
  seed: string,
): { line: Polyline; label: string; distanceKm: number } {
  // Fay merkeze göre angled distance km, hat boyunca 4 segment dalgalı
  const angle = rand(seed, 'fayAngle') * Math.PI * 2
  const distM = fayMesafeKm * 1000
  const cx = Math.cos(angle) * distM
  const cy = Math.sin(angle) * distM
  // Fay hattı bu noktadan geçen 1.5km'lik dalgalı çizgi
  const lineLen = 1500 + rand(seed, 'fayLen') * 800
  const perpAngle = angle + Math.PI / 2
  const steps = 6
  const pts: Polyline = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps - 0.5
    const along = t * lineLen
    const wobble = Math.sin(t * Math.PI * 2 + rand(seed, `fw${i}`)) * 80
    const ex = cx + Math.cos(perpAngle) * along + Math.cos(angle) * wobble
    const ny = cy + Math.sin(perpAngle) * along + Math.sin(angle) * wobble
    pts.push(offset(center, ex, ny))
  }
  return {
    line: pts,
    label: `${bolge} · ${fayMesafeKm.toFixed(1)} km`,
    distanceKm: fayMesafeKm,
  }
}

function buildDere(center: LatLng, seed: string): Polyline {
  // Parselden 80-180m geçen S eğrisi
  const distM = 80 + rand(seed, 'dereDist') * 100
  const angle = rand(seed, 'dereAngle') * Math.PI * 2
  const baseEx = Math.cos(angle) * distM
  const baseNy = Math.sin(angle) * distM
  const len = 600 + rand(seed, 'dereLen') * 400
  const perp = angle + Math.PI / 2
  const steps = 8
  const pts: Polyline = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps - 0.5
    const along = t * len
    const wobble = Math.sin(t * Math.PI * 2.2) * (50 + rand(seed, 'dw') * 40)
    const ex = baseEx + Math.cos(perp) * along + Math.cos(angle) * wobble
    const ny = baseNy + Math.sin(perp) * along + Math.sin(angle) * wobble
    pts.push(offset(center, ex, ny))
  }
  return pts
}

function buildKiyi(center: LatLng, district: string, seed: string): Polyline | null {
  if (!isCoastal(district)) return null
  const distM = 200 + rand(seed, 'kiyiDist') * 600
  // Sahile bakan kenar — güney (negatif north) varsayım
  const dir = rand(seed, 'kiyiDir') > 0.5 ? -1 : 1
  const baseEx = 0
  const baseNy = dir * -distM
  const len = 2200 + rand(seed, 'kiyiLen') * 1600
  const steps = 12
  const pts: Polyline = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps - 0.5
    const along = t * len
    const wobble = Math.sin(t * Math.PI * 3) * 90
    pts.push(offset(center, baseEx + along, baseNy + wobble))
  }
  return pts
}

function buildImarZones(center: LatLng, seed: string): Polygon[] {
  // 3 imar plan tint zone — parselin etrafında geniş 3 dikdörtgen.
  const sizeM = 350 + rand(seed, 'imarSize') * 200
  function rect(cxEx: number, cyNy: number, w: number, h: number): Polygon {
    const a = offset(center, cxEx - w / 2, cyNy - h / 2)
    const b = offset(center, cxEx + w / 2, cyNy - h / 2)
    const c = offset(center, cxEx + w / 2, cyNy + h / 2)
    const d = offset(center, cxEx - w / 2, cyNy + h / 2)
    return [a, b, c, d, a]
  }
  return [
    rect(-sizeM / 2, sizeM / 2, sizeM, sizeM),
    rect(sizeM / 2, sizeM / 2, sizeM, sizeM),
    rect(0, -sizeM / 2 - 50, sizeM * 1.6, sizeM * 0.6),
  ]
}

function buildTarimZone(center: LatLng, seed: string): Polygon {
  const w = 500 + rand(seed, 'tarimW') * 300
  const h = 400 + rand(seed, 'tarimH') * 300
  const cxEx = 250 + rand(seed, 'tarimX') * 100
  const cyNy = 250 + rand(seed, 'tarimY') * 100
  const a = offset(center, cxEx - w / 2, cyNy - h / 2)
  const b = offset(center, cxEx + w / 2, cyNy - h / 2)
  const c = offset(center, cxEx + w / 2, cyNy + h / 2)
  const d = offset(center, cxEx - w / 2, cyNy + h / 2)
  return [a, b, c, d, a]
}

function buildSitZone(center: LatLng, seed: string): Polygon {
  const cx = (rand(seed, 'sitCX') - 0.5) * 1400
  const cy = (rand(seed, 'sitCY') - 0.5) * 1400
  const r = 180 + rand(seed, 'sitR') * 100
  const pts: Polygon = []
  const sides = 6
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2
    pts.push(offset(center, cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return pts
}

function buildOrmanClusters(
  center: LatLng,
  seed: string,
): { center: LatLng; radius: number }[] {
  const out: { center: LatLng; radius: number }[] = []
  for (let i = 0; i < 5; i++) {
    const angle = rand(seed, `ormanA${i}`) * Math.PI * 2
    const dist = 200 + rand(seed, `ormanD${i}`) * 400
    out.push({
      center: offset(center, Math.cos(angle) * dist, Math.sin(angle) * dist),
      radius: 30 + rand(seed, `ormanR${i}`) * 25,
    })
  }
  return out
}

function buildHazardZone(
  center: LatLng,
  seed: string,
  saltPrefix: string,
  baseDist: number,
): Polygon {
  const cx = (rand(seed, `${saltPrefix}CX`) - 0.5) * baseDist * 2
  const cy = (rand(seed, `${saltPrefix}CY`) - 0.5) * baseDist * 2
  const w = 250 + rand(seed, `${saltPrefix}W`) * 200
  const h = 180 + rand(seed, `${saltPrefix}H`) * 150
  const pts: Polygon = []
  const sides = 5
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2 + rand(seed, `${saltPrefix}rot`) * Math.PI
    pts.push(
      offset(
        center,
        cx + Math.cos(a) * (w / 2) * (0.85 + rand(seed, `${saltPrefix}r${i}`) * 0.3),
        cy + Math.sin(a) * (h / 2) * (0.85 + rand(seed, `${saltPrefix}rr${i}`) * 0.3),
      ),
    )
  }
  return pts
}

function buildPgaBands(
  center: LatLng,
  pga: number,
  seed: string,
): { line: Polyline; label: string }[] {
  // 2 yatay paralel bant — pga ±0.05
  const off1 = 250 + rand(seed, 'pgaO1') * 100
  const off2 = -180 - rand(seed, 'pgaO2') * 120
  const length = 2400
  function band(north: number): Polyline {
    const a = offset(center, -length / 2, north)
    const b = offset(center, length / 2, north)
    return [a, b]
  }
  return [
    { line: band(off1), label: `${(pga + 0.06).toFixed(2)}g` },
    { line: band(off2), label: `${(pga - 0.04).toFixed(2)}g` },
  ]
}

function buildAltyapi(
  center: LatLng,
  seed: string,
): { point: LatLng; label: string }[] {
  const labels = ['Trafo', 'Su pompası', 'Vana']
  return labels.map((label, i) => ({
    point: offset(
      center,
      (rand(seed, `altE${i}`) - 0.5) * 500,
      (rand(seed, `altN${i}`) - 0.5) * 500,
    ),
    label,
  }))
}

function buildToplu(
  center: LatLng,
  seed: string,
): { point: LatLng; label: string }[] {
  return [
    {
      point: offset(
        center,
        (rand(seed, 'topluE0') - 0.5) * 800,
        (rand(seed, 'topluN0') - 0.5) * 800,
      ),
      label: 'Otobüs durağı',
    },
    {
      point: offset(
        center,
        (rand(seed, 'topluE1') - 0.5) * 1200,
        (rand(seed, 'topluN1') - 0.5) * 1200,
      ),
      label: 'Minibüs hattı',
    },
  ]
}

function buildCevreProjects(
  center: LatLng,
  seed: string,
): { line: Polyline; label: string }[] {
  // Planlı YHT — uzun çapraz çizgi
  const angle = rand(seed, 'yhtA') * Math.PI * 2
  const dist = 600 + rand(seed, 'yhtD') * 400
  const length = 3200
  const cx = Math.cos(angle) * dist
  const cy = Math.sin(angle) * dist
  const perp = angle + Math.PI / 2
  const a = offset(center, cx - Math.cos(perp) * length / 2, cy - Math.sin(perp) * length / 2)
  const b = offset(center, cx + Math.cos(perp) * length / 2, cy + Math.sin(perp) * length / 2)
  return [{ line: [a, b], label: 'Planlı YHT · 2027' }]
}

function buildPoi(
  center: LatLng,
  seed: string,
): { point: LatLng; label: string }[] {
  const labels = ['Market', 'Eczane', 'Okul', 'Sağlık ocağı']
  return labels.map((label, i) => ({
    point: offset(
      center,
      (rand(seed, `poiE${i}`) - 0.5) * 1400,
      (rand(seed, `poiN${i}`) - 0.5) * 1400,
    ),
    label,
  }))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getParcelGeometry(listingId: string): ParcelGeometry | null {
  const listing = LISTINGS_V2.find((l) => l.id === listingId)
  if (!listing || typeof listing.lat !== 'number' || typeof listing.lng !== 'number') {
    return null
  }
  const ext = LISTING_EXTENDED.find((e) => e.listingId === listingId)
  const hazard = HAZARD_SCORES.find((h) => h.listingId === listingId)

  const center: LatLng = [listing.lat, listing.lng]
  const seed = listingId

  const { polygon: parsel, cephe } = buildParsel(
    center,
    ext?.yuzolcumu.tapu ?? listing.size,
    ext?.cephe?.uzunluk,
    seed,
  )
  const yol = buildYol(parsel, Math.sqrt(listing.size), seed)
  const fay = buildFay(
    center,
    hazard?.scores.fayMesafeKm ?? 12,
    hazard?.scores.fayBolge ?? 'KAFZ',
    seed,
  )
  const dere = buildDere(center, seed)
  const kiyi = buildKiyi(center, listing.district, seed)
  const imarZones = buildImarZones(center, seed)
  const tarimZone = buildTarimZone(center, seed)
  const sitZone = buildSitZone(center, seed)
  const ormanClusters = buildOrmanClusters(center, seed)
  const selZone = buildHazardZone(center, seed, 'sel', 600)
  const heyelanZone = buildHazardZone(center, seed, 'hey', 700)
  const pgaBands = buildPgaBands(center, hazard?.scores.deprem.pga ?? 0.32, seed)
  const altyapi = buildAltyapi(center, seed)
  const toplu = buildToplu(center, seed)
  const cevreProjects = buildCevreProjects(center, seed)
  const poi = buildPoi(center, seed)

  const adaParsel = ext ? `${ext.ada} / ${ext.parsel}` : '— / —'
  const yuzolcumu = `${(ext?.yuzolcumu.tapu ?? listing.size).toLocaleString('tr-TR')} m²`
  const cepheLabel = ext?.cephe ? `cephe ${ext.cephe.uzunluk} m` : null

  return {
    center,
    // z15 = ~1.2km × 800m görünüm — parsel + yol + dere + yakın imar zonları aynı
    // anda görünür. "Parsele odaklan" butonu z18'e drill-down yapar.
    zoom: 15,
    parsel,
    cephe,
    yol,
    fay,
    dere,
    kiyi,
    imarZones,
    tarimZone,
    sitZone,
    ormanClusters,
    selZone,
    heyelanZone,
    pgaBands,
    altyapi,
    toplu,
    cevreProjects,
    poi,
    parselLabel: {
      position: center,
      adaParsel,
      yuzolcumu,
      cepheLabel,
    },
  }
}
