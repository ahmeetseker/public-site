/**
 * Wave F36 / Faz 1 — landxpanel deepening domain types.
 *
 * 5 alan: ECA Rule Engine, TKGM mock, Module Catalog, Compliance,
 * PII Governance. F36 Faz 2 (5 paralel slice) bu tipleri tüketir.
 *
 * Prefix kuralı: `Eca*`, `Tkgm*`, `CatalogModule`, `Compliance*`, `Pii*`.
 * F33 (`Ai*`), F34 (`Broker*`), F35 (`Admin*`/`Agent*`),
 * F37 (`Listing*`/`Encumbrance`/`ImarPlan`/`Farmland*`/`Hazard*`/
 * `Environment*`/`Verification*`) ile collision YOK.
 */

// ─── ECA Rule Engine ─────────────────────────────────────────────────────────

export type EcaEventType =
  | 'listing.created'
  | 'listing.updated'
  | 'listing.status_changed'
  | 'listing.price_changed'
  | 'listing.viewed'
  | 'offer.created'
  | 'offer.accepted'
  | 'offer.rejected'
  | 'message.sent'
  | 'message.read'
  | 'viewing.scheduled'
  | 'viewing.completed'
  | 'tkgm.queried'
  | 'tkgm.updated'
  | 'user.registered'
  | 'user.kyc_verified'
  | 'system.cron.daily'
  | 'system.cron.hourly'

export type EcaOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'between'
  | 'regex'

export interface EcaCondition {
  id: string
  /** Dot-path on event payload (e.g. `listing.price`, `user.role`). */
  field: string
  operator: EcaOperator
  value: unknown
}

export type EcaActionType =
  | 'send_notification'
  | 'send_email'
  | 'send_sms'
  | 'create_audit'
  | 'update_listing_status'
  | 'webhook'

export interface EcaAction {
  id: string
  type: EcaActionType
  params: Record<string, unknown>
}

export interface EcaRule {
  id: string
  name: string
  description: string
  event: EcaEventType
  /** AND — hepsi eşleşmeli. */
  conditions: EcaCondition[]
  actions: EcaAction[]
  enabled: boolean
  triggerCount: number
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface EcaDryRunResult {
  matched: boolean
  rule?: EcaRule
  emittedActions: EcaAction[]
  evaluationLog: {
    conditionId: string
    result: boolean
    reason: string
  }[]
}

// ─── TKGM (Tapu ve Kadastro Genel Müdürlüğü) Mock ────────────────────────────

export type TkgmStatus = 'temiz' | 'ipotekli' | 'serh' | 'tedbir' | 'haciz'

export type TkgmCins = 'Arsa' | 'Tarla' | 'Bağ' | 'Bahçe' | 'Zeytinlik'

export type TkgmErrorCode =
  | 'OK'
  | 'E001_NOT_FOUND'
  | 'E002_INVALID_PARSEL'
  | 'E003_TIMEOUT'

export interface TkgmParcel {
  id: string
  il: string
  ilce: string
  mahalle?: string
  ada: string
  parsel: string
  pafta?: string
  /** m². */
  yuzolcumu: number
  cinsi: TkgmCins
  /** 0-1 arası hisse oranı. */
  hisseOrani: number
  status: TkgmStatus
  ownerName?: string
}

export interface TkgmQueryResult {
  errorCode: TkgmErrorCode
  parcel?: TkgmParcel
  latencyMs: number
  queriedAt: string
}

// ─── Module Catalog ──────────────────────────────────────────────────────────

export type ModuleLayer = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type ModuleStatus = 'full' | 'partial' | 'planned'

export type ModulePriority = 'P0' | 'P1' | 'P2'

export interface CatalogModule {
  id: string
  layer: ModuleLayer
  layerName: string
  name: string
  faz: 1 | 2 | 3 | 4
  priority: ModulePriority
  squad: string
  isAi: boolean
  isMcp: boolean
  description: string
  capabilities: string[]
  kpi: string
  uiRoute?: string
  implStatus: ModuleStatus
  dependencies: string[]
}

// ─── Compliance (Landx prefix — mock/platform ile name collision'ı önler) ────

export type LandxComplianceFramework =
  | 'KVKK'
  | 'VERBİS'
  | 'GDPR'
  | 'SOC2'
  | 'ISO27001'

export type LandxComplianceStatus =
  | 'compliant'
  | 'partial'
  | 'missing'
  | 'not_applicable'

export type LandxComplianceEvidenceType =
  | 'document'
  | 'config'
  | 'audit'
  | 'attestation'

export interface LandxComplianceEvidence {
  type: LandxComplianceEvidenceType
  reference: string
  uploadedAt?: string
}

export interface LandxComplianceControl {
  id: string
  framework: LandxComplianceFramework
  controlNo: string
  name: string
  description: string
  status: LandxComplianceStatus
  evidence: LandxComplianceEvidence[]
  lastReviewedAt: string
  nextReviewDue: string
  owner: string
}

export interface LandxCompliancePosture {
  framework: LandxComplianceFramework
  totalControls: number
  compliantCount: number
  partialCount: number
  missingCount: number
  /** 0-100 weighted score. */
  scorePct: number
}

// ─── PII Governance ──────────────────────────────────────────────────────────

export type PiiSensitivity =
  | 'public'
  | 'internal'
  | 'pii'
  | 'sensitive_pii'
  | 'special_category'

export interface PiiInventoryItem {
  id: string
  table: string
  column: string
  dataType: string
  sensitivity: PiiSensitivity
  encrypted: boolean
  maskedInLogs: boolean
  retentionDays: number
  legalBasis?: string
  lastAccessedAt: string
  accessCount30d: number
}

export type PiiRemediationAction =
  | 'mask'
  | 'encrypt'
  | 'delete'
  | 'pseudonymize'

export type PiiDsarType =
  | 'access'
  | 'erasure'
  | 'rectification'
  | 'portability'

export type PiiDsarStatus = 'pending' | 'processing' | 'fulfilled' | 'rejected'

export interface PiiDsarRequest {
  id: string
  type: PiiDsarType
  subjectName: string
  status: PiiDsarStatus
  requestedAt: string
  fulfilledAt?: string
  affectedTables: string[]
}
