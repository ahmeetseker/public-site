/**
 * Reports resource — three flat reads, each carries report-specific `meta`
 * totals on top of the standard ListMeta. We type the wrapping envelope per
 * call site so callers don't lose access to the extra totals fields.
 */
import type { MonthlyClose, SourceRow, TeamRow } from '@landx/api-types'
import type { ListMeta, Transport } from '../types'

export interface TeamReportResponse {
  data: TeamRow[]
  meta: ListMeta & {
    totals?: { closed: number; active: number; revenue: number }
  }
}

export interface MonthlyCloseResponse {
  data: MonthlyClose[]
  meta: ListMeta & { revenue?: number; count?: number }
}

export interface CustomerSourcesResponse {
  data: SourceRow[]
  meta: ListMeta & { totalLeads?: number }
}

export function reportsResource(t: Transport) {
  return {
    team: () => t.get<TeamReportResponse>('/reports/team'),
    monthlyClose: () => t.get<MonthlyCloseResponse>('/reports/monthly-close'),
    customerSources: () => t.get<CustomerSourcesResponse>('/reports/customer-sources'),
  }
}

export type ReportsResource = ReturnType<typeof reportsResource>
