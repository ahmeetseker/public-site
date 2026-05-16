/**
 * Mock seed — admin SLO metrics (Wave F35 / Faz 1C).
 *
 * 6 service × 30 günlük trend × 2-4 alert. Deterministik (service id'sinden hash).
 *
 * Service'ler:
 *   - api-gateway   (target 0.999)
 *   - auth-service  (target 0.999)
 *   - listings      (target 0.995)
 *   - search        (target 0.995)
 *   - ai-runtime    (target 0.99)
 *   - billing       (target 0.999)
 */

import type { AdminSloAlert, AdminSloAlertLevel, AdminSloMetric, AdminSloTrendPoint } from '../types/admin-agent'

interface ServiceConfig {
  service: string
  targetUptime: number
  /** Anlık uptime (target'a göre cushion). */
  currentUptime: number
  budgetRemainingPct: number
  alertSeed: ReadonlyArray<{ level: AdminSloAlertLevel; message: string; daysAgo: number }>
}

const SERVICES: ReadonlyArray<ServiceConfig> = [
  {
    service: 'api-gateway',
    targetUptime: 0.999,
    currentUptime: 0.9991,
    budgetRemainingPct: 62,
    alertSeed: [
      { level: 'warn', message: 'p99 latency > 800ms (last 15 min)', daysAgo: 0 },
      { level: 'crit', message: '5xx oranı %0.4 — eşik %0.3', daysAgo: 2 },
    ],
  },
  {
    service: 'auth-service',
    targetUptime: 0.999,
    currentUptime: 0.9988,
    budgetRemainingPct: 38,
    alertSeed: [
      { level: 'crit', message: 'JWT refresh hatası %1.2', daysAgo: 1 },
      { level: 'warn', message: 'Login latency > 600ms', daysAgo: 3 },
      { level: 'warn', message: 'Bot girişi şüphesi (5 IP)', daysAgo: 5 },
    ],
  },
  {
    service: 'listings',
    targetUptime: 0.995,
    currentUptime: 0.9962,
    budgetRemainingPct: 78,
    alertSeed: [
      { level: 'warn', message: 'Index lag > 5 dk (Elasticsearch)', daysAgo: 4 },
    ],
  },
  {
    service: 'search',
    targetUptime: 0.995,
    currentUptime: 0.9971,
    budgetRemainingPct: 84,
    alertSeed: [
      { level: 'warn', message: 'Slow query log: 12 entry son saatte', daysAgo: 0 },
      { level: 'warn', message: 'Cache hit ratio %72 (eşik %85)', daysAgo: 6 },
    ],
  },
  {
    service: 'ai-runtime',
    targetUptime: 0.99,
    currentUptime: 0.9921,
    budgetRemainingPct: 51,
    alertSeed: [
      { level: 'crit', message: 'OpenAI rate limit hit (3 deneme)', daysAgo: 0 },
      { level: 'crit', message: 'Vector DB query timeout', daysAgo: 1 },
      { level: 'warn', message: 'Token maliyeti son 24s %18 ↑', daysAgo: 2 },
      { level: 'warn', message: 'Embedding cache evict oranı yüksek', daysAgo: 7 },
    ],
  },
  {
    service: 'billing',
    targetUptime: 0.999,
    currentUptime: 0.9994,
    budgetRemainingPct: 71,
    alertSeed: [
      { level: 'warn', message: 'Iyzico webhook gecikmesi (45s)', daysAgo: 1 },
      { level: 'warn', message: 'Fatura PDF generation queue lag', daysAgo: 3 },
    ],
  },
]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function isoDayDate(daysAgo: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

/** Deterministik 30 günlük trend — target'a yakın salınım. */
function buildTrend(service: string, target: number): ReadonlyArray<AdminSloTrendPoint> {
  const out: AdminSloTrendPoint[] = []
  const baseHash = hash(service)
  for (let day = 29; day >= 0; day--) {
    const j = (baseHash + day * 17) % 100
    // ±0.2% etrafında salınım, target'a göre cushion korunur.
    const delta = (j - 50) / 25_000
    const uptime = Math.max(0.9, Math.min(0.9999, target + delta + 0.001))
    out.push({
      date: isoDayDate(day),
      uptime: Number(uptime.toFixed(5)),
    })
  }
  return out
}

function buildMetrics(): ReadonlyArray<AdminSloMetric> {
  return SERVICES.map((cfg): AdminSloMetric => {
    const alerts: AdminSloAlert[] = cfg.alertSeed.map((a) => ({
      level: a.level,
      message: a.message,
      at: isoDaysAgo(a.daysAgo),
    }))
    return {
      service: cfg.service,
      targetUptime: cfg.targetUptime,
      currentUptime: cfg.currentUptime,
      budgetRemainingPct: cfg.budgetRemainingPct,
      alerts,
      trend: buildTrend(cfg.service, cfg.targetUptime),
    }
  })
}

export const ADMIN_SLO_METRICS: ReadonlyArray<AdminSloMetric> = buildMetrics()
