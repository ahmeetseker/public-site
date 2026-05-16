/**
 * Super-admin platform query hooks — Wave 15 / Agent-A74 / Faz 12.2.c.
 * SDK adoption — Wave 18 / Agent-A85 / Faz 12.12.b.
 *
 * Backed by GET /platform/tenants + GET /platform/audit (Wave 14 / A69).
 * Both endpoints require `super-admin` scope; the super-admin AuthProvider
 * (A74) is responsible for configuring the @landx/data api client with a
 * valid JWT before these hooks run.
 *
 * Type contract: the network endpoints return the OpenAPI Tenant / AuditEntry
 * shape (camelCase: `at`, `lastActiveAt`, `createdAt`). The mock arrays in
 * @landx/data still use the legacy *ISO suffixes. We translate API → domain
 * inside the queryFn so route components (Tenants, Audit) continue reading
 * the same domain fields they always did. apiOrMock keeps tests green
 * without a backend.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { Tenant as ApiTenant, AuditEntry as ApiAuditEntry } from '@landx/api-types'
import { TENANTS, type Tenant } from '../mock/platform/tenants'
import { AUDIT_LOG, type AuditEntry } from '../mock/platform/audit'
import { apiOrMock, landxApi } from '../api'
import { mockAsync } from './mock-latency'

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantFilters {
  plan?: Tenant['plan']
  status?: Tenant['status']
}

export interface AuditFilters {
  actor?: string
  tenantId?: string
  action?: string
  outcome?: AuditEntry['outcome']
  pageSize?: number
}

export const tenantKeys = {
  all: ['platform', 'tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (f?: TenantFilters) => [...tenantKeys.lists(), f ?? {}] as const,
}

export const auditKeys = {
  all: ['platform', 'audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (f?: AuditFilters, cursor?: string | null) =>
    [...auditKeys.lists(), f ?? {}, cursor ?? null] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// API → domain mappers
// ─────────────────────────────────────────────────────────────────────────────

function tenantFromContract(t: ApiTenant): Tenant {
  return {
    id: t.id,
    name: t.name,
    city: t.city,
    plan: t.plan,
    mrr: t.mrr,
    listingCount: t.listingCount,
    userCount: t.userCount,
    lastActiveISO: t.lastActiveAt,
    status: t.status,
    createdISO: t.createdAt,
  }
}

function auditFromContract(a: ApiAuditEntry): AuditEntry {
  return {
    id: a.id,
    actor: a.actor,
    action: a.action,
    resourceType: a.resourceType,
    resourceId: a.resourceId,
    tenantId: a.tenantId ?? null,
    ip: a.ip,
    userAgent: a.userAgent,
    outcome: a.outcome,
    atISO: a.at,
    ...(a.metadata ? { metadata: a.metadata as Record<string, string | number> } : {}),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Local filter helpers (mock fallback parity with apps/api/src/routes/platform.ts)
// ─────────────────────────────────────────────────────────────────────────────

export function applyTenantFilters(rows: Tenant[], f: TenantFilters): Tenant[] {
  let out = rows
  if (f.plan) out = out.filter((t) => t.plan === f.plan)
  if (f.status) out = out.filter((t) => t.status === f.status)
  // Stable order: MRR desc, then id asc — matches server.
  return [...out].sort((a, b) => b.mrr - a.mrr || a.id.localeCompare(b.id))
}

export function applyAuditFilters(rows: AuditEntry[], f: AuditFilters): AuditEntry[] {
  let out = rows
  if (f.actor) {
    const q = f.actor.toLowerCase()
    out = out.filter((e) => e.actor.toLowerCase().includes(q))
  }
  if (f.tenantId) out = out.filter((e) => e.tenantId === f.tenantId)
  if (f.action) {
    const q = f.action.toLowerCase()
    out = out.filter((e) => e.action.toLowerCase().includes(q))
  }
  if (f.outcome) out = out.filter((e) => e.outcome === f.outcome)
  // Newest first — server matches.
  return [...out].sort((a, b) => b.atISO.localeCompare(a.atISO))
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

type TenantsQuery = Parameters<typeof landxApi.platform.listTenants>[0]
type AuditQuery = Parameters<typeof landxApi.platform.listAudit>[0]

/**
 * GET /platform/tenants — super-admin tenant directory.
 *
 * Returns the full filtered list (no pagination at this endpoint per the
 * OpenAPI contract). Falls back to the seed mock when the api client is
 * unconfigured or unreachable.
 */
export function useTenants(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: tenantKeys.list(filters),
    queryFn: () =>
      apiOrMock(
        async () => {
          const res = await landxApi.platform.listTenants({
            plan: filters.plan,
            status: filters.status,
          } as TenantsQuery)
          return res.data.map(tenantFromContract)
        },
        () => mockAsync(applyTenantFilters(TENANTS, filters)),
      ),
    placeholderData: keepPreviousData,
  })
}

export interface AuditPage {
  data: AuditEntry[]
  meta: {
    nextCursor: string | null
    total?: number
    pageSize?: number
  }
}

/**
 * GET /platform/audit — cross-tenant audit log with cursor pagination.
 *
 * `cursor` is opaque — pass `data.meta.nextCursor` from the previous page
 * back in to fetch the next slice. Mock fallback returns the full filtered
 * array with `nextCursor: null` (mock dataset is small, no need to paginate).
 */
export function useAuditLog(filters: AuditFilters = {}, cursor: string | null = null) {
  return useQuery({
    queryKey: auditKeys.list(filters, cursor),
    queryFn: async (): Promise<AuditPage> =>
      apiOrMock<AuditPage>(
        async () => {
          const res = await landxApi.platform.listAudit({
            actor: filters.actor,
            tenantId: filters.tenantId,
            action: filters.action,
            outcome: filters.outcome,
            pageSize: filters.pageSize,
            cursor: cursor ?? undefined,
          } as AuditQuery)
          return {
            data: res.data.map(auditFromContract),
            meta: {
              nextCursor: res.meta?.nextCursor ?? null,
              total: res.meta?.total,
              pageSize: res.meta?.pageSize,
            },
          }
        },
        async () => ({
          data: await mockAsync(applyAuditFilters(AUDIT_LOG, filters)),
          meta: { nextCursor: null, total: AUDIT_LOG.length },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}
