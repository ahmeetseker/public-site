/**
 * Listing Detail (12-bölüm mockup pariteli) — Wave F37 / Faz 1.
 *
 * `remixed-1848500f.html` (2431 LOC, "Urla Yağcılar" tarla ilanı) mockup'ından
 * türetilmiş extended domain tipleri. F33 `Ai*` (valuation/QA/chat),
 * F34 `Broker*`, F35 `Admin*`/`Agent*` ile collision yok — bu wave'in
 * prefix'leri: `Listing*`, `Encumbrance`, `ImarPlan`, `Farmland*`,
 * `Hazard*`, `Environment*`, `Verification*`, `CompareSnapshot`.
 *
 * Kurallar (F33 ile aynı):
 * - Para birimi: kuruş (`199_00` = 199 TL). UI Intl.NumberFormat ile ₺ formatlar.
 * - Tarih: ISO 8601 string (UTC).
 * - Skor alanları (verim, hazard, walk score) 0-100 arası integer.
 * - PGA (deprem) g cinsinden float (örn. 0.32 g).
 *
 * Şema kaynak: docs/superpowers/specs/2026-05-16-listing-detail-f37-design.md
 * Bölüm 6.
 */

// ─── Verifikasyon Rozeti ─────────────────────────────────────────────────────

/**
 * 8 kaynak: TKGM (tapu), Belediye (1/1000 plan), Drone (konum doğrulama),
 * Tarım Bakanlığı (vasıf), AFAD (deprem), MTA (jeoloji/fay), DSİ (su
 * kaynakları), MGM (iklim).
 */
export type VerificationSource =
  | 'TKGM'
  | 'BELEDIYE'
  | 'DRONE'
  | 'TARIM_BAKANLIGI'
  | 'AFAD'
  | 'MTA'
  | 'DSI'
  | 'MGM'

export interface VerificationBadge {
  id: string
  source: VerificationSource
  /** Türkçe etiket — UI'da rozet üstünde. */
  label: string
  /** ISO 8601 — son doğrulama tarihi. */
  verifiedAt: string
}

// ─── Listing Extension (TKGM kimlik kartı + B bölümü) ────────────────────────

export type MulkiyetTipi = 'mustakil' | 'hisseli'

export type ListingVasfi = 'arsa' | 'tarla' | 'bag' | 'bahce' | 'zeytinlik'

export type ToprakSinifi = 'marjinal' | 'verimli' | 'cok_verimli'

export interface ListingYuzolcumu {
  /** Tapuda yazılı m². */
  tapu: number
  /** Aplikasyon (yerinde ölçüm) m². */
  aplikasyon: number
  /** İki ölçüm arasındaki fark % (positive = aplikasyon büyük, negative = küçük). */
  sapmaPct: number
}

export interface ListingCephe {
  /** Yol türü (örn. "asfalt", "stabilize"). */
  yol: string
  /** Cephe uzunluğu (metre). */
  uzunluk: number
}

export interface ListingExtended {
  /** Mevcut LISTINGS mock'undaki ilan id. */
  listingId: string
  /** TKGM ada numarası. */
  ada: string
  /** TKGM parsel numarası. */
  parsel: string
  /** TKGM pafta numarası. */
  pafta: string
  mulkiyetTipi: MulkiyetTipi
  /** Hisseli ise pay (örn. "1/4" → 0.25). Müstakil için undefined. */
  hisseOrani?: number
  /** Hisseli ise toplam hissedar sayısı. */
  hissedarSayisi?: number
  /** İfraz mümkün mü (parselin bölünebilir olması). */
  ifrazMumkun: boolean
  yuzolcumu: ListingYuzolcumu
  cephe?: ListingCephe
  /** Eğim yüzdesi (0-100, tipik 0-30). */
  egim: number
  vasfi: ListingVasfi
  /** Sadece tarla/bağ/bahçe/zeytinlik için anlamlı. */
  toprakSinifi?: ToprakSinifi
  badges: VerificationBadge[]
}

// ─── Hukuki Şerh (E bölümü, 3 renk: temiz/dikkat/kritik) ─────────────────────

/**
 * 3 kategori (mockup paritesi):
 * - `temiz` (yeşil): herhangi bir kısıtlayıcı kayıt yok
 * - `dikkat` (kehribar): bilgi amaçlı (örn. geçit hakkı, tarımsal şerh)
 * - `kritik` (kırmızı): satışı engelleyici (haciz, ipotek, kamulaştırma)
 */
export type EncumbranceCategory = 'temiz' | 'dikkat' | 'kritik'

export interface Encumbrance {
  id: string
  /** İlişkili LISTINGS mock id. */
  listingId: string
  category: EncumbranceCategory
  /** TKGM tipi (örn. "haciz", "intifa", "gecit_hakki", "kamulasturma"). */
  type: string
  /** Türkçe açıklama. */
  description: string
  /** Hukuki referans (örn. "5403 sayılı kanun", "2942 sayılı kanun"). */
  legalReference?: string
  /** ISO 8601. */
  verifiedAt: string
}

// ─── İmar Planı (F bölümü, KAKS/TAKS/çekme/kullanım) ─────────────────────────

export interface ImarCekme {
  /** Ön çekme metre. */
  on: number
  /** Yan çekme metre. */
  yan: number
  /** Arka çekme metre. */
  arka: number
}

export interface ImarPlan {
  /** İlişkili LISTINGS mock id. */
  listingId: string
  /** Kat Alanı Katsayısı (E). 0.4-2.0 arası. */
  kaks: number
  /** Taban Alanı Katsayısı. 0.15-0.5 arası. */
  taks: number
  /** Maksimum kat sayısı. */
  maxKat: number
  cekme: ImarCekme
  /** Çatı eğimi maksimum yüzde. */
  catiEgimiMaxPct: number
  /** Kullanım sınıfı (örn. "konut", "konut+ticari", "sanayi", "tarım"). */
  kullanim: string
  /** Plan notu (TR cümle). */
  planNotu: string
  /** İnşaat hakkı = yüzölçümü × KAKS (m²). */
  insaatHakki: number
  /** AI tarafından üretilen 2-3 cümle TR açıklama. */
  llmAciklama: string
}

// ─── Tarla Modülü (G bölümü, sadece tarla/bağ vasıflı listing'ler) ───────────

export type SulamaTipi = 'dsi' | 'kuyu' | 'dsi_disi'

export type FarmlandToprak = 'marjinal_kuru' | 'verimli' | 'cok_verimli'

export interface FarmlandIklim {
  /** 30 yıllık ortalama yıllık yağış (mm). */
  yagis: number
  /** Yıllık ortalama don günü sayısı. */
  donGun: number
  /** Growing Degree Days (1500-2800 tipik). */
  gdd: number
}

export interface FarmlandEkim {
  yil: number
  /** Ürün adı (örn. "Buğday", "Arpa", "Ayçiçeği", "Nadas"). */
  urun: string
}

export interface FarmlandYatirim {
  urun: string
  /** Yıllık net gelir min (kuruş). */
  minGelir: number
  /** Yıllık net gelir max (kuruş). */
  maxGelir: number
}

export interface FarmlandData {
  listingId: string
  toprakSinifi: FarmlandToprak
  /** 0-100 arası verim skoru. */
  verimSkoru: number
  sulama: SulamaTipi
  /** Kuyu mesafesi metre (sulama=kuyu için). */
  kuyuMesafe?: number
  /** En yakın dere mesafesi metre. */
  dereMesafe?: number
  iklim: FarmlandIklim
  /** Bağ evi inşa izni mümkün mü (5403'e göre). */
  bagEviIzin: boolean
  /** İzin verilen bağ evi yüzdesi (örn. 5 = parselin %5'i). */
  bagEviIzinPct?: number
  /** Sentinel-2 mock — son 5 yıl ekim rotasyonu. */
  ekimGecmisi: FarmlandEkim[]
  /** Yatırım hesaplayıcı — 3-4 ürün tahmini. */
  yatirimHesap: FarmlandYatirim[]
}

// ─── Afet Risk Skoru (H bölümü, 6 axis radar) ────────────────────────────────

export type ZeminSinifi = 'ZA' | 'ZB' | 'ZC' | 'ZD' | 'ZE'

export interface HazardDeprem {
  /** Peak Ground Acceleration (g). 0.15-0.55 tipik. */
  pga: number
  /** Dönem yıl (475 standart). */
  donemYil: number
  /** 0-100 normalize skor. */
  skor: number
}

export interface HazardScores {
  deprem: HazardDeprem
  /** En yakın diri faya mesafe (km). */
  fayMesafeKm: number
  /** Fay zonu adı (örn. "DAFZ", "KAFZ", "EAF"). */
  fayBolge: string
  zeminSinifi: ZeminSinifi
  /** 0-100 arası sel riski. */
  selSkor: number
  /** 0-100 arası heyelan riski. */
  heyelanSkor: number
  /** 0-100 arası orman yangını riski. */
  yanginSkor: number
  /** 0-100 arası kuraklık riski. */
  kuraklikSkor: number
}

export interface HazardScore {
  listingId: string
  scores: HazardScores
  /** Kaynak kurum citation listesi (örn. ["AFAD", "MTA", "DSİ", "MGM"]). */
  kaynaklar: string[]
}

// ─── Çevre & POI (I bölümü) ──────────────────────────────────────────────────

export interface EnvironmentPoiItem {
  /** POI tipi (örn. "hastane", "ilkokul", "market", "eczane", "yht", "metro"). */
  type: string
  /** Görünen ad (örn. "Urla Devlet Hastanesi"). */
  label: string
  /** Mesafe (km, yolla). */
  distance: number
  /** Planlı yatırım mı (henüz açılmamış). */
  future?: boolean
  /** Planlı açılış tarihi (ISO date veya yıl string). */
  futureDate?: string
}

export interface EnvironmentPoi {
  listingId: string
  /** Walk Score (0-100). */
  walkScore: number
  /** Transit Score (0-100). */
  transitScore: number
  /** Bike Score (0-100). */
  bikeScore: number
  /** 4-7 POI + opsiyonel future ekler. */
  poi: EnvironmentPoiItem[]
}

// ─── AI Chat (J bölümü, RAG-vari) ────────────────────────────────────────────

export type ListingChatRole = 'user' | 'assistant'

export interface ListingChatMessage {
  role: ListingChatRole
  content: string
  /** Kaynak alıntıları (RAG citation, opsiyonel). */
  sources?: string[]
  /** ISO 8601. */
  createdAt: string
}

export interface ListingChatThread {
  id: string
  /** İlişkili LISTINGS mock id. */
  listingId: string
  messages: ListingChatMessage[]
  /** 6 default chip prompt — UI'da quick-action olarak gösterilir. */
  suggestedPrompts: string[]
}

// ─── Compare Snapshot (K bölümü, sayfa-içi 3-sütun) ──────────────────────────

export type CompareTone = 'good' | 'warn' | 'risk'

export interface CompareRow {
  /** Satır etiketi (örn. "Yüzölçümü", "₺/m²", "İmar"). */
  metric: string
  /** Bu listing değeri (formatted string). */
  thisValue: string
  /** Karşılaştırma 1 değeri. */
  comp1Value: string
  /** Karşılaştırma 2 değeri. */
  comp2Value: string
  thisTone?: CompareTone
  comp1Tone?: CompareTone
  comp2Tone?: CompareTone
}

export interface CompareSnapshot {
  thisListingId: string
  comparison1Id: string
  comparison2Id: string
  /** 6 satır (yüzölçümü, ₺/m², mülkiyet, imar, risk, AI değer farkı). */
  rows: CompareRow[]
}
