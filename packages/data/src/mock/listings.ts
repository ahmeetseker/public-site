import type {
  Listing,
  ListingTitleStatus,
  ListingZoning,
} from './types'

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

// Wave F4.A.3 — deterministic seeding for the new comparison-table fields.
// We keep the LISTINGS literal compact (it already drives every consumer in
// the monorepo) and decorate it with `zoning`, `titleStatus`, `hasRoad`,
// `hasWater`, `hasElectricity` at module load. Values are stable across runs
// because they're derived from a tiny string-hash of the listing id, so
// tests, snapshots and SEO output remain reproducible.
const ZONINGS: readonly ListingZoning[] = [
  'konut',
  'ticari',
  'tarim',
  'sanayi',
  'turizm',
] as const
const TITLES: readonly ListingTitleStatus[] = [
  'tapulu',
  'hisseli',
  'kat-irtifaki',
  'kat-mulkiyeti',
] as const

function seededIdx(id: string, mod: number): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h) % mod
}

function withCompareFields(l: Listing): Listing {
  return {
    ...l,
    zoning: ZONINGS[seededIdx(l.id, ZONINGS.length)],
    titleStatus: TITLES[seededIdx(l.id + 'T', TITLES.length)],
    hasRoad: seededIdx(l.id + 'R', 4) > 0, // ~75% true
    hasWater: seededIdx(l.id + 'W', 3) > 0, // ~67% true
    hasElectricity: seededIdx(l.id + 'E', 5) > 0, // ~80% true
  }
}

// Wave UX — Mock galeri. Görseller listing.type'a göre Unsplash photo ID
// havuzundan seçilir (deterministik, listing.id seedli). Tüm URL'ler
// Unsplash CDN'den gelir; auth/anahtar gerekmez. Her listing 6 ana foto,
// 3 drone (havadan), 2 plan (imar/kroki) görselle gelir.
const IMG = (id: string, w = 1600): string =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=70`

// Genel kategorize havuzlar — kararlı, popüler Unsplash photo ID'leri.
const POOLS: Record<string, readonly string[]> = {
  deniz: [
    '1507525428034-b723cf961d3e',
    '1519046904884-53103b34b206',
    '1505228395891-9a51e7e86bf6',
    '1502082553048-f009c37129b9',
    '1473773508845-188df298d2d1',
    '1499856871958-5b9627545d1a',
    '1507525428034-b723cf961d3e',
    '1530541930197-ff16ac917b0e',
  ],
  zeytinlik: [
    '1542223533-9ec0c5e92327',
    '1551279880-03041531948f',
    '1499529112087-3cb3b73cec95',
    '1601758228041-f3b2795255f1',
    '1568378262378-eb3e07e85f4f',
    '1572383672419-ab35444a6934',
    '1568374489604-25aa48a07a5c',
    '1605034313761-73ea4a0cfbf3',
  ],
  tarla: [
    '1500382017468-9049fed747ef',
    '1465146344425-f00d5f5c8f07',
    '1452855283-6ccf16302d3e',
    '1416879595882-3373a0480b5b',
    '1492496913980-501348b61469',
    '1473496169904-658ba7c44d8a',
    '1444858345389-c4a83e58f0fb',
    '1500076656116-558758c991c1',
  ],
  arsa: [
    '1469474968028-56623f02e42e',
    '1441974231531-c6227db76b6e',
    '1506905925346-21bda4d32df4',
    '1518173946687-a4c8892bbd9f',
    '1426604966848-d7adac402bff',
    '1472214103451-9374bd1c798e',
    '1501785888041-af3ef285b470',
    '1542038784456-1ea8e935640e',
  ],
  villa: [
    '1564013799919-ab600027ffc6',
    '1572120360610-d971b9d7767c',
    '1600596542815-ffad4c1539a9',
    '1613490493576-7fde63acd811',
    '1600585154340-be6161a56a0c',
    '1613977257363-707ba9348227',
    '1600210492486-724fe5c67fb0',
    '1598228723793-52759bba239c',
  ],
}

const DRONE_POOL = [
  '1506765515384-028b60a970df',
  '1502082553048-f009c37129b9',
  '1469474968028-56623f02e42e',
  '1518173946687-a4c8892bbd9f',
  '1452855283-6ccf16302d3e',
  '1473773508845-188df298d2d1',
  '1416879595882-3373a0480b5b',
  '1500076656116-558758c991c1',
] as const

const PLAN_POOL = [
  '1503387762-cf8b73ff6d28',
  '1497366216548-37526070297c',
  '1486718448742-163732cd1544',
  '1487958449943-2429e8be8625',
  '1554435493-93422e8d1a41',
  '1487014679447-9f8336841d58',
] as const

function pickPool(l: Listing): readonly string[] {
  const cat = l.category ?? 'arsa'
  if (cat === 'villa') return POOLS.villa
  if (cat === 'konut') return POOLS.villa
  // Arsa varyantları — type'a göre
  if (l.type === 'Zeytinlik') return POOLS.zeytinlik
  if (l.type === 'Tarla') return POOLS.tarla
  // Coğrafyaya bak: deniz manzaralı tag/şehir
  const sea = (l.tags ?? []).some((t) =>
    /deniz|kıyı|sahil|cunda|alaç|datça/i.test(t),
  )
  if (sea) return POOLS.deniz
  return POOLS.arsa
}

export function withImages(l: Listing): Listing {
  const pool = pickPool(l)
  const start = seededIdx(l.id, pool.length)
  const images = Array.from({ length: 6 }, (_, i) => IMG(pool[(start + i) % pool.length]))
  const droneStart = seededIdx(l.id + 'D', DRONE_POOL.length)
  const droneImages = Array.from({ length: 3 }, (_, i) =>
    IMG(DRONE_POOL[(droneStart + i) % DRONE_POOL.length], 1400),
  )
  const planStart = seededIdx(l.id + 'P', PLAN_POOL.length)
  const planImages = Array.from({ length: 2 }, (_, i) =>
    IMG(PLAN_POOL[(planStart + i) % PLAN_POOL.length], 1200),
  )
  return { ...l, images, droneImages, planImages }
}

const BASE_LISTINGS: Listing[] = [
  {
    id: '28.AY.0142',
    title: 'Cunda · denize 80m, yola cephe imarlı arsa',
    city: 'Balıkesir',
    district: 'Ayvalık · Cunda',
    type: 'İmarlı',
    size: 1240,
    price: 8400000,
    status: 'Aktif',
    views: 412,
    weeklyTrend: [18, 22, 28, 34, 31, 42, 52],
    lastUpdate: iso(0),
    tags: ['deniz manzaralı', 'yola cephe'],
    lat: 39.3504,
    lng: 26.6502,
  },
  {
    id: '48.DT.0028',
    title: 'Datça merkez · villa imarlı, 2.150 m²',
    city: 'Muğla',
    district: 'Datça',
    type: 'Villa Arsası',
    size: 2150,
    price: 14200000,
    status: 'Aktif',
    views: 286,
    weeklyTrend: [14, 17, 21, 19, 24, 22, 31],
    lastUpdate: iso(1),
    tags: ['imar planı yeni', 'köşe parsel'],
    lat: 36.7305,
    lng: 27.6863,
  },
  {
    id: '10.AY.0207',
    title: 'Ayvalık Sarımsaklı · 580 ağaçlı zeytinlik',
    city: 'Balıkesir',
    district: 'Ayvalık · Sarımsaklı',
    type: 'Zeytinlik',
    size: 8400,
    price: 5800000,
    status: 'Aktif',
    views: 198,
    weeklyTrend: [9, 11, 14, 18, 16, 22, 27],
    lastUpdate: iso(2),
    tags: ['580 ağaç', 'sulu'],
    lat: 39.2790,
    lng: 26.6638,
  },
  {
    id: '09.AL.0061',
    title: 'Alaçatı bağ evi imarlı, asfalta sıfır',
    city: 'İzmir',
    district: 'Çeşme · Alaçatı',
    type: 'İmarlı',
    size: 1820,
    price: 11500000,
    status: 'Aktif',
    views: 504,
    weeklyTrend: [28, 32, 38, 42, 48, 55, 62],
    lastUpdate: iso(0),
    tags: ['popüler bölge', 'butik otel uygun'],
    lat: 38.2802,
    lng: 26.3842,
  },
  {
    id: '09.UR.0114',
    title: 'Urla · 3.200 m² zeytinlik, kuyu mevcut',
    city: 'İzmir',
    district: 'Urla',
    type: 'Zeytinlik',
    size: 3200,
    price: 4200000,
    status: 'Aktif',
    views: 142,
    weeklyTrend: [6, 8, 11, 9, 12, 14, 18],
    lastUpdate: iso(3),
    tags: ['kuyu', 'elektrik var'],
    lat: 38.3219,
    lng: 26.7704,
  },
  {
    id: '10.AY.0218',
    title: 'Küçükköy · 980 m² imarlı',
    city: 'Balıkesir',
    district: 'Ayvalık · Küçükköy',
    type: 'İmarlı',
    size: 980,
    price: 3200000,
    status: 'Aktif',
    views: 87,
    weeklyTrend: [4, 5, 7, 6, 9, 11, 12],
    lastUpdate: iso(5),
    tags: ['hemen yapılaşma'],
    lat: 39.3334,
    lng: 26.6818,
  },
  {
    id: '09.SK.0301',
    title: 'Söke · ovaya bakan tarla, 12.500 m²',
    city: 'Aydın',
    district: 'Söke',
    type: 'Tarla',
    size: 12500,
    price: 3800000,
    status: 'Aktif',
    views: 64,
    weeklyTrend: [3, 4, 5, 4, 7, 8, 9],
    lastUpdate: iso(4),
    tags: ['tarım amaçlı'],
    lat: 37.7484,
    lng: 27.4090,
  },
  {
    id: '17.AK.0089',
    title: 'Akçay Beach · 720 m² ikinci sahil parseli',
    city: 'Balıkesir',
    district: 'Edremit · Akçay',
    type: 'İmarlı',
    size: 720,
    price: 6800000,
    status: 'Aktif',
    views: 312,
    weeklyTrend: [18, 22, 24, 28, 32, 38, 42],
    lastUpdate: iso(1),
    tags: ['sahile 200m', 'site içi'],
    lat: 39.5871,
    lng: 26.9027,
  },
  {
    id: '48.MR.0044',
    title: 'Marmaris Bozburun · 4.800 m² koy önü',
    city: 'Muğla',
    district: 'Marmaris · Bozburun',
    type: 'Villa Arsası',
    size: 4800,
    price: 22500000,
    status: 'Aktif',
    views: 218,
    weeklyTrend: [12, 16, 18, 22, 26, 28, 34],
    lastUpdate: iso(2),
    tags: ['koy önü', 'özel'],
    lat: 36.6815,
    lng: 28.0497,
  },
  {
    id: '10.HV.0156',
    title: 'Havran · yola sıfır zeytinlik, 6.200 m²',
    city: 'Balıkesir',
    district: 'Havran',
    type: 'Zeytinlik',
    size: 6200,
    price: 2900000,
    status: 'Aktif',
    views: 96,
    weeklyTrend: [4, 6, 7, 8, 9, 11, 14],
    lastUpdate: iso(3),
    tags: ['400 ağaç'],
    lat: 39.5520,
    lng: 27.1015,
  },
  {
    id: '09.CS.0033',
    title: 'Çeşme Reisdere · imarlı, çift cepheli',
    city: 'İzmir',
    district: 'Çeşme · Reisdere',
    type: 'İmarlı',
    size: 1450,
    price: 9800000,
    status: 'Aktif',
    views: 268,
    weeklyTrend: [14, 18, 22, 24, 28, 32, 38],
    lastUpdate: iso(0),
    tags: ['çift cephe', 'denize 600m'],
    lat: 38.3008,
    lng: 26.3450,
  },
  {
    id: '48.FT.0072',
    title: 'Fethiye Hisarönü · panaromik villa arsası',
    city: 'Muğla',
    district: 'Fethiye · Hisarönü',
    type: 'Villa Arsası',
    size: 2840,
    price: 16800000,
    status: 'Aktif',
    views: 374,
    weeklyTrend: [22, 26, 32, 38, 42, 48, 56],
    lastUpdate: iso(1),
    tags: ['manzara', 'üst yol'],
    lat: 36.5670,
    lng: 29.1282,
  },
  {
    id: '10.AY.0192',
    title: 'Altınova · 1.860 m² yola cephe imarlı',
    city: 'Balıkesir',
    district: 'Ayvalık · Altınova',
    type: 'İmarlı',
    size: 1860,
    price: 4100000,
    status: 'Pasif',
    views: 42,
    weeklyTrend: [2, 3, 2, 4, 3, 3, 4],
    lastUpdate: iso(14),
    tags: ['fiyat düşürüldü'],
    lat: 39.3472,
    lng: 26.7796,
  },
  {
    id: '09.AL.0044',
    title: 'Alaçatı içi · 540 m² ticari imarlı',
    city: 'İzmir',
    district: 'Çeşme · Alaçatı',
    type: 'İmarlı',
    size: 540,
    price: 7200000,
    status: 'Pasif',
    views: 88,
    weeklyTrend: [6, 5, 4, 6, 5, 4, 3],
    lastUpdate: iso(18),
    tags: ['ticari'],
    lat: 38.2780,
    lng: 26.3825,
  },
  {
    id: '48.DT.0091',
    title: 'Datça Knidos · 5.400 m² koy parseli',
    city: 'Muğla',
    district: 'Datça · Knidos',
    type: 'Villa Arsası',
    size: 5400,
    price: 26800000,
    status: 'Taslak',
    views: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
    lastUpdate: iso(0),
    tags: ['yeni eklenen', 'fotoğraf bekliyor'],
    lat: 36.6850,
    lng: 27.3760,
  },
  {
    id: '10.AY.0231',
    title: 'Sahilkent · 1.140 m² imarlı parsel',
    city: 'Balıkesir',
    district: 'Ayvalık · Sahilkent',
    type: 'İmarlı',
    size: 1140,
    price: 5400000,
    status: 'Aktif',
    views: 174,
    weeklyTrend: [11, 13, 16, 19, 22, 24, 28],
    lastUpdate: iso(0),
    tags: ['site komşusu'],
    lat: 39.3208,
    lng: 26.6892,
  },
  {
    id: '09.UR.0188',
    title: 'Urla Zeytinalanı · 4.500 m² zeytin + tarla',
    city: 'İzmir',
    district: 'Urla · Zeytinalanı',
    type: 'Zeytinlik',
    size: 4500,
    price: 3600000,
    status: 'Aktif',
    views: 122,
    weeklyTrend: [6, 8, 9, 11, 12, 14, 16],
    lastUpdate: iso(2),
    tags: ['ikiz parsel'],
    lat: 38.3274,
    lng: 26.7294,
  },
  {
    id: '17.AK.0102',
    title: 'Akçay merkez · 920 m² imarlı',
    city: 'Balıkesir',
    district: 'Edremit · Akçay',
    type: 'İmarlı',
    size: 920,
    price: 4200000,
    status: 'Aktif',
    views: 152,
    weeklyTrend: [9, 11, 12, 14, 16, 18, 22],
    lastUpdate: iso(4),
    tags: ['merkez', 'sahile 350m'],
    lat: 39.5895,
    lng: 26.9018,
  },
]

export const LISTINGS: Listing[] = BASE_LISTINGS.map(withCompareFields).map(withImages)

export function listingsByStatus(status?: Listing['status'] | 'Tümü') {
  if (!status || status === 'Tümü') return LISTINGS
  return LISTINGS.filter((l) => l.status === status)
}
