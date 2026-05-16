/**
 * TanStack Query v5 hooks — admin/agent tools (Wave F35 / Faz 1C).
 *
 * Mock-only — backend yok. Pattern (F32/F33/F34 ile aynı):
 *   - `mockAsync(value, latency)` ile gerçekçi gecikme
 *   - query key array — `['agentTools', op, ...args]`
 *   - mutation'lar stale invalidation yapar
 *
 * 14 hook (~5 admin + ~7 agent + 2 mutation karışımı):
 *   1. useAdminApiEndpoints(group?)        ← query
 *   2. useTryAdminEndpoint()                ← mutation (mock response üret)
 *   3. useAdminSloMetrics()                 ← query
 *   4. useAdminAuditChain(filter?)          ← query
 *   5. useVerifyAuditChainIntegrity()       ← mutation (chain doğrula)
 *   6. useAdminWorkflows(filter?)           ← query
 *   7. useApproveWorkflowStep()             ← mutation
 *   8. useRejectWorkflowStep()              ← mutation
 *   9. useAgentMemoryLayers(agentId?)       ← query
 *  10. useAgentMemoryEntry(entryId)         ← query
 *  11. useAgentTraces(filter?)              ← query
 *  12. useAgentTrace(traceId)               ← query
 *  13. useAgentWorkflowRuns()               ← query
 *  14. useApproveAgentWorkflowRun()         ← mutation (human-in-the-loop)
 *
 * Storage:
 *   - `AdminAuditEvent` (id'li) → createLocalStore
 *   - `AdminWorkflow`  (id'li) → createLocalStore (steps mutate edilir)
 *   - `AgentWorkflowRun` (id'li) → createLocalStore
 *   - SLO ve API endpoint'ler immutable mock — store gerekmez
 *   - `AgentMemoryEntry` (id'li) → createLocalStore (flatten 4 layer)
 *   - `AgentTrace` (id'li) → createLocalStore
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { ADMIN_API_ENDPOINTS } from '../mock/admin-api-endpoints'
import { ADMIN_AUDIT_CHAIN, mockHash } from '../mock/admin-audit-chain'
import { ADMIN_SLO_METRICS } from '../mock/admin-slo'
import { ADMIN_WORKFLOWS } from '../mock/admin-workflows'
import { AGENT_MEMORY_LAYERS } from '../mock/agent-memory'
import { AGENT_TRACES } from '../mock/agent-traces'
import { AGENT_WORKFLOW_RUNS } from '../mock/agent-workflow-runs'
import type {
  AdminApiEndpoint,
  AdminAuditEvent,
  AdminSloMetric,
  AdminWorkflow,
  AdminWorkflowStep,
  AdminWorkflowStepStatus,
  AgentMemoryEntry,
  AgentMemoryLayer,
  AgentMemoryLayerType,
  AgentTrace,
  AgentWorkflowRun,
  AgentWorkflowRunStatus,
} from '../types/admin-agent'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const auditStore = createLocalStore<AdminAuditEvent>(
  'admin.audit-chain',
  [...ADMIN_AUDIT_CHAIN],
)
const workflowStore = createLocalStore<AdminWorkflow>(
  'admin.workflows',
  ADMIN_WORKFLOWS.map((w) => ({ ...w, steps: w.steps.map((s) => ({ ...s })) })),
)
const agentRunStore = createLocalStore<AgentWorkflowRun>(
  'agent.workflow-runs',
  AGENT_WORKFLOW_RUNS.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s })) })),
)

// AgentMemoryEntry'leri 4 layer'dan flatten edip tek store'a koy.
const allMemoryEntries: AgentMemoryEntry[] = AGENT_MEMORY_LAYERS.flatMap((l) =>
  l.entries.map((e) => ({ ...e, embedding: [...e.embedding] })),
)
const memoryStore = createLocalStore<AgentMemoryEntry>(
  'agent.memory-entries',
  allMemoryEntries,
)

const traceStore = createLocalStore<AgentTrace>(
  'agent.traces',
  AGENT_TRACES.map((t) => ({ ...t, spans: t.spans.map((s) => ({ ...s })) })),
)

// ─── Query keys ──────────────────────────────────────────────────────────────

export const agentToolsKeys = {
  all: ['agentTools'] as const,
  apiEndpoints: {
    all: () => [...agentToolsKeys.all, 'apiEndpoints'] as const,
    list: (group?: string) => [...agentToolsKeys.apiEndpoints.all(), group ?? 'all'] as const,
  },
  slo: () => [...agentToolsKeys.all, 'slo'] as const,
  audit: {
    all: () => [...agentToolsKeys.all, 'audit'] as const,
    list: (filter?: AuditFilter) => [...agentToolsKeys.audit.all(), filter ?? {}] as const,
  },
  workflows: {
    all: () => [...agentToolsKeys.all, 'workflows'] as const,
    list: (filter?: WorkflowFilter) => [...agentToolsKeys.workflows.all(), filter ?? {}] as const,
  },
  memory: {
    all: () => [...agentToolsKeys.all, 'memory'] as const,
    layers: (agentId?: string) => [...agentToolsKeys.memory.all(), 'layers', agentId ?? 'all'] as const,
    entry: (entryId: string) => [...agentToolsKeys.memory.all(), 'entry', entryId] as const,
  },
  traces: {
    all: () => [...agentToolsKeys.all, 'traces'] as const,
    list: (filter?: TraceFilter) => [...agentToolsKeys.traces.all(), filter ?? {}] as const,
    one: (traceId: string) => [...agentToolsKeys.traces.all(), 'one', traceId] as const,
  },
  agentRuns: () => [...agentToolsKeys.all, 'agentRuns'] as const,
}

// ─── 1. useAdminApiEndpoints ─────────────────────────────────────────────────

export function useAdminApiEndpoints(group?: string): UseQueryResult<AdminApiEndpoint[]> {
  return useQuery({
    queryKey: agentToolsKeys.apiEndpoints.list(group),
    queryFn: () => {
      const items = group ? ADMIN_API_ENDPOINTS.filter((e) => e.group === group) : ADMIN_API_ENDPOINTS
      return mockAsync([...items], 120)
    },
  })
}

// ─── 2. useTryAdminEndpoint ──────────────────────────────────────────────────

export interface TryAdminEndpointInput {
  endpointId: string
  /** Path/query parametreleri (`:id` yerine konacak değerler). */
  params?: Record<string, string | number>
  /** POST/PATCH body. */
  body?: Record<string, unknown>
}

export interface TryAdminEndpointResult {
  endpointId: string
  status: number
  /** Mock response payload — endpoint.responseSchema'ya göre üretilir. */
  data: Record<string, unknown>
  /** Mock latency (ms). */
  latencyMs: number
}

function buildMockResponse(endpoint: AdminApiEndpoint, params?: Record<string, string | number>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(endpoint.responseSchema.properties)) {
    if (schema.example !== undefined) {
      out[key] = schema.example
      continue
    }
    switch (schema.type) {
      case 'string':
        out[key] = `mock-${key}-${Date.now().toString(36).slice(-4)}`
        break
      case 'integer':
      case 'number':
        out[key] = Math.floor(Math.random() * 1000)
        break
      case 'boolean':
        out[key] = true
        break
      case 'array':
        out[key] = []
        break
      case 'object':
        out[key] = {}
        break
      case 'null':
        out[key] = null
        break
    }
  }
  // Eğer endpoint id parametresi alıyorsa response'a yansıt.
  if (params && 'id' in params && 'id' in endpoint.responseSchema.properties) {
    out.id = params.id
  }
  return out
}

export function useTryAdminEndpoint(): UseMutationResult<
  TryAdminEndpointResult,
  Error,
  TryAdminEndpointInput
> {
  return useMutation({
    mutationFn: async ({ endpointId, params }) => {
      const endpoint = ADMIN_API_ENDPOINTS.find((e) => e.id === endpointId)
      if (!endpoint) return Promise.reject(new Error(`Endpoint ${endpointId} not found`))
      const latencyMs = 80 + Math.floor(Math.random() * 240)
      const data = buildMockResponse(endpoint, params)
      return mockAsync<TryAdminEndpointResult>(
        {
          endpointId,
          status: endpoint.method === 'DELETE' ? 204 : 200,
          data,
          latencyMs,
        },
        latencyMs,
      )
    },
  })
}

// ─── 3. useAdminSloMetrics ───────────────────────────────────────────────────

export function useAdminSloMetrics(): UseQueryResult<AdminSloMetric[]> {
  return useQuery({
    queryKey: agentToolsKeys.slo(),
    queryFn: () => mockAsync([...ADMIN_SLO_METRICS], 200),
    staleTime: 30 * 1000,
  })
}

// ─── 4. useAdminAuditChain ───────────────────────────────────────────────────

export interface AuditFilter {
  actor?: string
  resourcePrefix?: string
  /** ISO 8601 — bu tarihten itibaren. */
  from?: string
  /** ISO 8601 — bu tarihe kadar. */
  to?: string
}

export function useAdminAuditChain(filter?: AuditFilter): UseQueryResult<AdminAuditEvent[]> {
  return useQuery({
    queryKey: agentToolsKeys.audit.list(filter),
    queryFn: () => {
      let items = auditStore.list()
      if (filter?.actor) items = items.filter((e) => e.actor === filter.actor)
      if (filter?.resourcePrefix) {
        const prefix = filter.resourcePrefix
        items = items.filter((e) => e.resource.startsWith(prefix))
      }
      if (filter?.from) {
        const from = filter.from
        items = items.filter((e) => e.at >= from)
      }
      if (filter?.to) {
        const to = filter.to
        items = items.filter((e) => e.at <= to)
      }
      // En yeni event'ten başla.
      items.sort((a, b) => (a.at < b.at ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 5. useVerifyAuditChainIntegrity ─────────────────────────────────────────

export interface VerifyAuditChainResult {
  verified: boolean
  totalEvents: number
  /** Bozulmuş event id'leri (prevHash != önceki event'in hash'i veya hash kendi içeriğiyle uyumsuz). */
  brokenLinks: ReadonlyArray<string>
}

export function useVerifyAuditChainIntegrity(): UseMutationResult<
  VerifyAuditChainResult,
  Error,
  void
> {
  return useMutation({
    mutationFn: async () => {
      // Chain'i orijinal sırayla (insertion order) kontrol et — store list() reverse insertion yapar
      // ama biz id'ye göre sıralayalım (AUD-0001..AUD-0050).
      const items = auditStore.list().sort((a, b) => (a.id < b.id ? -1 : 1))
      const broken: string[] = []
      let prevHash = 'GENESIS'

      for (const ev of items) {
        const expectedPayload = `${ev.id}|${ev.actor}|${ev.action}|${ev.resource}|${ev.at}|${prevHash}`
        const expectedHash = mockHash(expectedPayload)
        if (ev.prevHash !== prevHash) {
          broken.push(ev.id)
        } else if (ev.hash !== expectedHash) {
          broken.push(ev.id)
        }
        prevHash = ev.hash
      }

      return mockAsync<VerifyAuditChainResult>(
        {
          verified: broken.length === 0,
          totalEvents: items.length,
          brokenLinks: broken,
        },
        600,
      )
    },
  })
}

// ─── 6. useAdminWorkflows ────────────────────────────────────────────────────

export interface WorkflowFilter {
  /** Sadece pending step'i olan workflow'lar. */
  hasPending?: boolean
  /** Workflow adında arama (case-insensitive). */
  search?: string
}

export function useAdminWorkflows(filter?: WorkflowFilter): UseQueryResult<AdminWorkflow[]> {
  return useQuery({
    queryKey: agentToolsKeys.workflows.list(filter),
    queryFn: () => {
      let items = workflowStore.list()
      if (filter?.hasPending) {
        items = items.filter((w) => w.steps.some((s) => s.status === 'pending' || s.status === 'running'))
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase()
        items = items.filter((w) => w.name.toLowerCase().includes(s))
      }
      items.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 7-8. useApproveWorkflowStep / useRejectWorkflowStep ─────────────────────

export interface WorkflowStepActionInput {
  workflowId: string
  stepId: string
  /** Onayı yapan operatör (admin id). */
  approver: string
}

function transitionWorkflowStep(
  workflowId: string,
  stepId: string,
  approver: string,
  nextStatus: AdminWorkflowStepStatus,
): AdminWorkflow {
  const current = workflowStore.get(workflowId)
  if (!current) throw new Error(`Workflow ${workflowId} not found`)
  let stepFound = false
  const nextSteps: AdminWorkflowStep[] = current.steps.map((s) => {
    if (s.id !== stepId) return { ...s }
    stepFound = true
    return {
      ...s,
      status: nextStatus,
      approver,
      completedAt: new Date().toISOString(),
    }
  })
  if (!stepFound) throw new Error(`Step ${stepId} not found in ${workflowId}`)
  const updated = workflowStore.update(workflowId, { steps: nextSteps })
  if (!updated) throw new Error(`Failed to update workflow ${workflowId}`)
  return updated
}

export function useApproveWorkflowStep(): UseMutationResult<
  AdminWorkflow,
  Error,
  WorkflowStepActionInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workflowId, stepId, approver }) => {
      try {
        const updated = transitionWorkflowStep(workflowId, stepId, approver, 'approved')
        return await mockAsync(updated, 300)
      } catch (e) {
        return Promise.reject(e)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentToolsKeys.workflows.all() })
    },
  })
}

export function useRejectWorkflowStep(): UseMutationResult<
  AdminWorkflow,
  Error,
  WorkflowStepActionInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workflowId, stepId, approver }) => {
      try {
        const updated = transitionWorkflowStep(workflowId, stepId, approver, 'rejected')
        return await mockAsync(updated, 300)
      } catch (e) {
        return Promise.reject(e)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentToolsKeys.workflows.all() })
    },
  })
}

// ─── 9. useAgentMemoryLayers ─────────────────────────────────────────────────

/**
 * Layer'ları on-the-fly entries'ten reconstruct eder. Filter `agentId` verilirse
 * sadece o agent'a ait entry'ler döner (totalTokens da yeniden hesaplanır).
 */
export function useAgentMemoryLayers(agentId?: string): UseQueryResult<AgentMemoryLayer[]> {
  return useQuery({
    queryKey: agentToolsKeys.memory.layers(agentId),
    queryFn: () => {
      const allEntries = memoryStore.list()
      const byLayer = new Map<AgentMemoryLayerType, AgentMemoryEntry[]>()
      for (const entry of allEntries) {
        if (agentId && entry.agentId !== agentId) continue
        const bucket = byLayer.get(entry.layerType) ?? []
        bucket.push(entry)
        byLayer.set(entry.layerType, bucket)
      }
      // AGENT_MEMORY_LAYERS sırasını koru — type + description meta için kullan.
      const layers: AgentMemoryLayer[] = AGENT_MEMORY_LAYERS.map((meta) => {
        const entries = byLayer.get(meta.type) ?? []
        return {
          type: meta.type,
          description: meta.description,
          entries,
          totalTokens: entries.reduce((sum, e) => sum + e.tokens, 0),
        }
      })
      return mockAsync(layers, 220)
    },
    staleTime: 60 * 1000,
  })
}

// ─── 10. useAgentMemoryEntry ─────────────────────────────────────────────────

export function useAgentMemoryEntry(entryId: string): UseQueryResult<AgentMemoryEntry | null> {
  return useQuery({
    queryKey: agentToolsKeys.memory.entry(entryId),
    queryFn: () => {
      const entry = memoryStore.get(entryId)
      return mockAsync(entry, 100)
    },
    enabled: !!entryId,
  })
}

// ─── 11. useAgentTraces ──────────────────────────────────────────────────────

export interface TraceFilter {
  agentId?: string
  conversationId?: string
  /** En düşük totalDurationMs (slow trace filter). */
  minDurationMs?: number
  /** Sadece error span'i olan trace'ler. */
  hasError?: boolean
}

export function useAgentTraces(filter?: TraceFilter): UseQueryResult<AgentTrace[]> {
  return useQuery({
    queryKey: agentToolsKeys.traces.list(filter),
    queryFn: () => {
      let items = traceStore.list()
      if (filter?.agentId) items = items.filter((t) => t.agentId === filter.agentId)
      if (filter?.conversationId) items = items.filter((t) => t.conversationId === filter.conversationId)
      if (filter?.minDurationMs) {
        const min = filter.minDurationMs
        items = items.filter((t) => t.totalDurationMs >= min)
      }
      if (filter?.hasError) {
        items = items.filter((t) => t.spans.some((s) => s.status === 'error'))
      }
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 12. useAgentTrace ───────────────────────────────────────────────────────

export function useAgentTrace(traceId: string): UseQueryResult<AgentTrace | null> {
  return useQuery({
    queryKey: agentToolsKeys.traces.one(traceId),
    queryFn: () => mockAsync(traceStore.get(traceId), 120),
    enabled: !!traceId,
  })
}

// ─── 13. useAgentWorkflowRuns ────────────────────────────────────────────────

export function useAgentWorkflowRuns(): UseQueryResult<AgentWorkflowRun[]> {
  return useQuery({
    queryKey: agentToolsKeys.agentRuns(),
    queryFn: () => {
      const items = agentRunStore.list()
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 14. useApproveAgentWorkflowRun (human-in-the-loop) ──────────────────────

export interface ApproveAgentRunInput {
  runId: string
  approver: string
  /** Onaylandı = `completed`, reddedildi = `failed`. */
  outcome: 'approve' | 'reject'
}

export function useApproveAgentWorkflowRun(): UseMutationResult<
  AgentWorkflowRun,
  Error,
  ApproveAgentRunInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ runId, approver, outcome }) => {
      const current = agentRunStore.get(runId)
      if (!current) return Promise.reject(new Error(`Run ${runId} not found`))
      const status: AgentWorkflowRunStatus = outcome === 'approve' ? 'completed' : 'failed'
      const reflectStep = {
        phase: 'reflect' as const,
        output:
          outcome === 'approve'
            ? `İnsan onayı alındı (${approver}) — workflow tamamlandı`
            : `İnsan tarafından reddedildi (${approver}) — workflow başarısız`,
        at: new Date().toISOString(),
      }
      const nextSteps = [...current.steps, reflectStep]
      const updated = agentRunStore.update(runId, {
        status,
        needsHumanApproval: false,
        steps: nextSteps,
      })
      if (!updated) return Promise.reject(new Error('Run update failed'))
      return mockAsync(updated, 300)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentToolsKeys.agentRuns() })
    },
  })
}
