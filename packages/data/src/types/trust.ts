/**
 * Trust & Safety domain types — Wave F32.
 *
 * Şikayet (Report) → Anlaşmazlık (Dispute) → Bilet (SupportTicket) zinciri.
 * Moderation queue super-admin tarafında cross-tenant tüm şikayetleri görür.
 */

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export type FaqCategory =
  | 'hesap'
  | 'odeme'
  | 'ilan'
  | 'guvenlik'
  | 'iletisim'
  | 'genel'

export interface FaqEntry {
  id: string
  category: FaqCategory
  question: string
  answer: string
  /** Sıralama önceliği (yüksek = üstte). */
  order: number
  /** İlişkili rehber slug'ı (varsa derinlemesine link). */
  relatedGuideSlug?: string
}

// ─── Disputes (anlaşmazlık — kullanıcı vs. kullanıcı/ilan) ───────────────────

export type DisputeCategory = 'fraud' | 'inappropriate' | 'incorrect' | 'other'
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected'

export interface DisputeUpdate {
  author: 'user' | 'support'
  text: string
  /** ISO 8601. */
  at: string
}

export interface Dispute {
  id: string
  userId: string
  /** Şikayet edilen ilan (varsa). */
  listingId?: string
  /** Şikayet edilen karşı kullanıcı (varsa — kullanıcı vs. kullanıcı). */
  counterpartyId?: string
  category: DisputeCategory
  description: string
  status: DisputeStatus
  /** ISO 8601. */
  createdAt: string
  updates: DisputeUpdate[]
  /** Tenant scope — super-admin cross-tenant filtre için. */
  tenantId?: string
}

// ─── Reports (anonim ilan şikayet) ───────────────────────────────────────────

export type ReportReason =
  | 'fake_listing'
  | 'wrong_price'
  | 'wrong_location'
  | 'duplicate'
  | 'inappropriate_content'
  | 'fraud_attempt'
  | 'other'

export type ReportStatus = 'new' | 'in_review' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  /** Şikayet edilen ilan. */
  listingId: string
  /** Anonim olabilir (giriş yapmamış kullanıcı). */
  reporterId?: string
  reason: ReportReason
  description?: string
  /** İletişim için (opsiyonel). */
  contactEmail?: string
  status: ReportStatus
  /** ISO 8601. */
  createdAt: string
  /** Kim moderasyondan çekti (super-admin). */
  assignedTo?: string
  resolvedAt?: string
  resolutionNote?: string
}

// ─── Support tickets ─────────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'pending' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketMessage {
  id: string
  author: 'user' | 'support' | 'system'
  /** Mesaj gönderen adı (UI'de göstermek için). */
  authorName: string
  text: string
  /** ISO 8601. */
  at: string
  /** Eklenti sayısı (file mock — gerçek upload yok). */
  attachmentCount?: number
}

export interface SupportTicket {
  id: string
  userId: string
  subject: string
  category: FaqCategory
  status: TicketStatus
  priority: TicketPriority
  /** ISO 8601. */
  createdAt: string
  updatedAt: string
  closedAt?: string
  messages: TicketMessage[]
}

// ─── Moderation queue (super-admin cross-tenant) ─────────────────────────────

export type ModerationItemKind = 'report' | 'dispute' | 'flagged_listing' | 'user_flag'
export type ModerationStatus = 'queued' | 'in_review' | 'resolved' | 'dismissed'

export interface ModerationItem {
  id: string
  kind: ModerationItemKind
  /** İlgili kayıt id'si — `report.id` / `dispute.id` / `listing.id`. */
  refId: string
  /** Tenant scope — super-admin cross-tenant filtreleme. */
  tenantId: string
  /** Şikayet kısa özet — listede görünür. */
  summary: string
  /** Otomatik kategori (UI rozet rengi). */
  severity: 'low' | 'medium' | 'high'
  status: ModerationStatus
  /** ISO 8601. */
  createdAt: string
  assignedTo?: string
  resolvedAt?: string
  resolutionNote?: string
}
