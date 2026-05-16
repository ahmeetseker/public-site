/**
 * F37 Faz 4.0 — Mock listings extended.
 *
 * 30 yeni listing (10 konut + 10 villa + 10 işyeri) + mevcut LISTINGS
 * üzerine deterministik alan injection (hash(id) → seed → field).
 *
 * Geriye uyum: LISTINGS export aynı kalır, opsiyonel alanlar enrichment
 * ile doldurulur. `category` undefined ise arsa varsayılır.
 */

import { LISTINGS as BASE_LISTINGS, withImages } from './listings'
import type {
  Listing,
  ListingHeating,
  ListingParking,
  ListingView,
  ListingFurnished,
  ListingEnergyClass,
  SiteAmenity,
  CommercialUsage,
} from './types'

// Deterministik hash → 0..1 (seedlenmiş rastgele)
function hashSeed(id: string, salt: string): number {
  let h = 5381
  const combined = `${id}|${salt}`
  for (let i = 0; i < combined.length; i++) {
    h = ((h << 5) + h) + combined.charCodeAt(i)
    h = h >>> 0
  }
  return (h % 10000) / 10000
}

function pick<T>(id: string, salt: string, options: readonly T[]): T {
  const idx = Math.floor(hashSeed(id, salt) * options.length)
  return options[idx]!
}

function pickMulti<T>(id: string, salt: string, options: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(hashSeed(id, `${salt}-count`) * (max - min + 1))
  const result = new Set<T>()
  for (let i = 0; result.size < count && i < 20; i++) {
    result.add(pick(id, `${salt}-${i}`, options))
  }
  return Array.from(result)
}

function injectArsaFields(l: Listing): Listing {
  return {
    ...l,
    category: l.category ?? 'arsa',
    subType:
      l.subType ??
      (l.type === 'İmarlı' ? 'imarli' :
        l.type === 'Tarla' ? 'tarla' :
          l.type === 'Zeytinlik' ? 'zeytinlik' : 'villa-arsasi'),
    takasUygun: hashSeed(l.id, 'takas') > 0.7,
    forRent: false,
    ilanDate: l.lastUpdate,
  }
}

// 10 yeni konut
const RESIDENTIAL: Listing[] = Array.from({ length: 10 }, (_, i) => {
  const id = `RES.${(i + 1).toString().padStart(3, '0')}`
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya']
  const city = cities[i % cities.length]!
  const districts: Record<string, string[]> = {
    'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Sarıyer'],
    'Ankara': ['Çankaya', 'Yenimahalle'],
    'İzmir': ['Karşıyaka', 'Bornova'],
    'Bursa': ['Nilüfer'],
    'Antalya': ['Muratpaşa', 'Konyaaltı'],
  }
  const district = pick(id, 'district', districts[city] ?? ['Merkez'])
  const size = 80 + Math.floor(hashSeed(id, 'size') * 200)
  const price = size * (15000 + Math.floor(hashSeed(id, 'p') * 35000))
  const subType = pick(id, 'sub', ['daire', 'rezidans', 'mustakil', 'studyo'] as const)
  return {
    id,
    title: `${district} ${subType === 'studyo' ? 'stüdyo' : subType} — ${size} m²`,
    city,
    district,
    // `type` field constrained to land categories; category/subType drives new logic.
    type: 'İmarlı' as const,
    size,
    price,
    status: 'Aktif' as const,
    views: Math.floor(hashSeed(id, 'v') * 500),
    weeklyTrend: Array.from({ length: 7 }, (_, j) =>
      Math.floor(hashSeed(id, `w${j}`) * 30),
    ),
    lastUpdate: '2026-05-15',
    tags: ['Yeni', 'Krediye uygun'],
    lat: 39.0 + hashSeed(id, 'lat') * 3,
    lng: 28.0 + hashSeed(id, 'lng') * 8,
    category: 'konut' as const,
    subType,
    rooms: pick(id, 'rooms', ['1+1', '2+1', '3+1', '4+1'] as const),
    bathrooms: 1 + Math.floor(hashSeed(id, 'bath') * 3),
    floor: Math.floor(hashSeed(id, 'floor') * 12),
    totalFloors: 5 + Math.floor(hashSeed(id, 'tf') * 15),
    buildingAge: Math.floor(hashSeed(id, 'age') * 25),
    heating: pick(id, 'heat', ['dogalgaz-kombi', 'dogalgaz-merkezi', 'klima', 'yerden'] as const) as ListingHeating,
    parking: pick(id, 'park', ['yok', 'acik', 'kapali'] as const) as ListingParking,
    hasElevator: hashSeed(id, 'lift') > 0.3,
    balconyCount: Math.floor(hashSeed(id, 'balc') * 3),
    view: pickMulti(id, 'view', ['deniz', 'sehir', 'park', 'dag'] as const, 0, 2) as ListingView[],
    furnished: pick(id, 'furn', ['esyali', 'bos', 'kismi'] as const) as ListingFurnished,
    aidat: Math.floor(hashSeed(id, 'aidat') * 800) + 200,
    creditEligible: hashSeed(id, 'credit') > 0.2,
    energyClass: pick(id, 'energy', ['A', 'B', 'C', 'D'] as const) as ListingEnergyClass,
    withinSite: hashSeed(id, 'site') > 0.4,
    siteAmenities: pickMulti(id, 'amen', ['havuz', 'spor', 'guvenlik', 'kapali-otopark', 'yesil-alan'] as const, 0, 4) as SiteAmenity[],
    takasUygun: hashSeed(id, 'takas') > 0.7,
    forRent: hashSeed(id, 'rent') > 0.7,
    ilanDate: '2026-05-15',
  }
})

// 10 yeni villa
const VILLAS: Listing[] = Array.from({ length: 10 }, (_, i) => {
  const id = `VIL.${(i + 1).toString().padStart(3, '0')}`
  const city = pick(id, 'city', ['İzmir', 'Muğla', 'Antalya', 'İstanbul'] as const)
  const district = pick(id, 'd', ['Çeşme', 'Bodrum', 'Kalkan', 'Kemerburgaz', 'Sarıyer'])
  const size = 200 + Math.floor(hashSeed(id, 's') * 400)
  const price = size * (25000 + Math.floor(hashSeed(id, 'p') * 50000))
  return {
    id,
    title: `${district} villa — ${size} m² + havuz`,
    city,
    district,
    type: 'Villa Arsası' as const,
    size,
    price,
    status: 'Aktif' as const,
    views: Math.floor(hashSeed(id, 'v') * 800),
    weeklyTrend: Array.from({ length: 7 }, (_, j) =>
      Math.floor(hashSeed(id, `w${j}`) * 40),
    ),
    lastUpdate: '2026-05-15',
    tags: ['Havuz', 'Bahçe', 'Deniz manzara'],
    lat: 36.5 + hashSeed(id, 'lat') * 4,
    lng: 27.0 + hashSeed(id, 'lng') * 4,
    category: 'villa' as const,
    subType: pick(id, 'sub', ['villa', 'dubleks', 'tripleks'] as const),
    rooms: pick(id, 'r', ['4+1', '5+1', '5+2', '6+'] as const),
    bathrooms: 2 + Math.floor(hashSeed(id, 'b') * 3),
    floor: 0,
    totalFloors: 2 + Math.floor(hashSeed(id, 'tf') * 2),
    buildingAge: Math.floor(hashSeed(id, 'age') * 15),
    heating: 'yerden' as ListingHeating,
    parking: 'kapali' as ListingParking,
    hasElevator: false,
    balconyCount: 2,
    view: pickMulti(id, 'view', ['deniz', 'orman', 'dag'] as const, 1, 2) as ListingView[],
    furnished: 'bos' as ListingFurnished,
    creditEligible: hashSeed(id, 'c') > 0.4,
    energyClass: pick(id, 'e', ['A', 'B', 'C'] as const) as ListingEnergyClass,
    withinSite: hashSeed(id, 's') > 0.3,
    siteAmenities: ['havuz', 'guvenlik', 'yesil-alan'] as SiteAmenity[],
    takasUygun: hashSeed(id, 'k') > 0.6,
    forRent: false,
    ilanDate: '2026-05-15',
  }
})

// 10 yeni işyeri
const COMMERCIAL: Listing[] = Array.from({ length: 10 }, (_, i) => {
  const id = `COM.${(i + 1).toString().padStart(3, '0')}`
  const city = pick(id, 'city', ['İstanbul', 'Ankara', 'İzmir', 'Bursa'] as const)
  const district = pick(id, 'd', ['Levent', 'Maslak', 'Çankaya', 'Bornova', 'Nilüfer'])
  const size = 50 + Math.floor(hashSeed(id, 's') * 300)
  const price = size * (20000 + Math.floor(hashSeed(id, 'p') * 60000))
  const subType = pick(id, 'sub', ['ofis', 'dukkan', 'depo', 'fabrika'] as const)
  const typeName = subType === 'dukkan' ? 'Dükkan' : subType === 'ofis' ? 'Ofis' : subType === 'depo' ? 'Depo' : 'Ofis'
  return {
    id,
    title: `${district} ${typeName} — ${size} m²`,
    city,
    district,
    type: 'İmarlı' as const,
    size,
    price,
    status: 'Aktif' as const,
    views: Math.floor(hashSeed(id, 'v') * 300),
    weeklyTrend: Array.from({ length: 7 }, (_, j) =>
      Math.floor(hashSeed(id, `w${j}`) * 20),
    ),
    lastUpdate: '2026-05-15',
    tags: ['Vitrin', 'Merkezi konum'],
    lat: 39.0 + hashSeed(id, 'lat') * 3,
    lng: 28.0 + hashSeed(id, 'lng') * 8,
    category: 'isyeri' as const,
    subType,
    netSize: Math.floor(size * (0.7 + hashSeed(id, 'net') * 0.2)),
    hasShowcase: subType === 'dukkan',
    commercialUsage: ['satilik', subType === 'dukkan' ? 'kira' : 'satilik'] as CommercialUsage[],
    parking: pick(id, 'park', ['acik', 'kapali'] as const) as ListingParking,
    heating: 'klima' as ListingHeating,
    creditEligible: hashSeed(id, 'c') > 0.4,
    takasUygun: false,
    forRent: hashSeed(id, 'r') > 0.5,
    depozito: subType === 'dukkan' ? Math.floor(price * 0.001) : undefined,
    ilanDate: '2026-05-15',
  }
})

/** F37 Faz 4 — extended listings (arsa enrichment + 30 yeni). */
export const LISTINGS_V2: Listing[] = [
  ...BASE_LISTINGS.map(injectArsaFields),
  ...RESIDENTIAL,
  ...VILLAS,
  ...COMMERCIAL,
].map(withImages)
