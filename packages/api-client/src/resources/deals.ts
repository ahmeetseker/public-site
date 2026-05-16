/**
 * Deals resource — only `list` and `move` are declared in the spec today.
 * `move` posts `{ toStage }` to /deals/{id}/move and returns the updated deal.
 */
import type { CustomerStage, Deal } from '@landx/api-types'
import type { ItemResponse, Transport } from '../types'

export interface DealListResponse {
  data: Deal[]
}

export function dealsResource(t: Transport) {
  return {
    list: () => t.get<DealListResponse>('/deals'),
    move: (id: string, toStage: CustomerStage) =>
      t.post<ItemResponse<Deal>>(`/deals/${encodeURIComponent(id)}/move`, { toStage }),
  }
}

export type DealsResource = ReturnType<typeof dealsResource>
