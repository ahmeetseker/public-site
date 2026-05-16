/**
 * Mock seed — agent traces (Wave F35 / Faz 1C).
 *
 * 30 trace, her birinde 4-12 span. Span isimleri:
 *   - llm.completion        (her trace'te 1-3)
 *   - tool.search_listings  (opsiyonel)
 *   - tool.get_valuation    (opsiyonel)
 *   - tool.read_tapu        (opsiyonel)
 *   - vector.search         (opsiyonel)
 *   - retry                 (opsiyonel — error sonrası)
 *
 * Cost: USD × 10000 (örn. $0.0234 → 234 cents-of-cent).
 *
 * F35 Faz 2 `/agent-memory` veya `/agent-traces` route'u trace timeline,
 * span detail ve cost breakdown için bu seed'i tüketir.
 */

import type { AgentSpanStatus, AgentTrace, AgentTraceSpan } from '../types/admin-agent'

const SPAN_NAMES = [
  'llm.completion',
  'tool.search_listings',
  'tool.get_valuation',
  'tool.read_tapu',
  'vector.search',
  'tool.score_lead',
  'tool.send_notification',
  'retry',
] as const

const AGENT_IDS = [
  'agent:chat-default',
  'agent:lead-scorer',
  'agent:doc-extractor',
  'agent:notification-router',
] as const

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function hashString(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function isoHoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

function buildSpans(traceId: string): { spans: ReadonlyArray<AgentTraceSpan>; totalDurationMs: number; totalTokens: number } {
  const h = hashString(traceId)
  const spanCount = 4 + (h % 9) // 4-12
  const spans: AgentTraceSpan[] = []
  let cursor = 0
  let totalTokens = 0

  for (let i = 0; i < spanCount; i++) {
    const j = hashString(`${traceId}:s${i}`)
    const name = SPAN_NAMES[j % SPAN_NAMES.length]!
    const isError = i > 0 && (j >> 7) % 17 === 0 // ~6% error
    const status: AgentSpanStatus = isError ? 'error' : 'ok'
    // LLM ve vector daha pahalı (ms-cinsinden), tool çağrıları kısa.
    const baseDuration =
      name === 'llm.completion'
        ? 600 + (j % 1400)
        : name === 'vector.search'
          ? 80 + (j % 220)
          : name === 'retry'
            ? 200 + (j % 400)
            : 40 + (j % 180)
    const durationMs = isError ? Math.round(baseDuration * 0.4) : baseDuration

    // Token gerçek mock — sadece llm.completion'da
    if (name === 'llm.completion') {
      totalTokens += 220 + (j % 980)
    }

    spans.push({
      name,
      startMs: cursor,
      durationMs,
      status,
      metadata: name === 'llm.completion'
        ? { model: 'claude-3-5-sonnet', promptTokens: 120 + (j % 400), completionTokens: 80 + (j % 600) }
        : name === 'tool.search_listings'
          ? { resultCount: (j % 60) + 5 }
          : name === 'tool.get_valuation'
            ? { listingId: `LST-${pad((j % 9000) + 1000, 4)}` }
            : name === 'tool.read_tapu'
              ? { ocrConfidence: Number((0.65 + ((j % 30) / 100)).toFixed(2)) }
              : undefined,
    })
    cursor += durationMs + (j % 30)
  }

  return { spans, totalDurationMs: cursor, totalTokens }
}

function buildTraces(): ReadonlyArray<AgentTrace> {
  const out: AgentTrace[] = []
  for (let i = 1; i <= 30; i++) {
    const id = `TRC-${pad(i, 4)}`
    const h = hashString(id)
    const agentId = AGENT_IDS[h % AGENT_IDS.length]!
    const conversationId = `CONV-${pad((h >> 3) % 240, 4)}`
    const ageHours = h % (24 * 7) // son 7 gün
    const { spans, totalDurationMs, totalTokens } = buildSpans(id)
    // Cost: $0.003 / 1k token × 10000 → 30 / 1000 token. Round.
    const cost = Math.round(totalTokens * 0.03)

    out.push({
      id,
      agentId,
      conversationId,
      spans,
      totalDurationMs,
      totalTokens,
      cost,
      createdAt: isoHoursAgo(ageHours),
    })
  }
  return out
}

export const AGENT_TRACES: ReadonlyArray<AgentTrace> = buildTraces()
