/**
 * Finance resource — transactions (paged), cashflow, kpis, pending-by-age.
 */
import type {
  FinanceAgingBucket,
  FinanceCashflowPoint,
  FinanceKPI,
  FinanceTransaction,
  operations,
} from '@landx/api-types'
import type { ItemResponse, ListResponse, Transport } from '../types'

export type FinanceTxListQuery = NonNullable<
  operations['listFinanceTransactions']['parameters']['query']
>

export type FinanceCashflowQuery = NonNullable<
  operations['getFinanceCashflow']['parameters']['query']
>

export function financeResource(t: Transport) {
  return {
    transactions: (params?: FinanceTxListQuery) =>
      t.get<ListResponse<FinanceTransaction>>(
        '/finance/transactions',
        params as Record<string, unknown> | undefined,
      ),
    cashflow: (params?: FinanceCashflowQuery) =>
      t.get<{ data: FinanceCashflowPoint[] }>(
        '/finance/cashflow',
        params as Record<string, unknown> | undefined,
      ),
    kpis: () => t.get<ItemResponse<FinanceKPI>>('/finance/kpis'),
    pendingByAge: () => t.get<{ data: FinanceAgingBucket[] }>('/finance/pending-by-age'),
  }
}

export type FinanceResource = ReturnType<typeof financeResource>
