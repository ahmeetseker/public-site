// LLM cost — spend by tenant + monthly trend.
// Will be replaced by real APIs in A08 LLM Observability.

export type LlmModel =
  | 'claude-sonnet-4.6'
  | 'claude-opus-4.7'
  | 'gpt-4o'
  | 'gpt-5'
  | 'gemini-2.5-pro'

export interface LlmSpend {
  tenant: string  // tenant.name
  model: LlmModel
  inputTokens: number
  outputTokens: number
  costUSD: number
}

export const LLM_SPEND_BY_TENANT: LlmSpend[] = [
  { tenant: 'Bodrum Emlak Network',   model: 'claude-sonnet-4.6', inputTokens: 4_200_000, outputTokens: 380_000, costUSD: 18.42 },
  { tenant: 'Çeşme Arsa Merkezi',     model: 'claude-sonnet-4.6', inputTokens: 3_100_000, outputTokens: 290_000, costUSD: 13.78 },
  { tenant: 'Atölye Emlak Ayvalık',   model: 'claude-sonnet-4.6', inputTokens: 1_800_000, outputTokens: 165_000, costUSD:  7.92 },
  { tenant: 'Fethiye Panorama',       model: 'claude-sonnet-4.6', inputTokens: 1_400_000, outputTokens: 130_000, costUSD:  6.18 },
  { tenant: 'Datça Koy Arsa',         model: 'claude-sonnet-4.6', inputTokens:   480_000, outputTokens:  45_000, costUSD:  2.14 },
  { tenant: 'Bodrum Emlak Network',   model: 'claude-opus-4.7',   inputTokens:   180_000, outputTokens:  22_000, costUSD:  5.94 },
  { tenant: 'Çeşme Arsa Merkezi',     model: 'gpt-4o',            inputTokens:   240_000, outputTokens:  28_000, costUSD:  1.84 },
]

export const TOTAL_LLM_COST_USD = LLM_SPEND_BY_TENANT.reduce((s, r) => s + r.costUSD, 0)

// Aggregate by tenant
export interface TenantSpendAgg {
  tenant: string
  costUSD: number
  totalTokens: number
  modelCount: number
}

export const SPEND_BY_TENANT_AGG: TenantSpendAgg[] = (() => {
  const map = new Map<string, TenantSpendAgg>()
  for (const r of LLM_SPEND_BY_TENANT) {
    const prev = map.get(r.tenant) ?? { tenant: r.tenant, costUSD: 0, totalTokens: 0, modelCount: 0 }
    map.set(r.tenant, {
      tenant: r.tenant,
      costUSD: prev.costUSD + r.costUSD,
      totalTokens: prev.totalTokens + r.inputTokens + r.outputTokens,
      modelCount: prev.modelCount + 1,
    })
  }
  return Array.from(map.values()).sort((a, b) => b.costUSD - a.costUSD)
})()

// Aggregate by model
export interface ModelSpendAgg {
  model: LlmModel
  costUSD: number
  share: number  // 0-1
}

export const SPEND_BY_MODEL_AGG: ModelSpendAgg[] = (() => {
  const map = new Map<LlmModel, number>()
  for (const r of LLM_SPEND_BY_TENANT) {
    map.set(r.model, (map.get(r.model) ?? 0) + r.costUSD)
  }
  return Array.from(map.entries())
    .map(([model, costUSD]) => ({ model, costUSD, share: costUSD / TOTAL_LLM_COST_USD }))
    .sort((a, b) => b.costUSD - a.costUSD)
})()

// Monthly trend (last 6 months, USD)
export interface MonthlyCost {
  month: string
  cost: number
}

export const LLM_MONTHLY_TREND: MonthlyCost[] = [
  { month: 'Ara', cost: 28.4 },
  { month: 'Oca', cost: 32.1 },
  { month: 'Şub', cost: 38.7 },
  { month: 'Mar', cost: 42.3 },
  { month: 'Nis', cost: 51.8 },
  { month: 'May', cost: 56.2 },
]
