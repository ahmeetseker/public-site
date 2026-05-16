export type ListingStatus = 'Aktif' | 'Pasif' | 'Taslak'
export type ListingType = 'İmarlı' | 'Tarla' | 'Zeytinlik' | 'Villa Arsası'

export type ListingZoning = 'konut' | 'ticari' | 'tarim' | 'sanayi' | 'turizm'
export type ListingTitleStatus =
  | 'tapulu'
  | 'hisseli'
  | 'kat-irtifaki'
  | 'kat-mulkiyeti'

// === F37 Faz 4 — Çok-kategori expansion ===

export type ListingCategory = 'arsa' | 'konut' | 'villa' | 'isyeri'

export type LandSubType        = 'imarli' | 'tarla' | 'zeytinlik' | 'villa-arsasi'
export type ResidentialSubType = 'daire' | 'rezidans' | 'mustakil' | 'yazlik' | 'studyo'
export type VillaSubType       = 'villa' | 'dubleks' | 'tripleks' | 'kosk'
export type CommercialSubType  = 'ofis' | 'dukkan' | 'depo' | 'fabrika' | 'otel' | 'arsa-ticari'

export type ListingSubType = LandSubType | ResidentialSubType | VillaSubType | CommercialSubType

export type ListingHeating = 'dogalgaz-kombi' | 'dogalgaz-merkezi' | 'klima' | 'soba' | 'yerden' | 'yok'
export type ListingParking = 'yok' | 'acik' | 'kapali' | 'otopark-binasi'
export type ListingView    = 'deniz' | 'goller' | 'orman' | 'dag' | 'sehir' | 'park'
export type ListingFurnished = 'esyali' | 'bos' | 'kismi'
export type ListingFacade  = 'kuzey' | 'guney' | 'dogu' | 'bati'
export type ListingEnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type SiteAmenity = 'havuz' | 'spor' | 'oyun-bahcesi' | 'guvenlik' | 'kapali-otopark' | 'yesil-alan'
export type CommercialUsage = 'kira' | 'satilik' | 'devren'

export interface Listing {
  id: string
  title: string
  city: string
  district: string
  type: ListingType
  size: number // m²
  price: number // TL
  status: ListingStatus
  views: number
  weeklyTrend: number[] // sparkline
  lastUpdate: string // ISO
  tags: string[]
  // Wave F4.B.1 — geo coordinates for the public-site /ara map view.
  // Required: every BASE_LISTINGS row carries a deterministic lat/lng pair
  // (region-anchored, ±0.4° offset). API-derived listings must also provide
  // them so MapView never has to guard against undefined.
  lat: number
  lng: number
  // Wave F4.A.3 — comparison-table fields. Optional + additive so existing
  // consumers (api routes, list-card components) keep compiling untouched.
  zoning?: ListingZoning
  titleStatus?: ListingTitleStatus
  hasRoad?: boolean
  hasWater?: boolean
  hasElectricity?: boolean

  // === F37 Faz 4 — Çok-kategori opsiyonel alanlar (geriye uyumlu, hepsi opsiyonel) ===

  category?: ListingCategory
  subType?: ListingSubType

  // Konut / villa
  rooms?: string                // "1+1" | "2+1" | "3+1" | "4+1" | "5+1" | "6+"
  bathrooms?: number
  floor?: number                // bulunduğu kat
  totalFloors?: number          // bina toplam kat
  buildingAge?: number          // 0..30+
  heating?: ListingHeating
  parking?: ListingParking
  hasElevator?: boolean
  balconyCount?: number
  view?: ListingView[]
  furnished?: ListingFurnished
  facade?: ListingFacade[]
  aidat?: number                // TL/ay
  creditEligible?: boolean
  energyClass?: ListingEnergyClass
  withinSite?: boolean
  siteName?: string
  siteAmenities?: SiteAmenity[]

  // İşyeri
  commercialUsage?: CommercialUsage[]
  hasShowcase?: boolean
  netSize?: number              // m² net

  // Ortak ek
  takasUygun?: boolean
  depozito?: number             // kira için
  ilanDate?: string             // ilk yayın ISO
  forRent?: boolean             // satılık (false/undef) vs kiralık (true)

  // Media — galeri için. Birden çok kategori desteklenir; UI sekmeli galeri
  // render edebilir. Hepsi opsiyonel — eski API tüketicileri etkilenmez.
  images?: string[]             // genel (deniz/manzara/parsel/zeytinlik)
  droneImages?: string[]        // havadan/drone perspektifi
  planImages?: string[]         // imar planı / kroki / kadastro
}

export type CustomerSegment = 'Sıcak' | 'Ilık' | 'Soğuk'
export type CustomerStage =
  | 'İlk temas'
  | 'Görüşme'
  | 'Teklif'
  | 'Kaparo'
  | 'Tapu'

export interface Customer {
  id: string
  name: string
  segment: CustomerSegment
  stage: CustomerStage
  lastContact: string // ISO
  value: number // TL
  source: 'Sahibinden' | 'Hürriyet Emlak' | 'Referans' | 'Sosyal Medya' | 'Walk-in'
  owner: string
  interestArea: string
  notes?: string
  // Wave F2C — typed contact fields. Optional to remain additive (api routes
  // still construct DomainCustomer literals without these); mock seed
  // backfills them so the detail/edit drawer always has data to render.
  phone?: string
  email?: string
}
