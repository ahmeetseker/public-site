import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type {
  FinanceTransaction,
  FinanceCashflowPoint,
  FinanceKPI,
} from '@landx/api-types'
import {
  TRANSACTIONS,
  CASHFLOW_6MO,
  pendingByAge,
  financeKpis,
} from '../mock/finance'
import type {
  Transaction,
  MonthlyCashflow,
  AgingBucket,
} from '../mock/finance'
import { apiOrMock, landxApi } from '../api'
import { transactionKeys, type TransactionFilters } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Hooks now go through
// `landxApi.finance.*`. apiOrMock wrapper + mock fallback stay.
//
// Wave 16 / Faz 12.6.finance — fetch swap. Endpoints land under
// `/finance/transactions`, `/finance/cashflow`, `/finance/pending-by-age`,
// `/finance/kpis`. Hooks stay backwards-compatible with the existing
// admin pages (which read `Transaction[]` / `MonthlyCashflow[]` /
// `AgingBucket[]` / `FinanceKpis` shapes from the mock module).
//
// Wave 19 / Faz 12.12.c — A88's openapi.yaml now exports the wire shapes
// directly: `FinanceTransaction` (income/expense + category), `FinanceCashflowPoint`
// (period/inflow/outflow/net), `FinanceKPI`, `FinanceAgingBucket`. We consume
// those contract types via @landx/api-types and project them back to the
// legacy domain shape (Transaction, MonthlyCashflow) so consumers don't churn.

function fromWireTransaction(w: FinanceTransaction): Transaction {
  const signedAmount = w.kind === 'expense' ? -Math.abs(w.amount) : Math.abs(w.amount)
  const base: Transaction = {
    id: w.id,
    date: w.date,
    type: w.category,
    status: w.status,
    party: w.party ?? '',
    description: w.description ?? '',
    amount: signedAmount,
  }
  if (w.dealId) base.dealId = w.dealId
  if (w.daysOverdue !== undefined && w.daysOverdue !== null) base.daysOverdue = w.daysOverdue
  return base
}

function fromWireCashflow(p: FinanceCashflowPoint): MonthlyCashflow {
  // Best-effort mapping back to the legacy MonthlyCashflow shape used by
  // chart components. Inflow ≈ tahsilat (komisyon merged); outflow → gider.
  const net = p.net ?? p.inflow - p.outflow
  return {
    month: p.period,
    tahsilat: p.inflow,
    komisyon: 0,
    gider: -Math.abs(p.outflow),
    net,
  }
}

function applyMockFilters(rows: Transaction[], f: TransactionFilters): Transaction[] {
  let out = rows
  if (f.type) out = out.filter((t) => t.type === f.type)
  if (f.status) out = out.filter((t) => t.status === f.status)
  return out
}

type FinanceTxQuery = Parameters<typeof landxApi.finance.transactions>[0]

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () =>
      apiOrMock(
        async () => {
          // Map legacy `type` filter (Tahsilat/Komisyon/Gider/Vergi) onto the
          // contract `kind` (income/expense). When the page wants a specific
          // category, we fetch by the umbrella kind and re-filter locally.
          const incomeTypes = new Set<Transaction['type']>(['Tahsilat', 'Komisyon'])
          const params: Record<string, unknown> = {}
          if (filters.type) {
            params.kind = incomeTypes.has(filters.type as Transaction['type'])
              ? 'income'
              : 'expense'
          }
          if (filters.status) params.status = filters.status
          const env = await landxApi.finance.transactions(
            params as FinanceTxQuery,
          )
          let rows = env.data.map(fromWireTransaction)
          if (filters.type) rows = rows.filter((t) => t.type === filters.type)
          return rows
        },
        () => mockAsync(applyMockFilters(TRANSACTIONS, filters)),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useCashflow() {
  return useQuery({
    queryKey: transactionKeys.cashflow(),
    queryFn: () =>
      apiOrMock(
        () =>
          landxApi.finance.cashflow().then((env) => env.data.map(fromWireCashflow)),
        () => mockAsync(CASHFLOW_6MO),
      ),
  })
}

export function usePendingByAge() {
  return useQuery<AgingBucket[]>({
    queryKey: transactionKeys.pendingByAge(),
    queryFn: () =>
      apiOrMock<AgingBucket[]>(
        () => landxApi.finance.pendingByAge().then((env) => env.data),
        () => mockAsync(pendingByAge()),
      ),
  })
}

export function useFinanceKpis() {
  return useQuery({
    queryKey: [...transactionKeys.all, 'kpis'] as const,
    queryFn: () =>
      apiOrMock(
        async () => {
          const env = await landxApi.finance.kpis()
          const k: FinanceKPI = env.data
          // Surface the legacy 4-key shape used by existing dashboards; fall
          // back to derived values if the server hasn't populated them.
          return {
            tahsilatBuMonth: k.tahsilatBuMonth ?? 0,
            komisyonBuMonth: k.komisyonBuMonth ?? 0,
            giderBuMonth: k.giderBuMonth ?? 0,
            bekleyen: k.bekleyen ?? 0,
          }
        },
        () => mockAsync(financeKpis()),
      ),
  })
}
