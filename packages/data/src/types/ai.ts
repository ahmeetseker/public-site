/**
 * AI domain types — Wave F33 / Faz 1A.
 *
 * F33, LandX-main paritesi için AI tooling katmanı: chat / valuation / Q&A /
 * pazar raporu / tapu OCR / akıllı bildirim. Tüm tipler `Ai*` prefix'iyle
 * (collision riski yok) — F32'de yaşadığımız `Plan`/`Transaction` çakışması
 * tekrarlanmasın.
 *
 * Kurallar:
 * - Para birimi: kuruş (`199_00` = 199 TL). UI Intl.NumberFormat ile ₺ formatlar.
 * - Tarih: ISO 8601 string (UTC).
 * - `confidence`, `impact`, `similarity`, `ocrConfidence` 0-1 arası float.
 * - `demandHeat` 0-100 arası integer (UI ısı haritası için).
 *
 * Şema kaynak: docs/superpowers/specs/2026-05-15-landx-parity-3-wave-design.md
 * Bölüm 6.
 */

// ─── Conversations (kullanıcı ↔ asistan chat) ────────────────────────────────

export interface AiToolCall {
  /** Tool adı (örn. `search_listings`, `get_valuation`, `read_tapu`). */
  name: string
  /** Çağrı argümanları — şema tool'a göre değişir. */
  args: Record<string, unknown>
  /** Tool sonucu — opsiyonel (henüz tamamlanmamış olabilir). */
  result?: unknown
}

export type AiMessageRole = 'user' | 'assistant' | 'system'

export interface AiMessage {
  role: AiMessageRole
  content: string
  /** Assistant mesajlarında tool çağrıları. */
  toolCalls?: AiToolCall[]
  /** ISO 8601. */
  createdAt: string
}

export interface AiConversation {
  id: string
  userId: string
  /** İlk kullanıcı mesajından üretilen başlık (~40 karakter). */
  title: string
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601 — son mesaj eklenince güncellenir. */
  updatedAt: string
  messages: AiMessage[]
}

// ─── AI Valuation (ilan fiyat tahmini) ───────────────────────────────────────

export interface AiValuationFactor {
  /** Türkçe etiket (örn. "Bölge talep trendi"). */
  name: string
  /** -1..1 arası — negatif fiyatı düşürür, pozitif yükseltir. */
  impact: number
  /** Açıklama (UI tooltip / breakdown listesi). */
  description: string
}

export interface AiValuationComparable {
  /** Mevcut LISTINGS mock'undaki ilan id. */
  listingId: string
  /** 0-1 arası benzerlik skoru. */
  similarity: number
  /** Kuruş cinsinden satış fiyatı. */
  price: number
}

export interface AiValuation {
  /** Hedef ilanın id'si — `LISTINGS` mock'undan. */
  listingId: string
  /** Kuruş cinsinden tahmini değer (orta nokta). */
  estimate: number
  /** Min/max kuruş aralığı — `[lo, hi]`. */
  range: [number, number]
  /** 0-1 arası model güven skoru. */
  confidence: number
  /** 4-7 faktör — UI breakdown. */
  factors: AiValuationFactor[]
  /** 3-5 karşılaştırılabilir ilan. */
  comparables: AiValuationComparable[]
  /** ISO 8601. */
  generatedAt: string
}

// ─── AI Q&A (ilan sayfası soru-cevap) ────────────────────────────────────────

/**
 * `null` = satıcı henüz karar vermedi (pending),
 * `true` = onaylandı (alıcıya gösterilir),
 * `false` = reddedildi (gizlenir).
 */
export type SellerApprovalState = boolean | null

export interface AiQaThread {
  id: string
  /** İlan id — `LISTINGS` mock'undan. */
  listingId: string
  /** Soruyu soran (alıcı) kullanıcı id. */
  userId: string
  question: string
  /** AI tarafından üretilen ön-cevap (satıcı düzenleyebilir). */
  aiAnswer: string
  /** Satıcı onayı durumu. */
  sellerApproved: SellerApprovalState
  /** Satıcı opsiyonel notu / düzeltmesi. */
  sellerNote?: string
  /** ISO 8601 — soru oluşturma zamanı. */
  createdAt: string
  /** ISO 8601 — onay/red zamanı (varsa). */
  approvedAt?: string
}

// ─── Market Report (bölge AI özet) ───────────────────────────────────────────

export interface MarketTrendPoint {
  /** ISO 8601 (date kısmı). */
  date: string
  /** Kuruş cinsinden ortalama m² birim fiyat. */
  price: number
  /** Aktif ilan sayısı / işlem hacmi. */
  volume: number
}

export interface MarketReport {
  /** REGIONS mock'undaki slug (örn. `cesme`, `ayvalik`). */
  regionSlug: string
  /** Son 30 gün — günlük nokta. */
  trend: MarketTrendPoint[]
  /** 0-100 arası talep ısısı. */
  demandHeat: number
  /** 3-5 cümlelik AI özet (Türkçe). */
  aiSummary: string
  /** Üst 3 risk maddesi. */
  topRisks: string[]
  /** Üst 3 fırsat maddesi. */
  topOpportunities: string[]
  /** ISO 8601. */
  generatedAt: string
}

// ─── Tapu OCR Extract ────────────────────────────────────────────────────────

export type TapuRiskType = 'ipotek' | 'haciz' | 'serh' | 'temiz'
export type TapuRiskSeverity = 'low' | 'med' | 'high'

export interface TapuRisk {
  type: TapuRiskType
  severity: TapuRiskSeverity
  /** Türkçe açıklama (örn. "Garanti BBVA lehine 1.2M TL ipotek"). */
  note: string
}

export interface TapuExtract {
  id: string
  listingId: string
  /** Ada numarası. */
  ada: string
  /** Parsel numarası. */
  parsel: string
  /** m² alan. */
  alan: number
  /** Cins (örn. `arsa`, `tarla`, `bahçe`). */
  cins: string
  /** İmar durumu (örn. "Konut + ticari, E:1.20"). */
  imarDurumu: string
  risks: TapuRisk[]
  /** 0-1 arası OCR güven skoru. */
  ocrConfidence: number
  /** ISO 8601. */
  uploadedAt: string
}

// ─── AI Notification Preferences ─────────────────────────────────────────────

export type AiNotificationPriority = 'critical' | 'normal' | 'low'
export type AiNotificationChannel = 'email' | 'push' | 'sms'

export interface AiNotificationEventPref {
  aiPriority: AiNotificationPriority
  channels: AiNotificationChannel[]
}

export interface AiNotificationQuietHours {
  /** "HH:MM" — örn. "23:00". */
  from: string
  /** "HH:MM" — örn. "07:00". */
  to: string
}

export interface AiNotificationPref {
  userId: string
  /** AI hangi saatte gönderileceğine karar versin mi. */
  smartTimingEnabled: boolean
  quietHours: AiNotificationQuietHours
  /** Event tipi -> tercih. Anahtarlar serbest string (yeni event eklenince schema değişmesin). */
  perEvent: Record<string, AiNotificationEventPref>
}
