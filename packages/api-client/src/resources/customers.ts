/**
 * Customers resource — wraps GET/POST/PATCH/DELETE /customers.
 *
 * NB: the openapi spec only declares `GET /customers` + `GET /customers/{id}`
 * at the moment (Wave-17). The mutation methods POST a body conformant with
 * `components.schemas.Customer` because the mock API already accepts that
 * shape; once the spec gains `CustomerCreateInput`/`CustomerPatchInput`
 * (planned Wave 18), tighten these to the generated types.
 */
import type { Customer, operations } from '@landx/api-types'
import type { ItemResponse, ListResponse, Transport } from '../types'

export type CustomerListQuery = NonNullable<operations['listCustomers']['parameters']['query']>

export type CustomerCreateInput = Omit<Customer, 'id' | 'lastContact'> & {
  lastContact?: string
}

export type CustomerPatchInput = Partial<
  Pick<
    Customer,
    'name' | 'segment' | 'stage' | 'value' | 'owner' | 'interestArea' | 'notes'
  >
>

export function customersResource(t: Transport) {
  return {
    list: (params?: CustomerListQuery) =>
      t.get<ListResponse<Customer>>('/customers', params as Record<string, unknown> | undefined),
    get: (id: string) =>
      t.get<ItemResponse<Customer>>(`/customers/${encodeURIComponent(id)}`),
    create: (input: CustomerCreateInput) =>
      t.post<ItemResponse<Customer>>('/customers', input),
    patch: (id: string, input: CustomerPatchInput) =>
      t.patch<ItemResponse<Customer>>(`/customers/${encodeURIComponent(id)}`, input),
    remove: (id: string) => t.del(`/customers/${encodeURIComponent(id)}`),
  }
}

export type CustomersResource = ReturnType<typeof customersResource>
