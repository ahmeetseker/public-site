// Re-export auto-generated OpenAPI types
export type { paths, components, operations } from './generated'

// Convenience type aliases — most-used schemas
import type { components } from './generated'
export type Listing = components['schemas']['Listing']
export type ListingCreateInput = components['schemas']['ListingCreateInput']
export type ListingPatchInput = components['schemas']['ListingPatchInput']
export type ListingStatus = components['schemas']['ListingStatus']
export type ListingType = components['schemas']['ListingType']
export type Customer = components['schemas']['Customer']
export type CustomerSegment = components['schemas']['CustomerSegment']
export type CustomerStage = components['schemas']['CustomerStage']
export type Deal = components['schemas']['Deal']
export type DealStatus = components['schemas']['DealStatus']
export type User = components['schemas']['User']
export type Office = components['schemas']['Office']
export type Region = components['schemas']['Region']
export type Tenant = components['schemas']['Tenant']
export type AuditEntry = components['schemas']['AuditEntry']
export type ListMeta = components['schemas']['ListMeta']
export type ApiError = components['schemas']['Error']

// Finance (Wave-16 / A76)
export type FinanceTransaction = components['schemas']['FinanceTransaction']
export type FinanceTransactionKind = components['schemas']['FinanceTransactionKind']
export type FinanceTransactionStatus = components['schemas']['FinanceTransactionStatus']
export type FinanceTransactionCategory = components['schemas']['FinanceTransactionCategory']
export type FinanceCashflowPoint = components['schemas']['FinanceCashflowPoint']
export type FinanceKPI = components['schemas']['FinanceKPI']
export type FinanceAgingBucket = components['schemas']['FinanceAgingBucket']

// Calendar / Messages / Reports / Auth (Wave-16 / A78 — Faz 12.8 drift fix)
export type CalendarEvent = components['schemas']['CalendarEvent']
export type CalendarEventType = components['schemas']['CalendarEventType']
export type Conversation = components['schemas']['Conversation']
export type ConversationSummary = components['schemas']['ConversationSummary']
export type Message = components['schemas']['Message']
export type MessageChannel = components['schemas']['MessageChannel']
export type MessageSender = components['schemas']['MessageSender']
export type TeamRow = components['schemas']['TeamRow']
export type MonthlyClose = components['schemas']['MonthlyClose']
export type SourceRow = components['schemas']['SourceRow']
export type AuthLoginRequest = components['schemas']['AuthLoginRequest']
export type AuthLoginResponse = components['schemas']['AuthLoginResponse']
export type AuthMeResponse = components['schemas']['AuthMeResponse']
export type AuthRefreshResponse = components['schemas']['AuthRefreshResponse']
export type AuthSessionEnvelope = components['schemas']['AuthSessionEnvelope']

// Wave-18 / A88 — Faz 12.8.b — Schema completion (drift fix #2)
export type HealthResponse = components['schemas']['HealthResponse']
export type ListingStatusCounts = components['schemas']['ListingStatusCounts']
export type CustomerSegmentCounts = components['schemas']['CustomerSegmentCounts']
export type CustomerCreateInput = components['schemas']['CustomerCreateInput']
export type CustomerPatchInput = components['schemas']['CustomerPatchInput']
export type RateLimitHeaders = components['schemas']['RateLimitHeaders']
