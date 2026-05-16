// MCP Tool Registry (A02 — /mcp-tools)

export type McpToolStatus = 'enabled' | 'disabled' | 'beta' | 'deprecated'

export interface McpTool {
  id: string
  namespace: string
  name: string
  description: string
  schema: { input: string; output: string }
  status: McpToolStatus
  callsThisMonth: number
  avgLatencyMs: number
  errorRate: number
  category: 'data' | 'action' | 'analytics' | 'integration'
  registeredISO: string
  registeredBy: string
}

export const MCP_TOOLS: McpTool[] = [
  { id: 'mcp-listing-search', namespace: 'arsam.listing', name: 'search_listings', description: 'TR-aware arsa arama: il/ilçe/tip/fiyat filtreleri.', schema: { input: '{ city?, district?, type?, priceMax? }', output: '{ id, title, price, size, ... }[]' }, status: 'enabled', callsThisMonth: 18420, avgLatencyMs: 42, errorRate: 0.0012, category: 'data', registeredISO: '2026-02-14', registeredBy: 'arsam.net' },
  { id: 'mcp-listing-get', namespace: 'arsam.listing', name: 'get_listing', description: 'Tek ilan detayı (lat/lng dahil).', schema: { input: '{ id }', output: '{ ...listing, related: [...] }' }, status: 'enabled', callsThisMonth: 8240, avgLatencyMs: 28, errorRate: 0.0005, category: 'data', registeredISO: '2026-02-14', registeredBy: 'arsam.net' },
  { id: 'mcp-customer-search', namespace: 'arsam.customer', name: 'search_customers', description: 'Tenant-scope müşteri arama.', schema: { input: '{ q, segment? }', output: '{ id, name, ... }[]' }, status: 'enabled', callsThisMonth: 5120, avgLatencyMs: 38, errorRate: 0.0008, category: 'data', registeredISO: '2026-02-14', registeredBy: 'arsam.net' },
  { id: 'mcp-deal-create', namespace: 'arsam.sales', name: 'create_deal', description: 'Müşteri için yeni fırsat aç.', schema: { input: '{ customerId, listingId, value, stage }', output: '{ id, ... }' }, status: 'enabled', callsThisMonth: 410, avgLatencyMs: 65, errorRate: 0.0024, category: 'action', registeredISO: '2026-02-20', registeredBy: 'arsam.net' },
  { id: 'mcp-deal-move', namespace: 'arsam.sales', name: 'move_deal_stage', description: "Fırsatı pipeline'da bir sonraki aşamaya geçir.", schema: { input: '{ id, toStage }', output: '{ id, stage, ... }' }, status: 'enabled', callsThisMonth: 1820, avgLatencyMs: 48, errorRate: 0.0015, category: 'action', registeredISO: '2026-02-20', registeredBy: 'arsam.net' },
  { id: 'mcp-report-summary', namespace: 'arsam.report', name: 'get_monthly_summary', description: 'Bu ay performans + ciro + ekip + bölge özeti.', schema: { input: '{ month?, year? }', output: '{ kpis, charts: {...} }' }, status: 'enabled', callsThisMonth: 280, avgLatencyMs: 142, errorRate: 0.0034, category: 'analytics', registeredISO: '2026-02-22', registeredBy: 'arsam.net' },
  { id: 'mcp-sahibinden-publish', namespace: 'arsam.integration.sahibinden', name: 'publish_listing', description: "sahibinden.com'a ilan push.", schema: { input: '{ listingId }', output: '{ externalId, url }' }, status: 'beta', callsThisMonth: 89, avgLatencyMs: 920, errorRate: 0.018, category: 'integration', registeredISO: '2026-04-18', registeredBy: 'arsam.net' },
  { id: 'mcp-claude-completion', namespace: 'arsam.ai', name: 'claude_completion', description: 'Claude API wrapper (cost + audit).', schema: { input: '{ prompt, model? }', output: '{ text, usage }' }, status: 'enabled', callsThisMonth: 12480, avgLatencyMs: 2840, errorRate: 0.0006, category: 'integration', registeredISO: '2026-03-01', registeredBy: 'arsam.net' },
  { id: 'mcp-listing-old-search', namespace: 'arsam.listing.v1', name: 'search', description: 'Legacy v1 search — yeni proje search_listings kullanmalı.', schema: { input: '{ q }', output: '{ ... }' }, status: 'deprecated', callsThisMonth: 4, avgLatencyMs: 62, errorRate: 0.0012, category: 'data', registeredISO: '2025-11-04', registeredBy: 'arsam.net' },
]
