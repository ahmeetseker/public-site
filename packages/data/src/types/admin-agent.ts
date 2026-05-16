/**
 * Admin / Agent domain types — Wave F35 / Faz 1C.
 *
 * İki kategori:
 *   1. **Admin** (super-admin scope) → API explorer + SLO + audit chain +
 *      orchestration workflow. Tipler `Admin*` prefix'iyle.
 *   2. **Agent** (super-admin /agent-memory scope) → memory layer + trace +
 *      workflow run (plan/execute/reflect). Tipler `Agent*` prefix'iyle.
 *
 * Para birimi: `cost` USD × 10000 (yüksek hassasiyet için integer cents).
 * Tarih: ISO 8601 string (UTC).
 *
 * F33 (`Ai*`) ve F34 (`Broker*`) prefix collision'ı yok. F35 Faz 2 super-admin
 * route'ları (`/api-explorer`, `/slo-dashboard`, `/audit-chain`,
 * `/orchestration`, `/agent-memory`) bu tipler ve hooks üzerinden çalışır.
 */

// ─── Admin: API Explorer ────────────────────────────────────────────────────

export type AdminApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** JSON Schema "lite" — sadece admin try-it formu için. */
export interface AdminApiFieldSchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
  description?: string
  enum?: ReadonlyArray<string | number>
  /** Örnek değer — try-it formuna prefill. */
  example?: unknown
  required?: boolean
}

export interface AdminApiSchema {
  type: 'object'
  /** Field adı → şema. */
  properties: Record<string, AdminApiFieldSchema>
  required?: ReadonlyArray<string>
}

export interface AdminApiEndpoint {
  id: string
  method: AdminApiMethod
  /** OpenAPI path template — `/api/v1/listings/:id`. */
  path: string
  /** UI'da grup başlığı (Listings, Users, Auth, Billing, Compliance). */
  group: string
  description: string
  requestSchema: AdminApiSchema
  responseSchema: AdminApiSchema
  authRequired: boolean
  /** İstek/saniye limiti (boşsa unlimited). */
  rateLimit?: number
}

// ─── Admin: SLO Dashboard ───────────────────────────────────────────────────

export type AdminSloAlertLevel = 'warn' | 'crit'

export interface AdminSloAlert {
  level: AdminSloAlertLevel
  message: string
  /** ISO 8601. */
  at: string
}

export interface AdminSloTrendPoint {
  /** ISO 8601 (gün başı). */
  date: string
  /** 0-1 arası. */
  uptime: number
}

export interface AdminSloMetric {
  service: string
  /** Hedef uptime (örn. 0.999, 0.995). */
  targetUptime: number
  /** Anlık (son 24 saat) uptime. */
  currentUptime: number
  /** Error budget'tan kalan yüzde (0-100). */
  budgetRemainingPct: number
  alerts: ReadonlyArray<AdminSloAlert>
  /** 30 günlük trend. */
  trend: ReadonlyArray<AdminSloTrendPoint>
}

// ─── Admin: Audit Chain ─────────────────────────────────────────────────────

export interface AdminAuditEvent {
  id: string
  /** Aksiyonu yapan (admin@landx.com, agent:doc-extractor, system). */
  actor: string
  /** Aksiyon adı (user.login, listing.delete, kvkk.export). */
  action: string
  /** Etkilenen kaynak id'si (listing:LST-001, user:USR-042). */
  resource: string
  /** ISO 8601. */
  at: string
  /** Mock SHA-256 (deterministik) — chain integrity için. */
  hash: string
  /** Önceki event'in hash'i — `'GENESIS'` ilk event için. */
  prevHash: string
  meta?: Record<string, unknown>
}

// ─── Admin: Orchestration Workflows ─────────────────────────────────────────

export type AdminWorkflowStepStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'approved'
  | 'rejected'

export interface AdminWorkflowStep {
  id: string
  name: string
  status: AdminWorkflowStepStatus
  needsApproval: boolean
  /** Son aksiyonu yapan operatör (id). */
  approver?: string
  /** ISO 8601. */
  completedAt?: string
}

export interface AdminWorkflow {
  id: string
  /** İnsan dostu ad — KYC İncelemesi, Refund Onayı. */
  name: string
  steps: ReadonlyArray<AdminWorkflowStep>
  /** ISO 8601. */
  startedAt: string
  /** Workflow'u başlatan (admin id veya 'system'). */
  initiator: string
}

// ─── Agent: Memory ──────────────────────────────────────────────────────────

export type AgentMemoryLayerType = 'short' | 'long' | 'episodic' | 'procedural'

export interface AgentMemoryEntry {
  id: string
  layerType: AgentMemoryLayerType
  content: string
  /** UMAP/t-SNE için 8 boyutlu mock embedding (float -1..1). */
  embedding: ReadonlyArray<number>
  tokens: number
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. */
  lastAccessedAt: string
  accessCount: number
  agentId: string
}

export interface AgentMemoryLayer {
  type: AgentMemoryLayerType
  description: string
  entries: ReadonlyArray<AgentMemoryEntry>
  totalTokens: number
}

// ─── Agent: Traces (observability) ──────────────────────────────────────────

export type AgentSpanStatus = 'ok' | 'error'

export interface AgentTraceSpan {
  /** Span adı (llm.completion, tool.search_listings, retry). */
  name: string
  /** Trace başından itibaren ms. */
  startMs: number
  durationMs: number
  status: AgentSpanStatus
  metadata?: Record<string, unknown>
}

export interface AgentTrace {
  id: string
  agentId: string
  conversationId: string
  spans: ReadonlyArray<AgentTraceSpan>
  totalDurationMs: number
  totalTokens: number
  /** USD × 10000 (cents-of-cent). */
  cost: number
  /** ISO 8601. */
  createdAt: string
}

// ─── Agent: Workflow Runs (plan / execute / reflect) ────────────────────────

export type AgentWorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'reflecting'
  | 'completed'
  | 'failed'

export type AgentWorkflowPhase = 'plan' | 'execute' | 'reflect'

export interface AgentWorkflowRunStep {
  phase: AgentWorkflowPhase
  output: string
  /** ISO 8601. */
  at: string
}

export interface AgentWorkflowRun {
  id: string
  workflowId: string
  agentId: string
  status: AgentWorkflowRunStatus
  steps: ReadonlyArray<AgentWorkflowRunStep>
  needsHumanApproval: boolean
  /** ISO 8601. */
  createdAt: string
}
