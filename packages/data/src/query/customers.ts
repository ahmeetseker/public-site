import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { CUSTOMERS, SEGMENT_COUNTS } from '../mock/customers'
import type { Customer } from '../mock/types'
import { apiOrMock, landxApi } from '../api'
import { customerKeys, type CustomerFilters } from './keys'
import { mockAsync } from './mock-latency'

function applyFilters(rows: Customer[], f: CustomerFilters): Customer[] {
  let out = rows
  if (f.segment && f.segment !== 'Tümü') out = out.filter((c) => c.segment === f.segment)
  if (f.stage) out = out.filter((c) => c.stage === f.stage)
  if (f.search) {
    const q = f.search.toLocaleLowerCase('tr-TR')
    out = out.filter(
      (c) =>
        c.id.toLocaleLowerCase('tr-TR').includes(q) ||
        c.name.toLocaleLowerCase('tr-TR').includes(q) ||
        c.interestArea.toLocaleLowerCase('tr-TR').includes(q) ||
        c.owner.toLocaleLowerCase('tr-TR').includes(q) ||
        (c.notes ?? '').toLocaleLowerCase('tr-TR').includes(q),
    )
  }
  return out
}

type CustomersListQuery = Parameters<typeof landxApi.customers.list>[0]

function filtersToParams(f: CustomerFilters): CustomersListQuery {
  return {
    segment: f.segment && f.segment !== 'Tümü' ? f.segment : undefined,
    stage: f.stage,
    q: f.search,
  }
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () =>
      apiOrMock<Customer[]>(
        // Cast: SDK Customer has `notes?: string | null` per openapi nullable;
        // mock Customer has `notes?: string`. Otherwise identical. Drift fix
        // — adopt generated type in mock seed — lands in Wave 18.
        () => landxApi.customers.list(filtersToParams(filters)).then((env) => env.data as unknown as Customer[]),
        () => mockAsync(applyFilters(CUSTOMERS, filters)),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () =>
      apiOrMock<Customer | null>(
        () => landxApi.customers.get(id).then((env) => env.data as unknown as Customer),
        () => mockAsync(CUSTOMERS.find((c) => c.id === id) ?? null),
      ),
    enabled: !!id,
  })
}

export function useSegmentCounts() {
  return useQuery({
    queryKey: customerKeys.segmentCounts(),
    // No dedicated endpoint yet — keep the derived mock for now.
    queryFn: () => mockAsync(SEGMENT_COUNTS),
  })
}

export interface NewCustomerInput {
  name: string
  segment: Customer['segment']
  stage: Customer['stage']
  value: number
  source: Customer['source']
  owner: string
  interestArea: string
  phone?: string
  email?: string
  notes?: string
}

interface CreateCustomerContext {
  previous: Customer[] | undefined
  tempId: string
}

function buildCreatedCustomer(input: NewCustomerInput): Customer {
  return {
    id: `M-${Date.now().toString().slice(-4)}`,
    name: input.name,
    segment: input.segment,
    stage: input.stage,
    lastContact: new Date().toISOString(),
    value: input.value,
    source: input.source,
    owner: input.owner,
    interestArea: input.interestArea,
    notes: input.notes,
    phone: input.phone,
    email: input.email,
  }
}

/**
 * Optimistic create. Generates a temporary id, prepends to cache list,
 * rolls back on error, refetches on settle to get the real id.
 *
 * Wave-15 / Faz 12.2.a: mutationFn now goes through apiOrMock so a configured
 * app POSTs to /customers; tests and unconfigured callers fall back to a
 * synthesised mock entry. Optimistic flow (onMutate/onError/onSettled) is
 * untouched.
 */
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation<Customer, Error, NewCustomerInput, CreateCustomerContext>({
    mutationFn: (input) =>
      apiOrMock<Customer>(
        () =>
          landxApi.customers
            .create(input as Parameters<typeof landxApi.customers.create>[0])
            .then((env) => env.data as unknown as Customer),
        () => mockAsync(buildCreatedCustomer(input), 300),
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: customerKeys.lists() })
      const tempId = `TEMP.${Date.now()}`
      const previous = qc.getQueryData<Customer[]>(customerKeys.list({}))
      const tempCustomer: Customer = {
        id: tempId,
        name: input.name,
        segment: input.segment,
        stage: input.stage,
        lastContact: new Date().toISOString(),
        value: input.value,
        source: input.source,
        owner: input.owner,
        interestArea: input.interestArea,
        notes: input.notes,
        phone: input.phone,
        email: input.email,
      }
      qc.setQueryData<Customer[]>(customerKeys.list({}), (old = []) => [tempCustomer, ...old])
      return { previous, tempId }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(customerKeys.list({}), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export interface UpdateCustomerInput {
  id: string
  patch: Partial<
    Pick<
      Customer,
      | 'name'
      | 'segment'
      | 'stage'
      | 'value'
      | 'owner'
      | 'interestArea'
      | 'notes'
      | 'phone'
      | 'email'
    >
  >
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation<Customer, Error, UpdateCustomerInput>({
    mutationFn: ({ id, patch }) =>
      apiOrMock<Customer>(
        () => landxApi.customers.patch(id, patch).then((env) => env.data as unknown as Customer),
        () => {
          const current = CUSTOMERS.find((c) => c.id === id)
          if (!current) return Promise.reject(new Error(`Customer not found: ${id}`))
          const updated: Customer = {
            ...current,
            ...patch,
            lastContact: new Date().toISOString(),
          }
          return mockAsync(updated, 200)
        },
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiOrMock(
        () => landxApi.customers.remove(id),
        () => mockAsync(undefined, 150),
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
