// Plans & Pricing

export interface PlatformPlan {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  monthlyPriceTL: number
  yearlyPriceTL: number
  features: string[]
  limits: { listings: number | 'unlimited'; users: number | 'unlimited'; storage_gb: number; api_calls: number }
  activeTenants: number
  mrr: number
}

export const PLANS: PlatformPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPriceTL: 0,
    yearlyPriceTL: 0,
    features: ['1 ilan limiti (3\'e kadar deneme)', '1 kullanıcı', 'Temel arama', 'arsam.net listeleme', 'Topluluk desteği'],
    limits: { listings: 3, users: 1, storage_gb: 1, api_calls: 1000 },
    activeTenants: 2,
    mrr: 0,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceTL: 4900,
    yearlyPriceTL: 49000,
    features: ['50 ilana kadar', '10 kullanıcı', 'Gelişmiş analitik', 'API erişimi', 'Email destek', 'Sahibinden.com sync'],
    limits: { listings: 50, users: 10, storage_gb: 25, api_calls: 100000 },
    activeTenants: 4,
    mrr: 19600,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceTL: 14900,
    yearlyPriceTL: 149000,
    features: ['Sınırsız ilan', 'Sınırsız kullanıcı', 'Custom domain', 'SLA + 7/24 destek', 'Audit log dışa aktarım', 'Compliance pack (KVKK/GDPR)'],
    limits: { listings: 'unlimited', users: 'unlimited', storage_gb: 500, api_calls: 1000000 },
    activeTenants: 2,
    mrr: 29800,
  },
]

// ----------------------------------------------------------------------------
// Plan comparison matrix (Faz 11.9)
// ----------------------------------------------------------------------------
// 4-tier comparison feed for the "Planı değiştir" flow on tenant-detail.
// Kept separate from PLANS so the existing 3-tier route (/plans) is unaffected.
// Names match Tenant.plan capitalisation ('Free'|'Pro'|'Enterprise') so the
// tenant's current plan can be located by string match; 'Starter' is new and
// will appear only in the comparison modal until the wider rollout lands.

export type PlanTierId = 'free' | 'starter' | 'pro' | 'enterprise'
export type PlanTierName = 'Free' | 'Starter' | 'Pro' | 'Enterprise'
export type SupportTier = 'Topluluk' | 'Email' | 'Öncelikli' | '7/24 SLA'
export type SlaTier = '—' | '%99.0' | '%99.5' | '%99.9'

export interface PlanTier {
  id: PlanTierId
  name: PlanTierName
  monthlyPriceTL: number
  /** Listing quota; `'unlimited'` => sınırsız. */
  listingQuota: number | 'unlimited'
  /** User seat quota. */
  userQuota: number | 'unlimited'
  /** Number of sub-tenants (alt-ofis) allowed; 0 for personal tiers. */
  subTenants: number | 'unlimited'
  /** Module bundle size offered. */
  modules: number | 'tümü'
  sla: SlaTier
  support: SupportTier
  /** Optional UX hint for the recommended tier. */
  recommended?: boolean
}

export const PLAN_TIERS: readonly PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPriceTL: 0,
    listingQuota: 3,
    userQuota: 1,
    subTenants: 0,
    modules: 3,
    sla: '—',
    support: 'Topluluk',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceTL: 1900,
    listingQuota: 15,
    userQuota: 3,
    subTenants: 1,
    modules: 8,
    sla: '%99.0',
    support: 'Email',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceTL: 4900,
    listingQuota: 50,
    userQuota: 10,
    subTenants: 5,
    modules: 18,
    sla: '%99.5',
    support: 'Öncelikli',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceTL: 14900,
    listingQuota: 'unlimited',
    userQuota: 'unlimited',
    subTenants: 'unlimited',
    modules: 'tümü',
    sla: '%99.9',
    support: '7/24 SLA',
  },
]

/** Map Tenant.plan ('Free'|'Pro'|'Enterprise') → PlanTierId. */
export function planTierIdFromTenantName(name: string): PlanTierId {
  const normalised = name.trim().toLowerCase()
  if (normalised === 'starter') return 'starter'
  if (normalised === 'pro') return 'pro'
  if (normalised === 'enterprise') return 'enterprise'
  return 'free'
}
