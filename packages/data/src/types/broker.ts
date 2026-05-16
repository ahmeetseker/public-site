/**
 * Broker domain types — Wave F34 / Faz 1B.
 *
 * 3 sub-role hiyerarşisi:
 *   - `broker-admin` → ofisin yöneticisi (ekip yönetir, tüm portföyü görür)
 *   - `broker`       → standart broker (kendi portföyü + atanan lead'ler)
 *   - `broker-agent` → danışman (sadece atanmış lead/listing)
 *
 * Para birimi: tüm `*Amount` alanları **kuruş** (TL × 100). UI tarafında
 * `formatTLCompact` / `formatTL` (`@landx/ui/lib`) ile gösterim yapılır.
 *
 * ID formatı (mock seed'lerde):
 *   - Profile : `BR-USR-001..030`
 *   - Lead    : `BR-LD-0001..1200`
 *   - Client  : `BR-CL-0001..0800`
 *   - Comm.   : `BR-CM-0001..0320`
 *   - Listing : `BR-LST-0001..0480` (broker portfolio)
 *   - Office  : `BR-OFC-001..006`
 *   - Team    : `BR-TM-0001..0030`
 */

export type BrokerSubRole = 'broker' | 'broker-admin' | 'broker-agent'

export interface BrokerProfile {
  id: string
  subRole: BrokerSubRole
  name: string
  email: string
  phone: string
  officeId: string
  officeName: string
  joinedAt: string
  avatar?: string
}

export type BrokerLeadIntent = 'buy' | 'sell' | 'rent'
export type BrokerLeadStatus = 'new' | 'contacted' | 'visit' | 'offer' | 'closed' | 'lost'
export type BrokerLeadTemperature = 'hot' | 'warm' | 'cold'
export type BrokerLeadSource = 'website' | 'phone' | 'referral' | 'social'

export interface BrokerLeadBudget {
  min: number
  max: number
  currency: 'TRY'
}

export interface BrokerLead {
  id: string
  brokerId: string
  clientName: string
  clientPhone: string
  intent: BrokerLeadIntent
  status: BrokerLeadStatus
  /** AI score 0-100 (0 = en soğuk, 100 = en sıcak). */
  aiScore: number
  aiTemperature: BrokerLeadTemperature
  source: BrokerLeadSource
  budget?: BrokerLeadBudget
  preferredRegions?: string[]
  notes: string
  /** ISO 8601. */
  lastActivity: string
  /** ISO 8601. */
  createdAt: string
}

export type BrokerClientType = 'individual' | 'corporate'
export type BrokerClientKvkkAction =
  | 'consent_given'
  | 'data_accessed'
  | 'data_exported'
  | 'data_deleted'

export interface BrokerClientKvkkLog {
  action: BrokerClientKvkkAction
  /** ISO 8601. */
  at: string
  /** Aksiyonu yapan operatör (broker id veya 'system'). */
  actor: string
}

export interface BrokerClient {
  id: string
  brokerId: string
  name: string
  email: string
  phone: string
  taxId?: string
  type: BrokerClientType
  kvkkConsent: boolean
  kvkkLogs: BrokerClientKvkkLog[]
  dealCount: number
  /** ISO 8601. */
  createdAt: string
}

export type BrokerCommissionStatus = 'pending' | 'invoiced' | 'paid' | 'cancelled'

export interface BrokerCommission {
  id: string
  brokerId: string
  dealId: string
  listingId: string
  clientId: string
  /** Kuruş. */
  dealAmount: number
  /** Kuruş. */
  commissionAmount: number
  /** 0-1 arası oran (örn. 0.025 = %2.5). */
  commissionRate: number
  status: BrokerCommissionStatus
  /** ISO 8601, sadece `status === 'paid'` ise dolu. */
  paymentDate?: string
  /** Mock pdf url — `useGenerateCommissionInvoice` doldurur. */
  receiptUrl?: string
  /** ISO 8601. */
  createdAt: string
}

export type BrokerShowcaseSocialPlatform =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'website'

export interface BrokerShowcaseCertificate {
  name: string
  issuer: string
  year: number
}

export interface BrokerShowcaseSocial {
  platform: BrokerShowcaseSocialPlatform
  url: string
}

export interface BrokerShowcase {
  /** Ofis sahibi broker-admin'in id'si. */
  brokerId: string
  /** /ofis/[slug] eşlemesi. */
  slug: string
  coverUrl: string
  logoUrl: string
  bio: string
  certificates: BrokerShowcaseCertificate[]
  socials: BrokerShowcaseSocial[]
  yearsOfExperience: number
  totalDeals: number
  /** 0-5 arası. */
  rating: number
  reviewCount: number
}

export type BrokerPortfolioStatus = 'draft' | 'active' | 'paused' | 'sold' | 'expired'

export interface BrokerPortfolioItem {
  id: string
  brokerId: string
  listingId: string
  status: BrokerPortfolioStatus
  views: number
  inquiries: number
  daysListed: number
  /** ISO 8601. */
  lastEdit: string
}

export interface BrokerKpis {
  brokerId: string
  totalListings: number
  activeListings: number
  monthlyDeals: number
  /** Kuruş. */
  monthlyRevenue: number
  pendingLeads: number
  hotLeads: number
  avgDaysToClose: number
}

export type BrokerTeamStatus = 'active' | 'invited' | 'suspended'

export interface BrokerTeamMember {
  id: string
  /** Bağlı ofisin broker-admin id'si (ofise referans). */
  brokerId: string
  name: string
  email: string
  subRole: BrokerSubRole
  status: BrokerTeamStatus
  /** ISO 8601, status `invited` veya geçmiş davet. */
  invitedAt?: string
  /** ISO 8601, dolu ise üye kabul etti. */
  joinedAt?: string
}
