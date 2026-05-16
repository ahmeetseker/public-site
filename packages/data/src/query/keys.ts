// Query key factory'leri — hiyerarşik invalidation için.
// Pattern: ['entity', 'op', ...args]  → invalidate(['entity']) tüm alt query'leri yayar.

import type { CustomerSegment, CustomerStage, ListingStatus, ListingType } from '../mock/types'

export interface ListingFilters {
  status?: ListingStatus | 'Tümü'
  type?: ListingType | 'Tümü'
  search?: string
  priceMax?: number
  priceMin?: number
  areaMin?: number
}

export interface CustomerFilters {
  segment?: CustomerSegment | 'Tümü'
  stage?: CustomerStage
  search?: string
}

export interface TransactionFilters {
  type?: string
  status?: string
}

export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (f?: ListingFilters) => [...listingKeys.lists(), f ?? {}] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
  statusCounts: () => [...listingKeys.all, 'status-counts'] as const,
}

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (f?: CustomerFilters) => [...customerKeys.lists(), f ?? {}] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  segmentCounts: () => [...customerKeys.all, 'segment-counts'] as const,
}

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  byStage: (stage: CustomerStage) => [...dealKeys.all, 'by-stage', stage] as const,
  funnel: () => [...dealKeys.all, 'funnel'] as const,
  stageStats: (stage: CustomerStage) => [...dealKeys.all, 'stage-stats', stage] as const,
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (f?: TransactionFilters) => [...transactionKeys.lists(), f ?? {}] as const,
  cashflow: () => [...transactionKeys.all, 'cashflow'] as const,
  pendingByAge: () => [...transactionKeys.all, 'pending-by-age'] as const,
}

export const reportKeys = {
  all: ['reports'] as const,
  teamPerformance: () => [...reportKeys.all, 'team-performance'] as const,
  monthlyClose: () => [...reportKeys.all, 'monthly-close'] as const,
  customerSources: () => [...reportKeys.all, 'customer-sources'] as const,
  regionRanking: () => [...reportKeys.all, 'region-ranking'] as const,
}

export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
  eventsOnDay: (date: string) => [...calendarKeys.all, 'events-on-day', date] as const,
  eventsByMonth: (month: number, year: number) =>
    [...calendarKeys.all, 'events-by-month', year, month] as const,
}

export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messageKeys.all, 'conversation', id] as const,
}

export const profileKeys = {
  all: ['profile'] as const,
  team: () => [...profileKeys.all, 'team'] as const,
  integrations: () => [...profileKeys.all, 'integrations'] as const,
  shortcuts: () => [...profileKeys.all, 'shortcuts'] as const,
}

export const officeKeys = {
  all: ['offices'] as const,
  lists: () => [...officeKeys.all, 'list'] as const,
  list: (city?: string) => [...officeKeys.lists(), city ?? null] as const,
  details: () => [...officeKeys.all, 'detail'] as const,
  detail: (slug: string) => [...officeKeys.details(), slug] as const,
}

export const regionKeys = {
  all: ['regions'] as const,
  lists: () => [...regionKeys.all, 'list'] as const,
  details: () => [...regionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...regionKeys.details(), slug] as const,
  listings: (slug: string) => [...regionKeys.all, 'listings', slug] as const,
}
