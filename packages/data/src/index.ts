// Domain types (entities)
export * from './mock/types'

// Mock data — Faz 3+'ta gerçek API ile değiştirilecek
export * from './mock/listings'
export { LISTINGS_V2 } from './mock/listings-extended-v2'
export * from './mock/customers'
export * from './mock/finance'
export * from './mock/calendar'
export * from './mock/reports'
export * from './mock/sales'
export * from './mock/messages'
export * from './mock/profile'
export * from './mock/offices'
export * from './mock/regions'

// Platform mocks (super-admin scope — cross-tenant)
export * from './mock/platform'

// Buyer mock (public-site /hesabim scope)
export * from './mock/buyer'

// Notifications (admin scope — Wave F3 / Agent-F3C)
export * from './mock/notifications'

// TanStack Query
export { queryClient } from './query/client'
export * from './query/keys'

// Query hooks
export * from './query/listings'
export * from './query/customers'
export * from './query/sales'
export * from './query/finance'
export * from './query/reports'
export * from './query/calendar'
export * from './query/messages'
export * from './query/profile'
export * from './query/offices'
export * from './query/regions'
export * from './query/platform'
export * from './query/notifications'

// HTTP API client (Faz 12.6 / Wave 15) — apps configure via configureApi()
export * from './api'

// ─── Wave F32 / Faz 1 — Arsam parity CRUD altyapısı ────────────────────────
//
// Yeni: localStorage adapter + 4 domain (billing/trust/identity/content).
// Mevcut export'ları DEĞİŞTİRMEZ — sadece ekler. Faz 2 paralel agent'lar
// (W1A/W1B/W1C/W2A/W2B/W3/W4) buradan tüketir.

// CRUD adapter — SSR-safe localStorage CRUD factory
export * from './adapters/local-storage'

// Domain types (type-only — verbatimModuleSyntax uyumlu)
export type * from './types/billing'
export type * from './types/trust'
export type * from './types/identity'
export type * from './types/content'

// Mock seeds — apps doğrudan import edebilir (preview/seed/test için)
export * from './mock/billing-payments'
export * from './mock/billing-invoices'
export * from './mock/billing-transactions'
export * from './mock/billing-office'
export * from './mock/billing-platform'
export * from './mock/trust-disputes'
export * from './mock/trust-platform'
export * from './mock/identity'
export * from './mock/content'

// Query hooks
export * from './query/billing-hooks'
export * from './query/trust-hooks'
export * from './query/identity-hooks'
export * from './query/content-hooks'

// ─── Wave F33 / Faz 1A — AI domain (LandX-main paritesi) ────────────────────
//
// AI tooling katmanı: chat / valuation / Q&A / pazar raporu / tapu OCR /
// akıllı bildirim. Tipler `Ai*` prefix ile (collision yok). F33 Faz 2'nin
// (4 route + 4 widget) altyapısı.

// Domain types (type-only — verbatimModuleSyntax uyumlu)
export type * from './types/ai'

// Mock seeds — apps doğrudan import edebilir (preview/seed/test için)
export { AI_CONVERSATIONS } from './mock/ai-conversations'
export { AI_VALUATIONS } from './mock/ai-valuations'
export { AI_QA_THREADS } from './mock/ai-qa-threads'
export { MARKET_REPORTS } from './mock/market-reports'
export { TAPU_EXTRACTS } from './mock/tapu-extracts'
export { AI_NOTIFICATION_PREFS_DEFAULT } from './mock/ai-notification-prefs'

// Helpers (mock yanıt üretici, deterministik valuation, delay)
export { generateMockResponse, generateValuation, delay } from './lib/ai-helpers'

// Query hooks
export * from './query/ai-hooks'

// ─── Wave F34 / Faz 1B — Broker domain (LandX-main paritesi) ────────────────
//
// 3 sub-role hiyerarşisi (broker/broker-admin/broker-agent) + portföy/lead/
// client/komisyon/vitrin/ekip mock'ları. apps/broker-admin Faz 2'de bu
// hooks'ları tüketir.

// Domain types (type-only — verbatimModuleSyntax uyumlu)
export type * from './types/broker'

// Mock seeds — apps doğrudan import edebilir (preview/seed/test için)
export { BROKER_PROFILES, BROKER_OFFICES } from './mock/broker-profiles'
export { BROKER_LEADS } from './mock/broker-leads'
export { BROKER_CLIENTS } from './mock/broker-clients'
export { BROKER_COMMISSIONS } from './mock/broker-commissions'
export { BROKER_SHOWCASES } from './mock/broker-showcases'
export { BROKER_PORTFOLIO } from './mock/broker-portfolio'
export { BROKER_TEAM } from './mock/broker-team'

// Query hooks
export * from './query/broker-hooks'

// ─── Wave F35 / Faz 1C — Admin / Agent domain ───────────────────────────────
//
// super-admin scope: API explorer + SLO + audit chain + orchestration.
// agent scope (super-admin /agent-memory): memory layers + traces + workflow
// runs (plan/execute/reflect). Tipler `Admin*` ve `Agent*` prefix'leriyle —
// F33 (`Ai*`) ve F34 (`Broker*`) ile collision yok.

// Domain types (type-only — verbatimModuleSyntax uyumlu)
export type * from './types/admin-agent'

// Mock seeds — apps doğrudan import edebilir (preview/seed/test için)
export { ADMIN_API_ENDPOINTS } from './mock/admin-api-endpoints'
export { ADMIN_SLO_METRICS } from './mock/admin-slo'
export { ADMIN_AUDIT_CHAIN, mockHash } from './mock/admin-audit-chain'
export { ADMIN_WORKFLOWS } from './mock/admin-workflows'
export { AGENT_MEMORY_LAYERS } from './mock/agent-memory'
export { AGENT_TRACES } from './mock/agent-traces'
export { AGENT_WORKFLOW_RUNS } from './mock/agent-workflow-runs'

// Query hooks (admin + agent tools)
export * from './query/agent-tools-hooks'

// ─── Wave F37 / Faz 1 — Listing Detail (mockup pariteli 12 bölüm) ────────────
//
// `remixed-1848500f.html` (2431 LOC, "Urla Yağcılar") mockup'ından türetilmiş
// extended domain. 8 type + 7 mock seed + 12 hook. F37 Faz 2 (4 paralel agent)
// bu altyapıyı tüketir. Type prefix'leri: Listing*, Encumbrance, ImarPlan,
// Farmland*, Hazard*, Environment*, Verification*, CompareSnapshot —
// F33 (`Ai*`), F34 (`Broker*`), F35 (`Admin*`/`Agent*`) ile collision yok.

// Domain types (type-only — verbatimModuleSyntax uyumlu)
export type * from './types/listing-detail'

// Mock seeds — apps doğrudan import edebilir (preview/seed/test için)
export { LISTING_EXTENDED, getListingExtended } from './mock/listing-extended'
export { TKGM_ENCUMBRANCES, getEncumbrancesForListing } from './mock/tkgm-encumbrances'
export { IMAR_PLANS, getImarPlan } from './mock/imar-plans'
export { FARMLAND_DATA, getFarmlandData } from './mock/farmland-data'
export { HAZARD_SCORES, getHazardScore } from './mock/hazard-scores'
export { ENVIRONMENT_POI, getEnvironmentPoi } from './mock/environment-poi'
export { VERIFICATION_BADGES, getBadgesForListing } from './mock/verification-badges'

// Query hooks (12 toplam — query + mutation + AI chat + compare)
export * from './query/listing-detail-hooks'

// ─── Wave F36 / Faz 1 — landxpanel paritesi derinleştirme ────────────────────
//
// ECA Rule Engine + TKGM mock + Module Catalog + Compliance + PII Governance.
// Mevcut placeholder/yüzeysel admin sayfalarını dolduran altyapı.
// F36 Faz 2 (4 paralel slice) buradan tüketir.
// Tip prefix'leri: Eca*, Tkgm*, CatalogModule, Compliance*, Pii* — F33-F37
// ile collision yok.

export type * from './types/landxpanel-deepening'
export { ECA_RULES } from './mock/admin-eca-rules'
export { TKGM_PARCELS, simulateTkgmLatency } from './mock/tkgm-parcels'
export { MODULES_CATALOG, MODULE_LAYERS } from './mock/modules-catalog'
// Compliance constants `Landx*` prefix'iyle — mock/platform'daki eski
// COMPLIANCE_CONTROLS/ComplianceControl ile name collision'ı önler.
export {
  LANDX_COMPLIANCE_CONTROLS,
  LANDX_COMPLIANCE_POSTURE,
} from './mock/admin-compliance'
export { PII_INVENTORY, PII_DSAR_REQUESTS } from './mock/admin-pii'
export * from './query/landxpanel-hooks'

// ─── Wave F37 / Faz 4 — Feature flags (listing detail v2 + extension) ────────
//
// 7 flag (5 yeni + 2 noop guard). Default: hepsi false (mevcut Faz 3 davranışı
// korunur). Super-admin'de açılarak %10 → %50 → %100 ramp yapılır.

export {
  LISTING_DETAIL_V2_FLAGS,
  isFlagEnabled,
  type ListingDetailV2Flag,
} from './flags/listing-detail-v2'
