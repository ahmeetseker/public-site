export interface TeamRow {
  owner: string
  closed: number
  active: number
  revenue: number
  conversion: number
  avgResponseMin: number
}

export const TEAM_PERFORMANCE: TeamRow[] = [
  { owner: 'Ahmet', closed: 7, active: 12, revenue: 8200000, conversion: 0.36, avgResponseMin: 32 },
  { owner: 'Ayşe', closed: 5, active: 9, revenue: 6400000, conversion: 0.42, avgResponseMin: 28 },
  { owner: 'Berk', closed: 3, active: 7, revenue: 4100000, conversion: 0.24, avgResponseMin: 64 },
  { owner: 'Ceren', closed: 4, active: 6, revenue: 5300000, conversion: 0.31, avgResponseMin: 41 },
] as const

export interface MonthlyClose {
  month: string
  count: number
  revenue: number
}

export const MONTHLY_CLOSE: MonthlyClose[] = [
  { month: 'Kas', count: 6, revenue: 7200000 },
  { month: 'Ara', count: 5, revenue: 8400000 },
  { month: 'Oca', count: 4, revenue: 6800000 },
  { month: 'Şub', count: 8, revenue: 9600000 },
  { month: 'Mar', count: 10, revenue: 11200000 },
  { month: 'Nis', count: 12, revenue: 14200000 },
] as const

export interface SourceRow {
  source: string
  count: number
  conversion: number
}

export const CUSTOMER_SOURCES: SourceRow[] = [
  { source: 'Sahibinden', count: 38, conversion: 0.28 },
  { source: 'Referans', count: 22, conversion: 0.45 },
  { source: 'Hürriyet Emlak', count: 14, conversion: 0.18 },
  { source: 'Sosyal Medya', count: 12, conversion: 0.12 },
  { source: 'Walk-in', count: 8, conversion: 0.38 },
] as const

export interface RegionRow {
  district: string
  city: string
  listings: number
  activeBuyers: number
  avgPricePerSqm: number
  weeklyTrend: number[]
}

export const REGION_RANKING: RegionRow[] = [
  {
    district: 'Ayvalık · Cunda',
    city: 'Balıkesir',
    listings: 14,
    activeBuyers: 11,
    avgPricePerSqm: 6750,
    weeklyTrend: [22, 28, 31, 34, 38, 42, 48],
  },
  {
    district: 'Çeşme · Alaçatı',
    city: 'İzmir',
    listings: 12,
    activeBuyers: 9,
    avgPricePerSqm: 8400,
    weeklyTrend: [18, 22, 26, 28, 32, 36, 42],
  },
  {
    district: 'Datça',
    city: 'Muğla',
    listings: 8,
    activeBuyers: 6,
    avgPricePerSqm: 5200,
    weeklyTrend: [14, 16, 19, 22, 21, 24, 28],
  },
  {
    district: 'Urla',
    city: 'İzmir',
    listings: 7,
    activeBuyers: 5,
    avgPricePerSqm: 4800,
    weeklyTrend: [9, 12, 14, 13, 16, 18, 21],
  },
  {
    district: 'Edremit · Akçay',
    city: 'Balıkesir',
    listings: 6,
    activeBuyers: 4,
    avgPricePerSqm: 4200,
    weeklyTrend: [8, 10, 11, 13, 14, 16, 18],
  },
  {
    district: 'Fethiye · Hisarönü',
    city: 'Muğla',
    listings: 4,
    activeBuyers: 5,
    avgPricePerSqm: 7100,
    weeklyTrend: [6, 8, 11, 13, 15, 17, 20],
  },
  {
    district: 'Söke',
    city: 'Aydın',
    listings: 3,
    activeBuyers: 2,
    avgPricePerSqm: 1900,
    weeklyTrend: [3, 4, 4, 5, 6, 6, 7],
  },
] as const

export const STAGE_CONVERSION = [
  { stage: 'İlk temas', value: 94, hint: '94 yeni temas' },
  { stage: 'Görüşme', value: 62, hint: '%66 dönüşüm' },
  { stage: 'Teklif', value: 38, hint: '%61 dönüşüm' },
  { stage: 'Kaparo', value: 19, hint: '%50 dönüşüm' },
  { stage: 'Tapu', value: 14, hint: '%74 dönüşüm' },
] as const
