// Visual variant types — UI bileşenlerinin color/tone mapping'i için kullanılır.
// Domain entity'lerin string union'larıyla aynı değerleri taşır ama sahibi @landx/ui'dir.

export type ListingStatus = 'Aktif' | 'Pasif' | 'Taslak'
export type ListingType = 'İmarlı' | 'Tarla' | 'Zeytinlik' | 'Villa Arsası'

export type CustomerSegment = 'Sıcak' | 'Ilık' | 'Soğuk'
export type CustomerStage =
  | 'İlk temas'
  | 'Görüşme'
  | 'Teklif'
  | 'Kaparo'
  | 'Tapu'

// Chart data row shapes — admin domain'inden aynalanmış.
// Bu shape'ler @landx/data'daki entity'ler ile birebir uyumlu olmalı.
// Public-site/super-admin farklı shape ile chart kullanırsa, generic chart komponenti yazılır.

export interface AgingBucket {
  label: string
  count: number
  amount: number
}

export interface MonthlyClose {
  month: string
  count: number
  revenue: number
}

export interface SourceRow {
  source: string
  count: number
  conversion: number
}

export interface TeamRow {
  owner: string
  closed: number
  active: number
  revenue: number
  conversion: number
}

export interface MonthlyCashflow {
  month: string
  tahsilat: number
  komisyon: number
  gider: number
  net: number
}

export interface RegionRow {
  district: string
  city: string
  listings: number
  activeBuyers: number
  avgPricePerSqm: number
}
