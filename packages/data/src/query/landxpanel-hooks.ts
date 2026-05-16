/**
 * TanStack Query v5 hooks — landxpanel deepening (Wave F36 / Faz 1).
 *
 * 17 hook, 5 alan:
 *   - ECA (6): useEcaRules, useEcaRule, useCreateEcaRule,
 *     useUpdateEcaRule, useDeleteEcaRule, useDryRunEca
 *   - TKGM (2): useTkgmParcels, useQueryTkgmParcel
 *   - Module Catalog (2): useModulesCatalog, useModuleDetail
 *   - Compliance (3): useComplianceControls, useCompliancePosture,
 *     useUpdateControlEvidence
 *   - PII (4): usePiiInventory, useRemediatePii, usePiiDsarQueue,
 *     useFulfillDsar
 *
 * Pattern (F33/F34/F35/F37 ile aynı):
 *   - mockAsync(value, latency)
 *   - query keys `landxpanelKeys.*` namespace
 *   - mutations stale invalidation
 *
 * Storage:
 *   - EcaRule, ComplianceControl, PiiInventoryItem, PiiDsarRequest
 *     id'li → createLocalStore
 *   - CatalogModule, TkgmParcel, CompliancePosture immutable mock → store yok
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { ECA_RULES } from '../mock/admin-eca-rules'
import { TKGM_PARCELS } from '../mock/tkgm-parcels'
import { MODULES_CATALOG } from '../mock/modules-catalog'
import {
  LANDX_COMPLIANCE_CONTROLS,
  LANDX_COMPLIANCE_POSTURE,
} from '../mock/admin-compliance'
import { PII_INVENTORY, PII_DSAR_REQUESTS } from '../mock/admin-pii'
import type {
  CatalogModule,
  LandxComplianceControl,
  LandxComplianceEvidence,
  LandxCompliancePosture,
  EcaDryRunResult,
  EcaRule,
  PiiDsarRequest,
  PiiInventoryItem,
  PiiRemediationAction,
  TkgmParcel,
  TkgmQueryResult,
} from '../types/landxpanel-deepening'
import {
  dryRunRule,
  lookupTkgmParcel,
  maybeSimulateTimeout,
  simulateTkgmLatency,
  type TkgmQueryInput,
} from '../lib/landxpanel-helpers'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const ecaStore = createLocalStore<EcaRule>(
  'admin.eca-rules',
  ECA_RULES.map((r) => ({
    ...r,
    conditions: r.conditions.map((c) => ({ ...c })),
    actions: r.actions.map((a) => ({ ...a, params: { ...a.params } })),
  })),
)

const complianceStore = createLocalStore<LandxComplianceControl>(
  'admin.compliance-controls',
  LANDX_COMPLIANCE_CONTROLS.map((c) => ({
    ...c,
    evidence: c.evidence.map((e) => ({ ...e })),
  })),
)

const piiStore = createLocalStore<PiiInventoryItem>(
  'admin.pii-inventory',
  PII_INVENTORY.map((p) => ({ ...p })),
)

const dsarStore = createLocalStore<PiiDsarRequest>(
  'admin.pii-dsar',
  PII_DSAR_REQUESTS.map((d) => ({
    ...d,
    affectedTables: [...d.affectedTables],
  })),
)

// ─── Query keys ──────────────────────────────────────────────────────────────

export const landxpanelKeys = {
  all: ['landxpanel'] as const,
  eca: {
    all: () => [...landxpanelKeys.all, 'eca'] as const,
    list: () => [...landxpanelKeys.eca.all(), 'list'] as const,
    one: (ruleId: string) => [...landxpanelKeys.eca.all(), 'one', ruleId] as const,
  },
  tkgm: {
    all: () => [...landxpanelKeys.all, 'tkgm'] as const,
    list: () => [...landxpanelKeys.tkgm.all(), 'list'] as const,
  },
  modules: {
    all: () => [...landxpanelKeys.all, 'modules'] as const,
    list: () => [...landxpanelKeys.modules.all(), 'list'] as const,
    one: (id: string) => [...landxpanelKeys.modules.all(), 'one', id] as const,
  },
  compliance: {
    all: () => [...landxpanelKeys.all, 'compliance'] as const,
    controls: (framework?: string) =>
      [...landxpanelKeys.compliance.all(), 'controls', framework ?? 'all'] as const,
    posture: () => [...landxpanelKeys.compliance.all(), 'posture'] as const,
  },
  pii: {
    all: () => [...landxpanelKeys.all, 'pii'] as const,
    inventory: () => [...landxpanelKeys.pii.all(), 'inventory'] as const,
    dsar: () => [...landxpanelKeys.pii.all(), 'dsar'] as const,
  },
}

// ─── ECA hooks ───────────────────────────────────────────────────────────────

export function useEcaRules(): UseQueryResult<EcaRule[]> {
  return useQuery({
    queryKey: landxpanelKeys.eca.list(),
    queryFn: () => {
      const items = ecaStore.list()
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return mockAsync(items, 180)
    },
  })
}

export function useEcaRule(ruleId: string): UseQueryResult<EcaRule | null> {
  return useQuery({
    queryKey: landxpanelKeys.eca.one(ruleId),
    queryFn: () => mockAsync(ecaStore.get(ruleId), 100),
    enabled: !!ruleId,
  })
}

export type CreateEcaRuleInput = Omit<
  EcaRule,
  'id' | 'triggerCount' | 'lastTriggeredAt' | 'createdAt' | 'updatedAt'
>

export function useCreateEcaRule(): UseMutationResult<
  EcaRule,
  Error,
  CreateEcaRuleInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input) => {
      const now = new Date().toISOString()
      const created = ecaStore.create({
        ...input,
        triggerCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      return mockAsync(created, 220)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.eca.all() })
    },
  })
}

export interface UpdateEcaRuleInput {
  ruleId: string
  patch: Partial<Omit<EcaRule, 'id' | 'createdAt'>>
}

export function useUpdateEcaRule(): UseMutationResult<
  EcaRule,
  Error,
  UpdateEcaRuleInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ruleId, patch }) => {
      const updated = ecaStore.update(ruleId, {
        ...patch,
        updatedAt: new Date().toISOString(),
      })
      if (!updated) return Promise.reject(new Error(`Rule ${ruleId} not found`))
      return mockAsync(updated, 200)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.eca.list() })
      qc.invalidateQueries({ queryKey: landxpanelKeys.eca.one(vars.ruleId) })
    },
  })
}

export function useDeleteEcaRule(): UseMutationResult<{ ruleId: string }, Error, string> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId) => {
      ecaStore.remove(ruleId)
      return mockAsync({ ruleId }, 180)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.eca.all() })
    },
  })
}

export interface DryRunEcaInput {
  ruleId: string
  payload: Record<string, unknown>
}

export function useDryRunEca(): UseMutationResult<
  EcaDryRunResult,
  Error,
  DryRunEcaInput
> {
  return useMutation({
    mutationFn: async ({ ruleId, payload }) => {
      const rule = ecaStore.get(ruleId)
      if (!rule) return Promise.reject(new Error(`Rule ${ruleId} not found`))
      const result = dryRunRule(rule, payload)
      return mockAsync(result, 150)
    },
  })
}

// ─── TKGM hooks ──────────────────────────────────────────────────────────────

export function useTkgmParcels(): UseQueryResult<TkgmParcel[]> {
  return useQuery({
    queryKey: landxpanelKeys.tkgm.list(),
    queryFn: () => mockAsync([...TKGM_PARCELS], 150),
    staleTime: 5 * 60 * 1000,
  })
}

export function useQueryTkgmParcel(): UseMutationResult<
  TkgmQueryResult,
  Error,
  TkgmQueryInput
> {
  return useMutation({
    mutationFn: async (input) => {
      const latencyMs = simulateTkgmLatency()
      // Önce timeout simülasyonu — bazen API hiç dönmez.
      const maybeTimeout = maybeSimulateTimeout()
      if (maybeTimeout) {
        const queriedAt = new Date().toISOString()
        return mockAsync<TkgmQueryResult>(
          { errorCode: maybeTimeout, latencyMs, queriedAt },
          latencyMs,
        )
      }
      const result = lookupTkgmParcel(input, TKGM_PARCELS, latencyMs)
      return mockAsync(result, latencyMs)
    },
  })
}

// ─── Module catalog hooks ────────────────────────────────────────────────────

export function useModulesCatalog(): UseQueryResult<CatalogModule[]> {
  return useQuery({
    queryKey: landxpanelKeys.modules.list(),
    queryFn: () => mockAsync([...MODULES_CATALOG], 150),
    staleTime: 5 * 60 * 1000,
  })
}

export function useModuleDetail(
  id: string,
): UseQueryResult<CatalogModule | null> {
  return useQuery({
    queryKey: landxpanelKeys.modules.one(id),
    queryFn: () => {
      const m = MODULES_CATALOG.find((x) => x.id === id) ?? null
      return mockAsync(m ? { ...m } : null, 100)
    },
    enabled: !!id,
  })
}

// ─── Compliance hooks ────────────────────────────────────────────────────────

export interface ComplianceFilter {
  framework?: LandxComplianceControl['framework']
}

export function useComplianceControls(
  filter?: ComplianceFilter,
): UseQueryResult<LandxComplianceControl[]> {
  return useQuery({
    queryKey: landxpanelKeys.compliance.controls(filter?.framework),
    queryFn: () => {
      let items = complianceStore.list()
      if (filter?.framework) {
        items = items.filter((c) => c.framework === filter.framework)
      }
      items.sort((a, b) =>
        a.framework === b.framework
          ? a.controlNo.localeCompare(b.controlNo)
          : a.framework.localeCompare(b.framework),
      )
      return mockAsync(items, 180)
    },
  })
}

export function useCompliancePosture(): UseQueryResult<LandxCompliancePosture[]> {
  return useQuery({
    queryKey: landxpanelKeys.compliance.posture(),
    queryFn: () => {
      // Posture'ı her zaman güncel store'dan recompute et — evidence/status
      // güncellendiyse skor anında yansısın.
      const items = complianceStore.list()
      const frameworks = Array.from(
        new Set(items.map((c) => c.framework)),
      ) as LandxComplianceControl['framework'][]
      const posture: LandxCompliancePosture[] = frameworks.map((fw) => {
        const subset = items.filter((c) => c.framework === fw)
        const total = subset.length
        const compliantCount = subset.filter((c) => c.status === 'compliant').length
        const partialCount = subset.filter((c) => c.status === 'partial').length
        const missingCount = subset.filter((c) => c.status === 'missing').length
        const naCount = subset.filter((c) => c.status === 'not_applicable').length
        const effective = Math.max(1, total - naCount)
        return {
          framework: fw,
          totalControls: total,
          compliantCount,
          partialCount,
          missingCount,
          scorePct: Math.round(
            ((compliantCount + 0.5 * partialCount) / effective) * 100,
          ),
        }
      })
      // Fallback — store boşalmış olursa seed posture döndür.
      const result = posture.length > 0 ? posture : [...LANDX_COMPLIANCE_POSTURE]
      return mockAsync(result, 160)
    },
  })
}

export interface UpdateControlEvidenceInput {
  controlId: string
  evidence: LandxComplianceEvidence
  /** Yeni status (opsiyonel — evidence sonrası compliant olur genelde). */
  newStatus?: LandxComplianceControl['status']
}

export function useUpdateControlEvidence(): UseMutationResult<
  LandxComplianceControl,
  Error,
  UpdateControlEvidenceInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ controlId, evidence, newStatus }) => {
      const current = complianceStore.get(controlId)
      if (!current) return Promise.reject(new Error(`Control ${controlId} not found`))
      const nextEvidence = [
        { ...evidence, uploadedAt: evidence.uploadedAt ?? new Date().toISOString() },
        ...current.evidence,
      ]
      const updated = complianceStore.update(controlId, {
        evidence: nextEvidence,
        lastReviewedAt: new Date().toISOString(),
        ...(newStatus ? { status: newStatus } : {}),
      })
      if (!updated) return Promise.reject(new Error('Update failed'))
      return mockAsync(updated, 240)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.compliance.all() })
    },
  })
}

// ─── PII hooks ───────────────────────────────────────────────────────────────

export function usePiiInventory(): UseQueryResult<PiiInventoryItem[]> {
  return useQuery({
    queryKey: landxpanelKeys.pii.inventory(),
    queryFn: () => {
      const items = piiStore.list()
      // Tablo + kolon sırasıyla determinist sıra.
      items.sort((a, b) =>
        a.table === b.table
          ? a.column.localeCompare(b.column)
          : a.table.localeCompare(b.table),
      )
      return mockAsync(items, 180)
    },
  })
}

export interface RemediatePiiInput {
  itemId: string
  action: PiiRemediationAction
}

export function useRemediatePii(): UseMutationResult<
  PiiInventoryItem,
  Error,
  RemediatePiiInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, action }) => {
      const current = piiStore.get(itemId)
      if (!current) return Promise.reject(new Error(`PII item ${itemId} not found`))
      // Aksiyon → field güncellemesi mapping
      const patch: Partial<PiiInventoryItem> = {}
      switch (action) {
        case 'mask':
          patch.maskedInLogs = true
          break
        case 'encrypt':
          patch.encrypted = true
          break
        case 'delete':
          patch.retentionDays = 0
          break
        case 'pseudonymize':
          patch.encrypted = true
          patch.maskedInLogs = true
          break
      }
      const updated = piiStore.update(itemId, patch)
      if (!updated) return Promise.reject(new Error('Remediation failed'))
      return mockAsync(updated, 260)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.pii.inventory() })
    },
  })
}

export function usePiiDsarQueue(): UseQueryResult<PiiDsarRequest[]> {
  return useQuery({
    queryKey: landxpanelKeys.pii.dsar(),
    queryFn: () => {
      const items = dsarStore.list()
      // Pending önce, sonra processing, sonra fulfilled/rejected.
      const order: Record<PiiDsarRequest['status'], number> = {
        pending: 0,
        processing: 1,
        fulfilled: 2,
        rejected: 3,
      }
      items.sort((a, b) => {
        const so = order[a.status] - order[b.status]
        if (so !== 0) return so
        return a.requestedAt < b.requestedAt ? 1 : -1
      })
      return mockAsync(items, 180)
    },
  })
}

export interface FulfillDsarInput {
  dsarId: string
  /** approve → fulfilled, reject → rejected. */
  outcome: 'approve' | 'reject'
}

export function useFulfillDsar(): UseMutationResult<
  PiiDsarRequest,
  Error,
  FulfillDsarInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dsarId, outcome }) => {
      const current = dsarStore.get(dsarId)
      if (!current) return Promise.reject(new Error(`DSAR ${dsarId} not found`))
      const now = new Date().toISOString()
      const updated = dsarStore.update(dsarId, {
        status: outcome === 'approve' ? 'fulfilled' : 'rejected',
        fulfilledAt: now,
      })
      if (!updated) return Promise.reject(new Error('DSAR update failed'))
      return mockAsync(updated, 300)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landxpanelKeys.pii.dsar() })
    },
  })
}
