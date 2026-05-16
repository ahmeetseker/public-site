// Observability — service health + incidents.
// Will be replaced by real APIs in O01 Observability.

export interface ServiceHealth {
  service: string
  uptime: number      // percentage 0-100
  errorRate: number   // ratio 0-1
  p50: number         // ms
  p95: number         // ms
}

export const SERVICE_HEALTH: ServiceHealth[] = [
  { service: 'api-gateway',        uptime: 99.98, errorRate: 0.0008, p50:  28, p95: 142 },
  { service: 'listing-service',    uptime: 99.95, errorRate: 0.0012, p50:  42, p95: 218 },
  { service: 'auth-service',       uptime: 99.99, errorRate: 0.0003, p50:  18, p95:  89 },
  { service: 'search-service',     uptime: 99.87, errorRate: 0.0034, p50:  86, p95: 412 },
  { service: 'image-cdn',          uptime: 99.99, errorRate: 0.0002, p50:  12, p95:  62 },
  { service: 'webhook-dispatcher', uptime: 99.72, errorRate: 0.0089, p50: 124, p95: 920 },
]

export const OVERALL_UPTIME =
  SERVICE_HEALTH.reduce((s, x) => s + x.uptime, 0) / SERVICE_HEALTH.length
export const MAX_P95 = Math.max(...SERVICE_HEALTH.map((s) => s.p95))

export interface Incident {
  id: string
  service: string
  severity: 'SEV1' | 'SEV2' | 'SEV3'
  startedISO: string
  resolvedISO: string | null
  durationMin: number | null
  summary: string
}

export const INCIDENTS: Incident[] = [
  { id: 'INC-2026-0142', service: 'search-service',     severity: 'SEV2', startedISO: '2026-05-09T14:22:00Z', resolvedISO: '2026-05-09T15:08:00Z', durationMin: 46, summary: 'Elasticsearch query timeout — index rebuild triggered' },
  { id: 'INC-2026-0141', service: 'webhook-dispatcher', severity: 'SEV3', startedISO: '2026-05-08T09:15:00Z', resolvedISO: '2026-05-08T10:42:00Z', durationMin: 87, summary: 'Webhook retry storm — backoff config adjusted' },
  { id: 'INC-2026-0140', service: 'listing-service',    severity: 'SEV2', startedISO: '2026-05-04T22:30:00Z', resolvedISO: '2026-05-04T23:11:00Z', durationMin: 41, summary: 'DB connection pool exhaustion during peak hours' },
  { id: 'INC-2026-0139', service: 'api-gateway',        severity: 'SEV1', startedISO: '2026-04-28T11:00:00Z', resolvedISO: '2026-04-28T11:18:00Z', durationMin: 18, summary: 'Cloudflare WAF rule deployment caused 502s — rollback' },
]

export const MTTR_MIN = Math.round(
  INCIDENTS.filter((i) => i.durationMin !== null).reduce((s, i) => s + (i.durationMin ?? 0), 0) /
    INCIDENTS.filter((i) => i.durationMin !== null).length,
)
