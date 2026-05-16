/**
 * @landx/api-client — typed SDK over the LandX REST API.
 *
 *   import { createApiClient } from '@landx/api-client'
 *   import { httpTransport } from '@landx/data'
 *
 *   const client = createApiClient({ transport: httpTransport })
 *   const { data, meta } = await client.listings.list({ status: 'Aktif' })
 *
 * The constructor is a pure function over a `Transport` — no fetch, no
 * singletons, no auth state. Apps wire the transport once at boot and the
 * resulting `client` is safe to import anywhere.
 *
 * `baseUrl` is accepted for forward-compat (we'll soon let the SDK own URL
 * construction so it can stop relying on `@landx/data`'s configureApi);
 * today it's a no-op since `httpTransport` reads its own baseUrl from
 * `configureApi`. Documented in README.
 */

import { authResource, type AuthResource } from './resources/auth'
import { calendarResource, type CalendarResource } from './resources/calendar'
import { customersResource, type CustomersResource } from './resources/customers'
import { dealsResource, type DealsResource } from './resources/deals'
import { financeResource, type FinanceResource } from './resources/finance'
import { listingsResource, type ListingsResource } from './resources/listings'
import { messagesResource, type MessagesResource } from './resources/messages'
import { platformResource, type PlatformResource } from './resources/platform'
import { publicResource, type PublicResource } from './resources/public'
import { reportsResource, type ReportsResource } from './resources/reports'
import type { Transport } from './types'

export interface CreateApiClientOptions {
  /**
   * Pluggable transport. In production, pass `httpTransport` from
   * `@landx/data`; in tests, pass a hand-rolled object that records call
   * shapes.
   */
  transport: Transport
  /**
   * Documented for forward-compat; the current httpTransport already owns the
   * baseUrl via `configureApi`. Stored but not yet consumed by the SDK.
   */
  baseUrl?: string
}

export interface ApiClient {
  readonly baseUrl: string | undefined
  readonly transport: Transport
  readonly listings: ListingsResource
  readonly customers: CustomersResource
  readonly deals: DealsResource
  readonly calendar: CalendarResource
  readonly messages: MessagesResource
  readonly reports: ReportsResource
  readonly finance: FinanceResource
  readonly auth: AuthResource
  readonly public: PublicResource
  readonly platform: PlatformResource
}

export function createApiClient(opts: CreateApiClientOptions): ApiClient {
  const t = opts.transport
  return {
    baseUrl: opts.baseUrl,
    transport: t,
    listings: listingsResource(t),
    customers: customersResource(t),
    deals: dealsResource(t),
    calendar: calendarResource(t),
    messages: messagesResource(t),
    reports: reportsResource(t),
    finance: financeResource(t),
    auth: authResource(t),
    public: publicResource(t),
    platform: platformResource(t),
  }
}

// Re-export the shared types so callers don't need to dig into ./types.
export type { ItemResponse, ListMeta, ListResponse, Transport } from './types'

// Re-export resource factories + their per-resource query/input shapes so
// downstream code (hooks, MSW handlers, tests) can refer to e.g.
// `ListingListQuery` without a deep import.
export { listingsResource, type ListingListQuery, type ListingsResource } from './resources/listings'
export { customersResource, type CustomerCreateInput, type CustomerListQuery, type CustomerPatchInput, type CustomersResource } from './resources/customers'
export { dealsResource, type DealsResource } from './resources/deals'
export { calendarResource, type CalendarListQuery, type CalendarResource } from './resources/calendar'
export { messagesResource, type ConversationListQuery, type MessagesResource } from './resources/messages'
export { reportsResource, type CustomerSourcesResponse, type MonthlyCloseResponse, type ReportsResource, type TeamReportResponse } from './resources/reports'
export { financeResource, type FinanceCashflowQuery, type FinanceResource, type FinanceTxListQuery } from './resources/finance'
export { authResource, type AuthResource } from './resources/auth'
export { publicResource, type PublicOfficesQuery, type PublicResource } from './resources/public'
export { platformResource, type AuditListQuery, type PlatformResource, type TenantsListQuery } from './resources/platform'
