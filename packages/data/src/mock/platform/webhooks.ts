// Webhook Hub (Faz 11.4 — /webhooks)

export type WebhookEvent =
  | 'listing.created' | 'listing.updated' | 'listing.published' | 'listing.deleted'
  | 'customer.created' | 'customer.stage_changed'
  | 'deal.created' | 'deal.won' | 'deal.lost'
  | 'transaction.captured' | 'transaction.failed'
  | 'audit.high_risk'

export interface WebhookEndpoint {
  id: string
  tenantId: string
  url: string
  events: WebhookEvent[]
  status: 'active' | 'paused' | 'failing'
  secretHint: string  // last 4 chars of signing secret
  createdISO: string
  lastDeliveryISO: string | null
  successRate30d: number  // 0-1
  totalDeliveries: number
  failureCount30d: number
}

export const WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  { id: 'whk-001', tenantId: 'atolye-ayv', url: 'https://atolye-ayv.example.com/hooks/arsam', events: ['listing.created', 'listing.updated', 'listing.published'], status: 'active', secretHint: '··· 4f2a', createdISO: '2026-03-14', lastDeliveryISO: '2026-05-11T08:42:00Z', successRate30d: 0.998, totalDeliveries: 1842, failureCount30d: 4 },
  { id: 'whk-002', tenantId: 'cesme-ars', url: 'https://hooks.cesmearsa.com/webhook', events: ['deal.won', 'transaction.captured'], status: 'active', secretHint: '··· 8c12', createdISO: '2026-02-08', lastDeliveryISO: '2026-05-11T11:00:00Z', successRate30d: 0.999, totalDeliveries: 842, failureCount30d: 1 },
  { id: 'whk-003', tenantId: 'bodrum-em', url: 'https://internal.bodrum-em.com/api/arsam-events', events: ['listing.created', 'listing.published', 'customer.stage_changed', 'deal.won', 'deal.lost'], status: 'failing', secretHint: '··· e019', createdISO: '2025-12-01', lastDeliveryISO: '2026-05-09T14:22:00Z', successRate30d: 0.62, totalDeliveries: 4218, failureCount30d: 1602 },
  { id: 'whk-004', tenantId: 'datca-koy', url: 'https://hooks.zapier.com/hooks/catch/12345/abcde', events: ['listing.published'], status: 'paused', secretHint: '··· 1a7b', createdISO: '2026-04-20', lastDeliveryISO: '2026-04-29T16:00:00Z', successRate30d: 1.0, totalDeliveries: 42, failureCount30d: 0 },
  { id: 'whk-005', tenantId: 'fethiye-pa', url: 'https://api.fethiyepano.com/v2/webhook', events: ['listing.created', 'customer.created'], status: 'active', secretHint: '··· 9d34', createdISO: '2026-01-30', lastDeliveryISO: '2026-05-10T22:14:00Z', successRate30d: 0.992, totalDeliveries: 312, failureCount30d: 2 },
]

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  status: 'success' | 'failed' | 'retrying'
  httpStatus: number | null
  attempts: number
  durationMs: number
  payloadSize: number  // bytes
  atISO: string
  errorMessage?: string
}

export const WEBHOOK_DELIVERIES: WebhookDelivery[] = [
  { id: 'dlv-2026-94821', webhookId: 'whk-001', event: 'listing.published', status: 'success', httpStatus: 200, attempts: 1, durationMs: 142, payloadSize: 1842, atISO: '2026-05-11T08:42:00Z' },
  { id: 'dlv-2026-94820', webhookId: 'whk-003', event: 'deal.won', status: 'failed', httpStatus: 502, attempts: 5, durationMs: 30000, payloadSize: 642, atISO: '2026-05-11T08:38:00Z', errorMessage: 'upstream timeout' },
  { id: 'dlv-2026-94819', webhookId: 'whk-002', event: 'transaction.captured', status: 'success', httpStatus: 200, attempts: 1, durationMs: 78, payloadSize: 1240, atISO: '2026-05-11T08:30:00Z' },
  { id: 'dlv-2026-94818', webhookId: 'whk-003', event: 'listing.published', status: 'retrying', httpStatus: 503, attempts: 3, durationMs: 142, payloadSize: 1842, atISO: '2026-05-11T08:24:00Z', errorMessage: 'rate limit (retry-after 60)' },
  { id: 'dlv-2026-94817', webhookId: 'whk-001', event: 'listing.updated', status: 'success', httpStatus: 200, attempts: 1, durationMs: 168, payloadSize: 2042, atISO: '2026-05-11T08:18:00Z' },
  { id: 'dlv-2026-94816', webhookId: 'whk-005', event: 'customer.created', status: 'success', httpStatus: 201, attempts: 1, durationMs: 212, payloadSize: 842, atISO: '2026-05-11T08:12:00Z' },
  { id: 'dlv-2026-94815', webhookId: 'whk-003', event: 'customer.stage_changed', status: 'failed', httpStatus: 500, attempts: 5, durationMs: 18420, payloadSize: 540, atISO: '2026-05-11T08:04:00Z', errorMessage: 'internal server error' },
  { id: 'dlv-2026-94814', webhookId: 'whk-001', event: 'listing.created', status: 'success', httpStatus: 200, attempts: 1, durationMs: 124, payloadSize: 1684, atISO: '2026-05-11T07:54:00Z' },
  { id: 'dlv-2026-94813', webhookId: 'whk-002', event: 'deal.won', status: 'success', httpStatus: 200, attempts: 2, durationMs: 248, payloadSize: 1140, atISO: '2026-05-11T07:42:00Z' },
  { id: 'dlv-2026-94812', webhookId: 'whk-003', event: 'listing.created', status: 'retrying', httpStatus: 503, attempts: 2, durationMs: 8420, payloadSize: 1842, atISO: '2026-05-11T07:30:00Z', errorMessage: 'service unavailable' },
]
