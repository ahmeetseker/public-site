/**
 * Identity domain types — Wave F32.
 *
 * Bireysel doğrulama (email/tel/kimlik), kurumsal doğrulama (KEP/vergi/broker),
 * KYC review queue (super-admin), bildirim tercih matrisi (kanal × olay tipi).
 */

// ─── Verification (bireysel kullanıcı) ───────────────────────────────────────

export type VerificationType = 'email' | 'phone' | 'identity'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface VerificationRequest {
  id: string
  userId: string
  type: VerificationType
  status: VerificationStatus
  /** ISO 8601. */
  sentAt: string
  /** ISO — tamamlanma. */
  verifiedAt?: string
  /** Reddedildiyse gerekçe. */
  rejectionReason?: string
  /** Hedef değer — maskelenmiş (örn. "ah***@gmail.com" / "+90 *** *** 12 34"). */
  targetMasked?: string
}

// ─── Notification preferences ────────────────────────────────────────────────

/**
 * `NotificationEventType` — bildirim tercih matrisi olay tipi.
 * Adı bilinçli olarak `NotificationEventType` — mevcut `mock/calendar.ts`
 * içinde takvim olayı için ayrı bir `EventType` var (visit/deed/task/...).
 */
export type NotificationEventType =
  | 'new_message'
  | 'listing_view'
  | 'price_change'
  | 'favorite'
  | 'appointment'
  | 'offer'
  | 'payment'
  | 'security'

export type NotificationChannel = 'email' | 'push' | 'sms'

export type NotificationChannelMatrix = Record<NotificationChannel, boolean>

export interface NotificationPrefs {
  userId: string
  /** Olay tipi → kanal seçimi matrisi. */
  matrix: Record<NotificationEventType, NotificationChannelMatrix>
  /** Saat bazlı sessiz aralık (varsa, "22:00-08:00" formatı). */
  quietHours?: string
}

// ─── Public profile (bireysel) ───────────────────────────────────────────────

export interface PublicProfileListingSummary {
  id: string
  title: string
  city: string
  district: string
  /** TL — sahibinden tarzı görünüm. */
  price: number
  thumbnail?: string
}

export interface PublicProfileReview {
  id: string
  /** 1-5 puan. */
  rating: number
  comment: string
  authorName: string
  /** ISO 8601. */
  at: string
}

export interface PublicProfile {
  username: string
  displayName: string
  avatar?: string
  /** ISO 8601 — kayıt tarihi. */
  memberSince: string
  /** Ortalama puan (1-5). */
  rating: number
  reviewCount: number
  activeListings: number
  bio?: string
  city?: string
  /** Doğrulanmış ilan sahibi mi. */
  verified: boolean
  listings: PublicProfileListingSummary[]
  reviews: PublicProfileReview[]
}

// ─── Office verification (atolye-admin) ──────────────────────────────────────

export type OfficeVerificationDocType =
  | 'kep_address'
  | 'tax_certificate'
  | 'broker_license'
  | 'trade_registry'

export type OfficeVerificationDocStatus = 'pending' | 'approved' | 'rejected'

export interface OfficeVerificationDoc {
  id: string
  type: OfficeVerificationDocType
  /** Görünür dosya adı (mock — gerçek file yok). */
  fileName: string
  status: OfficeVerificationDocStatus
  /** ISO 8601. */
  uploadedAt: string
  /** ISO — onay/red zamanı. */
  reviewedAt?: string
  rejectionReason?: string
}

export interface OfficeVerification {
  id: string
  officeId: string
  /** Genel durum — tüm belgeler onaylı mı. */
  overallStatus: 'incomplete' | 'pending_review' | 'verified' | 'rejected'
  documents: OfficeVerificationDoc[]
  /** ISO 8601 — son güncelleme. */
  updatedAt: string
}

// ─── KYC review queue (super-admin cross-tenant) ─────────────────────────────

export type KycSubjectKind = 'individual' | 'office'
export type KycReviewStatus = 'pending' | 'approved' | 'rejected'

export interface KycReviewItem {
  id: string
  kind: KycSubjectKind
  /** Bireysel için userId, kurumsal için officeId. */
  subjectId: string
  /** Görünür ad (UI'de listelemek için). */
  subjectName: string
  /** Tenant scope. */
  tenantId?: string
  status: KycReviewStatus
  /** ISO 8601. */
  submittedAt: string
  /** Yüklenmiş belge sayısı. */
  documentCount: number
  /** ISO — karar zamanı. */
  resolvedAt?: string
  resolvedBy?: string
  rejectionReason?: string
}
