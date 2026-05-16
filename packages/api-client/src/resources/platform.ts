/**
 * Platform resource — super-admin scoped reads (tenants, audit log).
 */
import type { AuditEntry, Tenant, operations } from '@landx/api-types'
import type { ListResponse, Transport } from '../types'

export type TenantsListQuery = NonNullable<operations['listTenants']['parameters']['query']>
export type AuditListQuery = NonNullable<operations['listAuditEntries']['parameters']['query']>

export function platformResource(t: Transport) {
  return {
    listTenants: (params?: TenantsListQuery) =>
      t.get<{ data: Tenant[] }>(
        '/platform/tenants',
        params as Record<string, unknown> | undefined,
      ),
    listAudit: (params?: AuditListQuery) =>
      t.get<ListResponse<AuditEntry>>(
        '/platform/audit',
        params as Record<string, unknown> | undefined,
      ),
  }
}

export type PlatformResource = ReturnType<typeof platformResource>
