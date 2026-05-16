import type { CustomerStage } from './types'

export type DealStatus = 'Aktif' | 'Bekliyor' | 'Risk'

export interface Deal {
  id: string
  customerId: string
  customerName: string
  listingId: string
  listingTitle: string
  stage: CustomerStage
  value: number
  status: DealStatus
  owner: string
  updatedAt: string
  daysInStage: number
}

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const STAGE_ORDER: CustomerStage[] = [
  'İlk temas',
  'Görüşme',
  'Teklif',
  'Kaparo',
  'Tapu',
]

export const DEALS: Deal[] = [
  {
    id: 'D-2401',
    customerId: 'M-2401',
    customerName: 'Burhan Kaynak',
    listingId: '10.AY.0207',
    listingTitle: 'Ayvalık Sarımsaklı zeytinlik',
    stage: 'Görüşme',
    value: 5800000,
    status: 'Aktif',
    owner: 'Ahmet',
    updatedAt: iso(0),
    daysInStage: 4,
  },
  {
    id: 'D-2398',
    customerId: 'M-2398',
    customerName: 'Selin Aksoy',
    listingId: '09.AL.0061',
    listingTitle: 'Alaçatı bağ evi imarlı',
    stage: 'Teklif',
    value: 10800000,
    status: 'Aktif',
    owner: 'Ayşe',
    updatedAt: iso(0),
    daysInStage: 2,
  },
  {
    id: 'D-2391',
    customerId: 'M-2391',
    customerName: 'Mehmet Yılmaz',
    listingId: '28.AY.0142',
    listingTitle: 'Cunda denize 80m',
    stage: 'Kaparo',
    value: 8400000,
    status: 'Aktif',
    owner: 'Ahmet',
    updatedAt: iso(0),
    daysInStage: 1,
  },
  {
    id: 'D-2376',
    customerId: 'M-2376',
    customerName: 'Deniz Yıldırım',
    listingId: '48.MR.0044',
    listingTitle: 'Marmaris Bozburun koy',
    stage: 'Görüşme',
    value: 22500000,
    status: 'Aktif',
    owner: 'Berk',
    updatedAt: iso(1),
    daysInStage: 7,
  },
  {
    id: 'D-2374',
    customerId: 'M-2374',
    customerName: 'Cem Gül',
    listingId: '48.DT.0028',
    listingTitle: 'Datça villa imarlı',
    stage: 'İlk temas',
    value: 14200000,
    status: 'Aktif',
    owner: 'Ayşe',
    updatedAt: iso(0),
    daysInStage: 1,
  },
  {
    id: 'D-2370',
    customerId: 'M-2369',
    customerName: 'Pınar Akın',
    listingId: '09.UR.0188',
    listingTitle: 'Urla Zeytinalanı',
    stage: 'İlk temas',
    value: 3600000,
    status: 'Aktif',
    owner: 'Ahmet',
    updatedAt: iso(2),
    daysInStage: 2,
  },
  {
    id: 'D-2363',
    customerId: 'M-2363',
    customerName: 'Atilla Karaca',
    listingId: '09.SK.0301',
    listingTitle: 'Söke tarla',
    stage: 'Görüşme',
    value: 3800000,
    status: 'Bekliyor',
    owner: 'Berk',
    updatedAt: iso(3),
    daysInStage: 8,
  },
  {
    id: 'D-2358',
    customerId: 'M-2358',
    customerName: 'Ayfer Tan',
    listingId: '10.AY.0231',
    listingTitle: 'Sahilkent imarlı',
    stage: 'İlk temas',
    value: 5400000,
    status: 'Aktif',
    owner: 'Ayşe',
    updatedAt: iso(4),
    daysInStage: 4,
  },
  {
    id: 'D-2351',
    customerId: 'M-2351',
    customerName: 'Hakan Çeçen',
    listingId: '17.AK.0089',
    listingTitle: 'Akçay Beach',
    stage: 'Görüşme',
    value: 6800000,
    status: 'Risk',
    owner: 'Ahmet',
    updatedAt: iso(6),
    daysInStage: 12,
  },
  {
    id: 'D-2346',
    customerId: 'M-2346',
    customerName: 'Lale Erdem',
    listingId: '10.HV.0156',
    listingTitle: 'Havran zeytinlik',
    stage: 'Teklif',
    value: 2700000,
    status: 'Aktif',
    owner: 'Berk',
    updatedAt: iso(6),
    daysInStage: 5,
  },
  {
    id: 'D-2330',
    customerId: 'M-2330',
    customerName: 'Mert Soydan',
    listingId: '48.FT.0072',
    listingTitle: 'Fethiye Hisarönü villa',
    stage: 'Tapu',
    value: 16800000,
    status: 'Aktif',
    owner: 'Ayşe',
    updatedAt: iso(2),
    daysInStage: 3,
  },
  {
    id: 'D-2320',
    customerId: 'M-2320',
    customerName: 'Filiz Uzun',
    listingId: '09.CS.0033',
    listingTitle: 'Çeşme Reisdere imarlı',
    stage: 'Kaparo',
    value: 9800000,
    status: 'Aktif',
    owner: 'Ahmet',
    updatedAt: iso(5),
    daysInStage: 6,
  },
  {
    id: 'D-2315',
    customerId: 'M-2315',
    customerName: 'Onur Bayrak',
    listingId: '10.AY.0218',
    listingTitle: 'Küçükköy imarlı',
    stage: 'Teklif',
    value: 3000000,
    status: 'Bekliyor',
    owner: 'Berk',
    updatedAt: iso(8),
    daysInStage: 10,
  },
  {
    id: 'D-2310',
    customerId: 'M-2310',
    customerName: 'Tunç Berksoy',
    listingId: '17.AK.0102',
    listingTitle: 'Akçay merkez',
    stage: 'Tapu',
    value: 4200000,
    status: 'Aktif',
    owner: 'Ahmet',
    updatedAt: iso(7),
    daysInStage: 5,
  },
] as const

export function dealsByStage(stage: CustomerStage): Deal[] {
  return DEALS.filter((d) => d.stage === stage)
}

export function stageStats(stage: CustomerStage) {
  const list = dealsByStage(stage)
  return {
    count: list.length,
    value: list.reduce((s, d) => s + d.value, 0),
    risk: list.filter((d) => d.status === 'Risk').length,
  }
}

export function funnelData() {
  return STAGE_ORDER.map((stage) => {
    const list = dealsByStage(stage)
    return {
      stage,
      count: list.length,
      value: list.reduce((s, d) => s + d.value, 0),
    }
  })
}
