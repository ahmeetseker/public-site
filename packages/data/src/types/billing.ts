/**
 * Billing domain types — Wave F32 (arsam parity / CRUD pages).
 *
 * Para birimi: tüm `amount` alanları **kuruş** cinsinden integer
 * (örn. `199_00` = 199.00 TL). UI Intl.NumberFormat ile ₺ formatlar.
 * Tarih: ISO 8601 string (UTC).
 *
 * Şema kaynak: docs/superpowers/specs/2026-05-15-arsam-parity-crud-pages-design.md
 * Bölüm 6.
 */

// ─── Plans (premium membership) ──────────────────────────────────────────────

/**
 * `BillingPlanTier` — bireysel/atolye üyelik kademeleri.
 * Not: ad bilinçli olarak `BillingPlanTier`. Mevcut `mock/platform/plans.ts`
 * içinde super-admin için ayrı bir `PlanTier` interface'i var (cross-tenant
 * SaaS plan tanımı). İkisini karıştırma.
 */
export type BillingPlanTier = 'free' | 'plus' | 'pro' | 'business'

export interface PlanFeature {
  /** Türkçe etiket (örn. "Aylık 10 ilan"). */
  label: string
  /** İçerikte var mı? — `false` ise üstü çizili göster. */
  included: boolean
}

export interface Plan {
  id: string
  tier: BillingPlanTier
  name: string
  /** Aylık fiyat — kuruş. `0` = ücretsiz. */
  monthlyPrice: number
  /** Yıllık fiyat — kuruş. Aylığa göre indirimli olabilir. */
  yearlyPrice: number
  currency: 'TRY'
  features: PlanFeature[]
  /** UI'de "popüler" rozeti. */
  highlighted?: boolean
  /** Pazarlama özet metni. */
  tagline?: string
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentMethod = 'card' | 'bank' | 'wallet'

export interface Payment {
  id: string
  userId: string
  /** Kuruş cinsinden tutar (örn. 199_00 = 199 TL). */
  amount: number
  currency: 'TRY'
  status: PaymentStatus
  method: PaymentMethod
  description: string
  /** ISO 8601. */
  createdAt: string
  invoiceId?: string
  /** Cross-tenant analizler için (super-admin /payments). */
  tenantId?: string
  /** Maskelenmiş kart bilgisi (örn. "**** 4242"). */
  cardMasked?: string
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  name: string
  qty: number
  /** Birim fiyat — kuruş. */
  unitPrice: number
}

export interface Invoice {
  id: string
  paymentId: string
  /** İnsan-okuyabilir fatura no (INV-2026-0001). */
  number: string
  /** KDV oranı (örn. 0.20 = %20). */
  vatRate: number
  lineItems: InvoiceLineItem[]
  /** ISO 8601. */
  issuedAt: string
  /** Toplamlar — UI hesaplamayı tekrar etmesin. Kuruş. */
  subtotal: number
  vatAmount: number
  total: number
  /** Faturayı kim adına kesildi. */
  buyerName: string
  buyerTaxId?: string
}

// ─── Transactions (kredi geçmişi / wallet hareketi) ──────────────────────────

/**
 * Kredi/cüzdan işlem tipi. Adı bilinçli olarak `WalletTransaction` —
 * mevcut `mock/finance.ts` içinde ofis CRM finansal kayıtları için ayrı
 * bir `Transaction` interface'i var (Tahsilat/Komisyon/Gider/Vergi).
 * Bu domain bireysel kullanıcı kredi geçmişi.
 */
export type WalletTransactionType = 'credit' | 'debit'
export type WalletTransactionReason =
  | 'listing_publish'
  | 'listing_boost'
  | 'subscription'
  | 'refund'
  | 'topup'

export interface WalletTransaction {
  id: string
  userId: string
  type: WalletTransactionType
  /** Kredi tutarı (kuruş cinsinden değil — buradaki "amount" kredi adedi). */
  amount: number
  reason: WalletTransactionReason
  /** İşlem sonrası kalan bakiye. */
  balanceAfter: number
  /** ISO 8601. */
  createdAt: string
  /** İlgili ilan (varsa). */
  relatedListingId?: string
  description?: string
}

// ─── Office subscription (atolye-admin) ──────────────────────────────────────

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial'
export type SubscriptionCycle = 'monthly' | 'yearly'

export interface OfficeSubscription {
  id: string
  officeId: string
  planId: string
  planName: string
  status: SubscriptionStatus
  cycle: SubscriptionCycle
  /** Çalışan kotası (atolye Pro = 5). */
  seats: number
  /** Doluluk — UI usage barı için. */
  seatsUsed: number
  /** Kuruş — bir sonraki ödeme tutarı. */
  nextChargeAmount: number
  /** ISO. */
  nextChargeAt: string
  /** ISO. */
  startedAt: string
  /** ISO — iptal/dondurma sonrası bitiş. */
  endsAt?: string
}

// ─── Billing profile (atolye-admin: vergi & adres) ───────────────────────────

export interface BillingProfile {
  id: string
  officeId: string
  /** Şirket unvanı. */
  legalName: string
  taxId: string
  taxOffice: string
  /** KEP adresi (e-fatura gönderimi için). */
  kepAddress?: string
  address: string
  city: string
  district: string
  zipCode?: string
  /** Fatura iletişim e-postası. */
  email: string
  phone?: string
}

// ─── Refund queue (super-admin) ──────────────────────────────────────────────

export type RefundStatus = 'pending' | 'approved' | 'rejected'

export interface RefundRequest {
  id: string
  paymentId: string
  userId: string
  /** Kuruş — talep edilen iade tutarı (kısmi iade olabilir). */
  amount: number
  reason: string
  status: RefundStatus
  /** ISO. */
  requestedAt: string
  /** ISO — onay/red zamanı. */
  resolvedAt?: string
  /** Kim karar verdi (super-admin operatörü). */
  resolvedBy?: string
  /** Red gerekçesi veya onay notu. */
  resolutionNote?: string
}
