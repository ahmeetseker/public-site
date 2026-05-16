// Super-admin overview dashboard aggregates — Wave F3 / Agent-F3D.
//
// Cross-tenant KPI mocks for the index dashboard. Backed by `tenants` and
// `audit` mocks where possible (active tenant count, top-tenants table); the
// MAU + revenue history + SLO series are synthesised because we don't yet
// have a real metrics endpoint. Replaced by /platform/metrics in a later
// wave.

import { TENANTS } from './tenants'

export interface MonthlyRevenuePoint {
  month: string   // e.g. "2025-06"
  label: string   // e.g. "Haz"
  revenue: number // TL
}

export interface MauPoint {
  weekISO: string
  mau: number
}

export interface SloPoint {
  dayISO: string
  uptime: number // 0..1
}

// Last 12 months of platform revenue (TL). Trends gently up with a dip in Q1
// (post-holiday) and a strong April/May recovery — mirrors what the mock
// tenant MRR + transaction history would imply.
export const MONTHLY_REVENUE: MonthlyRevenuePoint[] = [
  { month: '2025-06', label: 'Haz', revenue: 28400 },
  { month: '2025-07', label: 'Tem', revenue: 31200 },
  { month: '2025-08', label: 'Ağu', revenue: 34800 },
  { month: '2025-09', label: 'Eyl', revenue: 38600 },
  { month: '2025-10', label: 'Eki', revenue: 42100 },
  { month: '2025-11', label: 'Kas', revenue: 45800 },
  { month: '2025-12', label: 'Ara', revenue: 51200 },
  { month: '2026-01', label: 'Oca', revenue: 48400 },
  { month: '2026-02', label: 'Şub', revenue: 49800 },
  { month: '2026-03', label: 'Mar', revenue: 53200 },
  { month: '2026-04', label: 'Nis', revenue: 56700 },
  { month: '2026-05', label: 'May', revenue: 59300 },
]

// 12-week MAU history (monthly active users across all tenants). Used as
// the MAU KPI sparkline source — last point is the current MAU value.
export const MAU_HISTORY: MauPoint[] = [
  { weekISO: '2026-02-23', mau: 184 },
  { weekISO: '2026-03-02', mau: 192 },
  { weekISO: '2026-03-09', mau: 201 },
  { weekISO: '2026-03-16', mau: 198 },
  { weekISO: '2026-03-23', mau: 213 },
  { weekISO: '2026-03-30', mau: 227 },
  { weekISO: '2026-04-06', mau: 234 },
  { weekISO: '2026-04-13', mau: 241 },
  { weekISO: '2026-04-20', mau: 248 },
  { weekISO: '2026-04-27', mau: 256 },
  { weekISO: '2026-05-04', mau: 262 },
  { weekISO: '2026-05-11', mau: 271 },
]

// 30-day rolling SLO (% uptime per day). Most days 100%, with two minor
// dips that we annotate via INCIDENTS below.
export const SLO_DAILY: SloPoint[] = [
  { dayISO: '2026-04-12', uptime: 1.0 },
  { dayISO: '2026-04-13', uptime: 1.0 },
  { dayISO: '2026-04-14', uptime: 0.9994 },
  { dayISO: '2026-04-15', uptime: 1.0 },
  { dayISO: '2026-04-16', uptime: 1.0 },
  { dayISO: '2026-04-17', uptime: 1.0 },
  { dayISO: '2026-04-18', uptime: 1.0 },
  { dayISO: '2026-04-19', uptime: 1.0 },
  { dayISO: '2026-04-20', uptime: 1.0 },
  { dayISO: '2026-04-21', uptime: 1.0 },
  { dayISO: '2026-04-22', uptime: 0.9978 },
  { dayISO: '2026-04-23', uptime: 1.0 },
  { dayISO: '2026-04-24', uptime: 1.0 },
  { dayISO: '2026-04-25', uptime: 1.0 },
  { dayISO: '2026-04-26', uptime: 1.0 },
  { dayISO: '2026-04-27', uptime: 1.0 },
  { dayISO: '2026-04-28', uptime: 1.0 },
  { dayISO: '2026-04-29', uptime: 1.0 },
  { dayISO: '2026-04-30', uptime: 1.0 },
  { dayISO: '2026-05-01', uptime: 1.0 },
  { dayISO: '2026-05-02', uptime: 1.0 },
  { dayISO: '2026-05-03', uptime: 0.9991 },
  { dayISO: '2026-05-04', uptime: 1.0 },
  { dayISO: '2026-05-05', uptime: 1.0 },
  { dayISO: '2026-05-06', uptime: 1.0 },
  { dayISO: '2026-05-07', uptime: 1.0 },
  { dayISO: '2026-05-08', uptime: 1.0 },
  { dayISO: '2026-05-09', uptime: 1.0 },
  { dayISO: '2026-05-10', uptime: 1.0 },
  { dayISO: '2026-05-11', uptime: 1.0 },
]

export const ACTIVE_ALERTS_COUNT = 1

// Average SLO across the 30-day window.
function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

export const SLO_UPTIME_30D = avg(SLO_DAILY.map((d) => d.uptime))

// Period-over-period deltas used for KPI cards. "Last period" = prior month
// for revenue, 4-weeks-ago for MAU, prior-30d uptime for SLO.
const lastRev = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1]!.revenue
const prevRev = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2]!.revenue
const lastMau = MAU_HISTORY[MAU_HISTORY.length - 1]!.mau
const prevMau = MAU_HISTORY[MAU_HISTORY.length - 5]?.mau ?? lastMau

export const KPI_DELTAS = {
  // Tenant count delta — vs a static "two weeks ago" snapshot.
  activeTenantsDelta: TENANTS.filter((t) => t.status === 'Aktif').length - 4,
  mauDelta: lastMau - prevMau,
  mauDeltaPct: prevMau > 0 ? ((lastMau - prevMau) / prevMau) * 100 : 0,
  revenueDelta: lastRev - prevRev,
  revenueDeltaPct: prevRev > 0 ? ((lastRev - prevRev) / prevRev) * 100 : 0,
  // SLO compared against the previous 30 days (synthetic baseline of 99.91%).
  sloDeltaPct: SLO_UPTIME_30D * 100 - 99.91,
} as const

// Pre-aggregated top-5-by-MRR — saves the route recomputing on each render
// and stays stable when filters reorder TENANTS at the hook layer.
export const TOP_TENANTS_BY_REVENUE = [...TENANTS]
  .sort((a, b) => b.mrr - a.mrr)
  .slice(0, 5)
